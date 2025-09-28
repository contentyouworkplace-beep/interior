"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Clock, Link, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import type { Tables } from "@/types/supabase"

type Task = Tables<'project_tasks'>
type TaskTimeLog = Tables<'task_time_logs'>
type ExtendedTask = Task & { due_date?: string | null; is_milestone?: boolean | null; dependencies?: string[] | null }
type Phase = Tables<'project_phases'>
import { cn } from "@/lib/utils"

interface TaskKanbanProps {
  tasks: ExtendedTask[]
  timeLogs: Record<string, TaskTimeLog[]>
  columns?: Array<{ id: string; title: string; phase_id: string }>
  onAddTask?: () => void
  onTaskClick?: (task: ExtendedTask) => void
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void
}

export function TaskKanban({ tasks, timeLogs, columns, onAddTask, onTaskClick, onTaskStatusChange }: TaskKanbanProps) {
  // When columns are provided, we are in custom phase mode. If undefined, show skeleton.
  const defaultStatusColumns = [
    { id: "pending", title: "To Do", status: "pending" },
    { id: "in_progress", title: "In Progress", status: "in_progress" },
    { id: "blocked", title: "Blocked", status: "blocked" },
    { id: "completed", title: "Completed", status: "completed" },
  ]

  const isPhaseMode = Array.isArray(columns) && columns.length > 0
  if (!Array.isArray(columns)) {
    // Initial loading skeleton: prevent flashing default labels before custom columns load
    return (
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
    )
  }

  const getColumnTasks = (key: string) => {
    if (isPhaseMode) {
      // key is phase_id; ignore tasks without a phase_id so they don't mistakenly show in the first column
      return tasks.filter((task) => (task as any).phase_id && (task as any).phase_id === key)
    }
    // key is status
    return tasks.filter((task) => task.status === key)
  }

  const calculateTimeSpent = (taskId: string): number => {
    const logs = timeLogs[taskId] || []
    return logs.reduce((total, log) => total + (log.hours_logged || 0), 0)
  }

  const hasDependenciesCompleted = (task: Task): boolean => {
    if (!task.dependencies?.length) return true
    return (task.dependencies || []).every((depId: string) => 
      tasks.find(t => t.id === depId)?.status === 'completed'
    )
  }

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {(isPhaseMode ? columns! : defaultStatusColumns).map((column: any) => {
        const key = isPhaseMode ? column.phase_id : column.status
        const columnTasks = getColumnTasks(key)
        return (
          <div key={column.id} className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="text-[10px] py-0.5 px-1.5">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {columnTasks.map((task) => {
                const timeSpent = calculateTimeSpent(task.id)
                const canProgress = hasDependenciesCompleted(task)
                
                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "border-l-4 border-border/50 hover:shadow-md transition-shadow cursor-pointer",
                      {
                        "border-l-blue-500": task.is_milestone,
                        "border-l-yellow-500": !task.is_milestone && task.priority === "high",
                        "border-l-green-500": !task.is_milestone && task.priority === "low",
                        "opacity-60": (!('status' in column) || column.status !== "blocked") && !canProgress,
                        "bg-green-50 border-l-green-600": task.status === 'completed'
                      }
                    )}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <CardContent className="p-3 space-y-2.5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskStatusChange?.(task.id, task.status === 'completed' ? 'pending' : 'completed')
                              }}
                              className={cn(
                                "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                task.status === 'completed'
                                  ? "bg-green-600 border-green-600 text-white"
                                  : "border-gray-300 hover:border-green-400"
                              )}
                            >
                              {task.status === 'completed' && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                            </button>
                            <h4 className={cn(
                              "font-medium text-[12px] leading-tight flex-1",
                              task.status === 'completed' && "line-through text-gray-500"
                            )}>
                              {task.name}
                            </h4>
                          </div>
                          {task.is_milestone && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 text-[10px] py-0.5 px-1.5">
                              Milestone
                            </Badge>
                          )}
                        </div>
                        {task.assigned_to && (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[10px]">
                                {task.assigned_to.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground">{task.role}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={cn(
                            "font-medium",
                            task.status === 'completed' && "text-green-600"
                          )}>
                            {task.status === 'completed' ? '100' : task.completion_percentage}%
                          </span>
                        </div>
                        <Progress 
                          value={task.status === 'completed' ? 100 : task.completion_percentage} 
                          className={cn(
                            "h-1",
                            task.status === 'completed' && "[&>div]:bg-green-600"
                          )} 
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center text-muted-foreground space-x-2">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {timeSpent}/{task.estimated_hours || 0}h
                          </div>
                          {(task.dependencies && task.dependencies.length > 0) && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center">
                                  <Link className="h-3 w-3 mr-1" />
                                  {task.dependencies?.length || 0}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[11px]">Has {task.dependencies?.length || 0} dependencies</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {task.due_date ? new Date(task.due_date as unknown as string).toLocaleDateString() : 'No due date'}
                        </div>
                        {!canProgress && column.status !== "completed" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[11px]">Waiting for dependencies to complete</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {column.status === "completed" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

            </div>
          </div>
        )
      })}
    </div>
  )
}