import { useState } from 'react'
import { updateTaskCompletion } from '@/lib/services/supabase/project-tasks'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function AssignTeamMemberDialog({ taskId, onSuccess }: { taskId: string, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    // You would update the task with assigned_to and role fields here
    // For now, just close dialog
    setLoading(false)
    setOpen(false)
    setAssignedTo('')
    setRole('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Assign Team Member</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Team Member</DialogTitle>
        </DialogHeader>
        <Input placeholder="Team Member ID" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
        <Input placeholder="Role (designer, carpenter, site engineer)" value={role} onChange={e => setRole(e.target.value)} />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
