"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Tables } from "@/types/supabase"

type TaskRow = Tables<'project_tasks'>
type FormTask = Partial<TaskRow> & { due_date?: string | null; is_milestone?: boolean | null }

interface TaskDialogProps {
  open: boolean
  task?: TaskRow
  availableTeam: Array<{ id: string; name: string; role: string }>
  projectTasks: TaskRow[]
  onOpenChange: (open: boolean) => void
  onSave: (task: Partial<TaskRow>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  initialData?: Partial<TaskRow>
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
  await onSave(formData as Partial<TaskRow>)
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned">Assigned To</Label>
                <Select
                  value={formData.assigned_to || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      assigned_to: value,
                      role: availableTeam.find((member) => member.id === value)?.role || null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeam.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="estimated_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimated_hours: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="0"
                  />
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(new Date(formData.start_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_date: date ? format(date, "yyyy-MM-dd") : null,
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(new Date(formData.due_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          due_date: date ? format(date, "yyyy-MM-dd") : null,
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dependencies</Label>
              <Select
                value={formData.dependencies?.[0] || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dependencies: value ? [value] : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dependent task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks
                    .filter((t) => t.id !== task?.id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority || "medium"}
                onValueChange={(value: TaskRow["priority"]) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_milestone"
                checked={!!formData.is_milestone}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_milestone: checked,
                  }))
                }
              />
              <Label htmlFor="is_milestone">Mark as milestone</Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {task && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                Delete Task
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {task ? "Update" : "Create"} Task
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}