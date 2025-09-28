import { useState } from 'react'
import { uploadVendorQuotation } from '@/lib/services/supabase/vendors'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function UploadVendorQuotationDialog({ vendorId, projectId, onSuccess }: { vendorId: string, projectId: string, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await uploadVendorQuotation(vendorId, projectId, fileUrl, description)
    setLoading(false)
    setOpen(false)
    setFileUrl('')
    setDescription('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Upload Vendor Quotation</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Vendor Quotation</DialogTitle>
        </DialogHeader>
        <Input placeholder="File URL" value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
        <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
