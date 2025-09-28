import { useState } from 'react'
import { addPayment } from '@/lib/services/supabase/payments'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function AddPaymentDialog({ projectId, clientId, onSuccess }: { projectId: string, clientId: string, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('upi')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await addPayment({
      user_id: '', // Fill from session
      client_id: clientId,
      project_id: projectId,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      payment_mode: paymentMode,
      reference_number: reference,
    })
    setLoading(false)
    setOpen(false)
    setAmount('')
    setPaymentDate('')
    setPaymentMode('upi')
    setReference('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add Payment</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <Input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
        <Input placeholder="Date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} type="date" />
        <Input placeholder="Mode (upi, cheque, cash, bank_transfer)" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} />
        <Input placeholder="Reference Number" value={reference} onChange={e => setReference(e.target.value)} />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
