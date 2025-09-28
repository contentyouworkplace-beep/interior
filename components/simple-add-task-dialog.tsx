"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SimpleAddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onTaskAdded: () => void
}

export function SimpleAddTaskDialog({
  open,
  onOpenChange,
  selectedDate,
  onTaskAdded,
}: SimpleAddTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form fields
    if (title.trim().length === 0) {
      return
    }

    if (time.trim().length === 0) {
      return
    }

    try {
      const taskData = {
        title,
        time,
        date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'task',
      }

      // Replace with your actual API call
      const result = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!result.ok) {
        throw new Error('Failed to create task')
      }

      // Reset form
      setTitle("")
      setTime("")
      
      onTaskAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('Task creation failed:', error)
      // Handle error (e.g., show notification)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for the selected date
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}