import { useState } from 'react'
import { addVendor } from '@/lib/services/supabase/vendors'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function AddVendorDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gstin, setGstin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await addVendor({
      user_id: '', // Fill from session
      name,
      category,
      phone,
      email,
      gstin,
    })
    setLoading(false)
    setOpen(false)
    setName('')
    setCategory('')
    setPhone('')
    setEmail('')
    setGstin('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add Vendor</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
        </DialogHeader>
        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
