import { useState } from 'react'
import { linkVendorToProject } from '@/lib/services/supabase/vendors'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function LinkVendorProjectDialog({ projectId, onSuccess }: { projectId: string, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await linkVendorToProject(vendorId, projectId)
    setLoading(false)
    setOpen(false)
    setVendorId('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Link Vendor to Project</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Vendor to Project</DialogTitle>
        </DialogHeader>
        <Input placeholder="Vendor ID" value={vendorId} onChange={e => setVendorId(e.target.value)} />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
