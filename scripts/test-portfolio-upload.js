// Test portfolio creation and file upload
// Usage: node scripts/test-portfolio-upload.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'
const bucket = 'portfolio-media'

const supabase = createClient(url, key)

async function testPortfolioFlow() {
  console.log('🎯 Testing portfolio creation and upload flow...')
  
  try {
    // 1. Create a test project
    console.log('\n1. Creating portfolio project...')
    const { data: project, error: projectErr } = await supabase
      .from('portfolio_projects')
      .insert([{
        title: 'Test Portfolio Project',
        category: 'residential', 
        description: 'Test project for upload verification',
        status: 'published',
        featured: false,
        sort_order: 1,
        is_public: false,
        user_id: '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
      }])
      .select()
      .single()
    
    if (projectErr) {
      console.error('❌ Project creation failed:', projectErr)
      return
    }
    
    console.log('✅ Project created:', project.id)
    
    // 2. Create a test file
    const testContent = `Hello from test upload at ${new Date().toISOString()}\nThis is a test portfolio file.`
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    // 3. Upload file to storage
    const fileName = `test-document-${Date.now()}.txt`
    const storagePath = `projects/${project.id}/${fileName}`
    
    console.log('\n2. Uploading test file...')
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, testFile, { 
        contentType: 'text/plain',
        upsert: false,
        cacheControl: '3600'
      })
    
    if (uploadErr) {
      console.error('❌ Upload failed:', uploadErr)
      return
    }
    
    console.log('✅ File uploaded to:', storagePath)
    
    // 4. Create media record
    console.log('\n3. Creating media metadata...')
    const { data: media, error: mediaErr } = await supabase
      .from('portfolio_media')
      .insert([{
        project_id: project.id,
        filename: fileName,
        original_filename: 'test-document.txt',
        file_type: 'image', // treating as image-like for gallery
        mime_type: 'text/plain',
        file_size: testContent.length,
        storage_bucket: bucket,
        storage_path: storagePath,
        title: 'Test Document',
        description: 'Test file for portfolio upload verification',
        sort_order: 1,
        is_featured: false,
        user_id: '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
      }])
      .select()
      .single()
    
    if (mediaErr) {
      console.error('❌ Media record failed:', mediaErr)
      return
    }
    
    console.log('✅ Media record created:', media.id)
    
    // 5. Test signed URL
    console.log('\n4. Generating signed URL...')
    const { data: signed, error: urlErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600)
    
    if (urlErr) {
      console.error('❌ Signed URL failed:', urlErr)
      return
    }
    
    console.log('✅ Signed URL:', signed.signedUrl)
    
    // 6. Fetch project with media
    console.log('\n5. Fetching project with media...')
    const { data: projectWithMedia, error: fetchErr } = await supabase
      .from('portfolio_projects')
      .select('*, media:portfolio_media(*)')
      .eq('id', project.id)
      .single()
    
    if (fetchErr) {
      console.error('❌ Fetch failed:', fetchErr)
      return
    }
    
    console.log('✅ Project fetched with media count:', projectWithMedia.media?.length || 0)
    
    // 7. Cleanup
    console.log('\n6. Cleaning up...')
    await supabase.from('portfolio_media').delete().eq('project_id', project.id)
    await supabase.from('portfolio_projects').delete().eq('id', project.id)
    await supabase.storage.from(bucket).remove([storagePath])
    
    console.log('✅ Cleanup completed')
    console.log('\n🎉 Portfolio upload flow test PASSED!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testPortfolioFlow()