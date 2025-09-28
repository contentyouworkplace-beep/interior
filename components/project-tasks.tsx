"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskDialog } from "@/components/task-dialog/index"
import { TaskKanban } from "@/components/task-kanban"
import type { Tables } from "@/types/supabase"

type Task = Tables<'project_tasks'>
type TaskTimeLog = Tables<'task_time_logs'>
type ExtendedTask = Task & { due_date?: string | null }
type Phase = Tables<'project_phases'>
type TaskInsertUI = Partial<Task> & { project_id: string; phase_id?: string | null }

interface ProjectTasksProps {
  projectId: string
  tasks: ExtendedTask[]
  timeLogs: Record<string, TaskTimeLog[]>
  phases?: Phase[]
  teamMembers: Array<{ id: string; name: string; role: string }>
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskCreate: (task: TaskInsertUI) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
}

export function ProjectTasks({
  projectId,
  tasks,
  timeLogs,
  phases,
  teamMembers,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
}: ProjectTasksProps) {
  const [selectedTask, setSelectedTask] = useState<ExtendedTask | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [initialNewTaskData, setInitialNewTaskData] = useState<Partial<Task> & { phase_id?: string | null } | undefined>()

  const handleTaskClick = (task: ExtendedTask) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleNewTask = (preset?: Partial<Task> & { phase_id?: string | null }) => {
    setSelectedTask(undefined)
    setInitialNewTaskData(preset)
    setIsDialogOpen(true)
  }

  const handleTaskSave = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await onTaskUpdate(selectedTask.id, taskData)
    } else {
      const ensuredPhaseId = Array.isArray(phases)
        ? ((taskData as any).phase_id || initialNewTaskData?.phase_id || phases[0]?.id)
        : (taskData as any)?.phase_id

      const newTask: TaskInsertUI = {
        ...taskData,
        project_id: projectId,
        actual_hours: 0,
        completion_percentage: 0,
        status: "pending",
        ...(ensuredPhaseId ? { phase_id: ensuredPhaseId } : {}),
      }
      await onTaskCreate(newTask)
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    await onTaskUpdate(taskId, {
      status: newStatus,
      completion_percentage: newStatus === "completed" ? 100 : newStatus === "pending" ? 0 : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="kanban" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="h-8">
            <TabsTrigger className="text-xs h-8" value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="m-0">
          {Array.isArray(phases) ? (
            <TaskKanban
              tasks={tasks}
              timeLogs={timeLogs}
              columns={phases.map(p => ({ id: p.id, title: p.name, phase_id: p.id }))}
              onAddTask={() => handleNewTask({ status: 'pending' as Task['status'], phase_id: phases[0]?.id })}
              onTaskClick={handleTaskClick}
              onTaskStatusChange={handleTaskStatusChange}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-9 rounded-md bg-muted/40 border border-border/50" />
                  <div className="space-y-3">
                    {[0,1].map(j => (
                      <div key={j} className="h-24 rounded-md bg-muted/30 border border-border/40" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer quick-add per phase */}
          {Array.isArray(phases) && phases.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {phases.map((p) => (
                <Button key={p.id} size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleNewTask({ status: 'pending' as Task['status'], phase_id: p.id })}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {p.name}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={isDialogOpen}
        task={selectedTask}
        availableTeam={teamMembers}
        projectTasks={tasks}
        onOpenChange={setIsDialogOpen}
        onSave={handleTaskSave}
        initialData={initialNewTaskData}
        phases={Array.isArray(phases) ? phases.map(p => ({ id: p.id, name: p.name })) : undefined}
        onDelete={selectedTask ? () => onTaskDelete(selectedTask.id) : undefined}
      />
    </div>
  )
}