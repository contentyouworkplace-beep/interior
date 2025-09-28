"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TaskDialogForm } from "./task-dialog-form"
import type { Tables } from "@/types/supabase"

type Task = Tables<'project_tasks'>
type FormTask = Partial<Task> & { due_date?: string | null; is_milestone?: boolean | null }

interface TaskDialogProps {
  open: boolean
  task?: Task
  availableTeam: Array<{ id: string; name: string; role: string }>
  projectTasks: Task[]
  onOpenChange: (open: boolean) => void
  onSave: (task: Partial<Task>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  initialData?: Partial<Task>
  phases?: Array<{ id: string; name: string }>
}

export function TaskDialog({
  open,
  task,
  availableTeam,
  projectTasks,
  onOpenChange,
  onSave,
  onDelete,
  initialData,
  phases,
}: TaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormTask>({
    name: "",
    description: "",
    assigned_to: null,
    role: null,
    estimated_hours: null,
    start_date: null,
    due_date: null,
    is_milestone: false,
    priority: "medium",
    dependencies: [],
  })

  useEffect(() => {
    if (task) {
      setFormData(task)
    } else {
      setFormData({
        name: "",
        description: "",
        assigned_to: null,
        role: null,
        estimated_hours: null,
        start_date: null,
        due_date: null,
        is_milestone: false,
        priority: "medium",
        dependencies: [],
        ...(initialData || {}),
      })
    }
  }, [task, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task?.id) return
    setIsLoading(true)

    try {
      await onDelete?.(task.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <TaskDialogForm
          task={task}
          formData={formData}
          setFormData={setFormData}
          availableTeam={availableTeam}
          projectTasks={projectTasks}
          phases={phases}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}