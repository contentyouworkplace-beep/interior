"use client"

import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import type { Task } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"

interface TaskDialogFormProps {
  task?: Task
  formData: Partial<Task>
  setFormData: (data: Partial<Task>) => void
  availableTeam: Array<{ id: string; name: string; role: string }>
  projectTasks: Task[]
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onDelete?: () => void
  onCancel: () => void
  phases?: Array<{ id: string; name: string }>
}

export function TaskDialogForm({
  task,
  formData,
  setFormData,
  availableTeam,
  projectTasks,
  isLoading,
  onSubmit,
  onDelete,
  onCancel,
  phases = [],
}: TaskDialogFormProps) {
  const dependencyPool = projectTasks.filter((t) => t.id !== task?.id)
  const addDependency = (id: string) => {
    if (!id) return
    setFormData({
      ...formData,
      dependencies: Array.from(new Set([...(formData.dependencies || []), id])),
    })
  }
  const removeDependency = (id: string) => {
    setFormData({
      ...formData,
      dependencies: (formData.dependencies || []).filter((d) => d !== id),
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Task Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter task name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {phases.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="phase">Phase</Label>
              <Select
                value={(formData as any).phase_id || ""}
                onValueChange={(value) => setFormData({ ...formData, phase_id: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="assigned">Assigned To</Label>
            <Select
              value={formData.assigned_to || ""}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  assigned_to: value,
                  role: availableTeam.find((member) => member.id === value)?.role || null,
                })
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
                  setFormData({
                    ...formData,
                    estimated_hours: e.target.value ? parseFloat(e.target.value) : null,
                  })
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
                    setFormData({
                      ...formData,
                      start_date: date ? format(date, "yyyy-MM-dd") : null,
                    })
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
                    setFormData({
                      ...formData,
                      due_date: date ? format(date, "yyyy-MM-dd") : null,
                    })
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
            value=""
            onValueChange={(value) => {
              addDependency(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add dependency" />
            </SelectTrigger>
            <SelectContent>
              {dependencyPool
                .filter((t) => !(formData.dependencies || []).includes(t.id))
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {formData.dependencies && formData.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.dependencies.map((depId) => {
                const dep = projectTasks.find((t) => t.id === depId)
                return (
                  <Badge key={depId} variant="secondary" className="flex items-center gap-1">
                    <span>{dep?.name || depId}</span>
                    <button
                      type="button"
                      className="text-xs hover:text-destructive"
                      onClick={() => removeDependency(depId)}
                      aria-label={`Remove ${dep?.name || depId}`}
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={formData.priority || "medium"}
            onValueChange={(value: Task["priority"]) =>
              setFormData({
                ...formData,
                priority: value,
              })
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
            checked={formData.is_milestone}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                is_milestone: checked,
              })
            }
          />
          <Label htmlFor="is_milestone">Mark as milestone</Label>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        {task && onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isLoading}>
            Delete Task
          </Button>
        )}
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {task ? "Update" : "Create"} Task
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}