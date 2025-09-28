"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, IndianRupee, Edit, Eye, MapPin, MoreHorizontal, Trash2 } from "lucide-react"
import { formatINR } from "@/lib/utils"
import type { Database, Task, TaskTimeLog } from "@/types/supabase"
import { ProjectTasks } from "@/components/project-tasks"

interface ProjectCardProps {
  project: Database['public']['Tables']['projects']['Row'] & {
    clients?: Database['public']['Tables']['clients']['Row']
  }
  tasks: Task[]
  timeLogs: Record<string, TaskTimeLog[]>
  teamMembers: Array<{ id: string; name: string; role: string }>
  onProjectDelete: (projectId: string) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskCreate: (task: Omit<Task, "id">) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
}

export function ProjectCard({
  project,
  tasks,
  timeLogs,
  teamMembers,
  onProjectDelete,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
}: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "review":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "on-hold":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  return (
    <Card
      className={`border-l-4 border-border/50 hover:shadow-md transition-shadow py-2 gap-2 ${getPriorityColor(project.priority)}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm">{project.name}</CardTitle>
            <div className="flex items-center space-x-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src="/placeholder-user.jpg" alt={`${project.clients?.first_name} ${project.clients?.last_name}`} />
                <AvatarFallback className="text-xs">
                  {project.clients?.first_name?.charAt(0) || 'C'}
                  {project.clients?.last_name?.charAt(0) || 'L'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {project.clients?.first_name} {project.clients?.last_name}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={() => onProjectDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No due date'}
          </div>
          <div className="flex items-center text-muted-foreground">
            <IndianRupee className="h-3 w-3 mr-1" />
            {project.budget != null ? formatINR(project.budget) : 'N/A'}
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {project.location || 'No location'}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {tasks.length || 0} tasks
          </div>
        </div>

        {/* Enhanced Task Management Section */}
        <div className="pt-2 border-t border-border/50">
          <ProjectTasks
            projectId={project.id}
            tasks={tasks}
            timeLogs={timeLogs}
            teamMembers={teamMembers}
            onTaskUpdate={onTaskUpdate}
            onTaskCreate={onTaskCreate}
            onTaskDelete={onTaskDelete}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{project.completion_percentage}%</span>
          </div>
          <Progress value={project.completion_percentage} className="h-1" />
        </div>
      </CardContent>
    </Card>
  )
}