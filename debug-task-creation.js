const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugTaskCreation() {
  console.log('🔍 Debugging task creation flow...\n')
  
  try {
    // 1. Check if project_tasks table exists and has phase_id column
    console.log('1. Checking project_tasks table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('project_tasks')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error accessing project_tasks table:', tableError)
      return
    }
    console.log('✅ project_tasks table accessible')
    
    // 2. Check project_phases table
    console.log('\n2. Checking project_phases table...')
    const { data: phases, error: phaseError } = await supabase
      .from('project_phases')
      .select('*')
      .limit(5)
    
    if (phaseError) {
      console.error('❌ Error accessing project_phases:', phaseError)
      return
    }
    console.log('✅ Found phases:', phases?.length || 0)
    if (phases && phases.length > 0) {
      console.log('Sample phase:', phases[0])
    }
    
    // 3. Check projects
    console.log('\n3. Checking projects...')
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(3)
    
    if (projectError) {
      console.error('❌ Error accessing projects:', projectError)
      return
    }
    console.log('✅ Found projects:', projects?.length || 0)
    
    if (projects && projects.length > 0) {
      const testProject = projects[0]
      console.log('Test project:', testProject)
      
      // 4. Get phases for this project
      console.log('\n4. Getting phases for test project...')
      const { data: projectPhases, error: projectPhaseError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', testProject.id)
        .order('position')
      
      if (projectPhaseError) {
        console.error('❌ Error getting project phases:', projectPhaseError)
        return
      }
      
      console.log('✅ Project phases:', projectPhases?.length || 0)
      if (projectPhases && projectPhases.length > 0) {
        console.log('First phase (Int):', projectPhases[0])
        
        // 5. Try to create a test task
        console.log('\n5. Attempting to create test task...')
        const testTask = {
          project_id: testProject.id,
          phase_id: projectPhases[0].id,
          name: 'Test Task for Int',
          description: 'Testing task creation',
          status: 'pending',
          priority: 'medium',
          estimated_hours: 2,
          actual_hours: 0,
          completion_percentage: 0
        }
        
        console.log('Task payload:', testTask)
        
        const { data: newTask, error: createError } = await supabase
          .from('project_tasks')
          .insert(testTask)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Task creation failed:', createError)
          console.error('Error details:', JSON.stringify(createError, null, 2))
        } else {
          console.log('✅ Task created successfully:', newTask)
          
          // Clean up test task
          await supabase
            .from('project_tasks')
            .delete()
            .eq('id', newTask.id)
          console.log('🧹 Test task cleaned up')
        }
      }
    }
    
    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, cmd, qual 
              FROM pg_policies 
              WHERE tablename IN ('project_tasks', 'project_phases', 'projects')` 
      })
    
    if (!policyError && policies) {
      console.log('✅ RLS policies found:', policies.length)
      policies.forEach(p => {
        console.log(`- ${p.tablename}: ${p.policyname} (${p.cmd})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugTaskCreation()