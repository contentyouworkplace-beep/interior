import { createClient } from '@/lib/supabase/client'

export type BrandFileKind = 'logo' | 'signature' | 'qr_code'

interface UploadResult {
  url?: string
  path?: string
  error?: string
}

const MAX_SIZE_BYTES: Record<BrandFileKind, number> = {
  logo: 2 * 1024 * 1024,       // 2MB
  signature: 1 * 1024 * 1024,  // 1MB
  qr_code: 1 * 1024 * 1024     // 1MB
}

const BUCKET: Record<BrandFileKind, string> = {
  logo: 'branding',
  signature: 'branding',
  qr_code: 'qr-codes'
}

const FOLDER: Record<BrandFileKind, string> = {
  logo: 'logos',
  signature: 'signatures',
  qr_code: 'qr_codes'
}

export async function uploadBrandFile(kind: BrandFileKind, orgId: string, file: File, previousUrl?: string): Promise<UploadResult> {
  try {
    if (!orgId) return { error: 'Missing organization id' }
    if (!file) return { error: 'No file provided' }

    // Size validation
    const maxSize = MAX_SIZE_BYTES[kind]
    if (file.size > maxSize) {
      const fileTypeName = kind === 'logo' ? 'Logo' : kind === 'signature' ? 'Signature' : 'QR Code'
      return { error: `${fileTypeName} exceeds size limit (${(maxSize/1024/1024).toFixed(0)}MB)` }
    }

    const supabase = createClient()

    // Derive extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${FOLDER[kind]}/${orgId}/${timestamp}-${safeName}`
    const bucketName = BUCKET[kind]

    // Optional: delete previous file if same bucket & path pattern
    if (previousUrl) {
      const urlParts = previousUrl.split('/')
      const idx = urlParts.findIndex(p => p === bucketName)
      if (idx !== -1) {
        const storagePath = urlParts.slice(idx + 1).join('/')
        if (storagePath && storagePath.startsWith(FOLDER[kind])) {
          await supabase.storage.from(bucketName).remove([storagePath])
        }
      }
    }

    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(path, file, { upsert: false, contentType: file.type || `image/${ext}` })

    if (uploadError) {
      console.error('Upload error', uploadError)
      
      // For QR codes, try service endpoint as fallback
      if (kind === 'qr_code' && uploadError.message?.includes('violates row-level security')) {
        console.log('Trying QR upload via service endpoint...')
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('orgId', orgId)

          const response = await fetch('/api/upload-qr-service', {
            method: 'POST',
            body: formData
          })

          const result = await response.json()
          if (result.success) {
            return { url: result.url, path: result.path }
          } else {
            return { error: result.error || 'Service upload failed' }
          }
        } catch (serviceError) {
          console.error('Service upload error:', serviceError)
          return { error: 'Failed to upload file' }
        }
      }
      
      return { error: 'Failed to upload file' }
    }

    // Get public URL (assuming bucket is public) or signed URL otherwise
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)

    return { url: data.publicUrl, path }
  } catch (e) {
    console.error(e)
    return { error: 'Unexpected upload error' }
  }
}
