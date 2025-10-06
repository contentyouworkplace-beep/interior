/**
 * Portfolio Upload Test Component
 * Drop this component into any page to quickly test portfolio file uploads
 * 
 * Usage:
 * import { PortfolioUploadTest } from '@/components/portfolio-upload-test'
 * 
 * <PortfolioUploadTest projectId="your-project-id" />
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { PortfolioService } from '@/lib/services/portfolio-service'
import { toast } from 'sonner'

interface Props {
  projectId: string
}

export function PortfolioUploadTest({ projectId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      console.log('🧪 Starting test upload...')
      console.log('📁 File:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      console.log('📦 Project ID:', projectId)

      const response = await PortfolioService.uploadMedia({
        project_id: projectId,
        file,
        title: `Test Upload - ${file.name}`,
        description: 'Testing portfolio upload functionality',
        is_featured: false
      })

      if (response.success) {
        console.log('✅ Upload successful:', response.media)
        
        setResult({
          success: true,
          message: 'Upload successful!',
          details: {
            id: response.media?.id,
            filename: response.media?.filename,
            thumbnail: response.media?.thumbnail_path,
            size: file.size,
            type: file.type
          }
        })

        toast.success('Upload successful!', {
          description: `File: ${file.name}`
        })
      } else {
        console.error('❌ Upload failed:', response.error)
        
        setResult({
          success: false,
          message: response.error || 'Upload failed',
        })

        toast.error('Upload failed', {
          description: response.error
        })
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      })

      toast.error('Unexpected error', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">🧪 Portfolio Upload Test</h3>
        <p className="text-sm text-muted-foreground">
          Test file uploads to portfolio-media bucket
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Project ID:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{projectId}</code>
        </div>
      </div>

      <div className="space-y-4">
        <label>
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            disabled={uploading}
            className="w-full"
            onClick={(e) => {
              e.currentTarget.previousElementSibling?.dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              )
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select File to Upload
              </>
            )}
          </Button>
        </label>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 space-y-2">
                <p className="font-medium">{result.message}</p>
                
                {result.details && (
                  <div className="text-xs space-y-1 font-mono">
                    {Object.entries(result.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          ✅ Check browser console for detailed logs
          <br />
          ✅ Check Supabase Dashboard → Storage → portfolio-media
          <br />
          ✅ Look for files in: projects/{projectId}/
        </p>
      </div>
    </Card>
  )
}
