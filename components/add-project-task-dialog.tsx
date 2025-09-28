import { useState } from 'react'
import { addTask } from '@/lib/services/supabase/project-tasks'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

export function AddProjectTaskDialog({ projectId, onSuccess }: { projectId: string, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await addTask({
      project_id: projectId,
      name,
      description,
      due_date: dueDate,
    })
    setLoading(false)
    setOpen(false)
    setName('')
    setDescription('')
    setDueDate('')
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add Task</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project Task</DialogTitle>
        </DialogHeader>
        <Input placeholder="Task Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Input placeholder="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
