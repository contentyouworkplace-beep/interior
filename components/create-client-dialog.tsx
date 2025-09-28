"use client"
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface CreateClientDialogProps {
  onCreated?: (client: any) => void
  trigger?: React.ReactNode
}

export function CreateClientDialog({ onCreated, trigger }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    gstin: ''
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      if (!form.first_name || !form.email) {
        toast.error('First name & email required')
        return
      }
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          user_id: user.id,
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company,
          email: form.email,
            phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip_code: form.zip_code,
          gstin: form.gstin
        }])
        .select('*')
        .single()

      if (error) throw error

      toast.success('Client created')
      onCreated?.(data)
      setOpen(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1"/>New Client</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 space-y-2">
            <Label>First Name *</Label>
            <Input value={form.first_name} onChange={e=>handleChange('first_name', e.target.value)} />
          </div>
          <div className="col-span-1 space-y-2">
            <Label>Last Name</Label>
            <Input value={form.last_name} onChange={e=>handleChange('last_name', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Company</Label>
            <Input value={form.company} onChange={e=>handleChange('company', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={e=>handleChange('email', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e=>handleChange('phone', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Address</Label>
            <Textarea rows={2} value={form.address} onChange={e=>handleChange('address', e.target.value)} />
          </div>
          <div className="col-span-1 space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={e=>handleChange('city', e.target.value)} />
          </div>
          <div className="col-span-1 space-y-2">
            <Label>State</Label>
            <Input value={form.state} onChange={e=>handleChange('state', e.target.value)} />
          </div>
          <div className="col-span-1 space-y-2">
            <Label>PIN Code</Label>
            <Input value={form.zip_code} onChange={e=>handleChange('zip_code', e.target.value)} />
          </div>
          <div className="col-span-1 space-y-2">
            <Label>GSTIN</Label>
            <Input value={form.gstin} onChange={e=>handleChange('gstin', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button disabled={loading} onClick={handleSubmit}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Save Client</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
