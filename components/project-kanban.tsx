"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"

interface Project {
  id: string
  name: string
  client: string
  clientAvatar: string
  status: string
  priority: string
  progress: number
  budget: string
  spent: string
  startDate: string
  endDate: string
  location: string
  description: string
  team: string[]
  tasks: number
  completedTasks: number
}

interface ProjectKanbanProps {
  projects: Project[]
}

export function ProjectKanban({ projects }: ProjectKanbanProps) {
  const columns = [
    { id: "planning", title: "Planning", status: "planning" },
    { id: "in-progress", title: "In Progress", status: "in-progress" },
    { id: "review", title: "Review", status: "review" },
    { id: "completed", title: "Completed", status: "completed" },
  ]

  const getColumnProjects = (status: string) => {
    return projects.filter((project) => project.status === status)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {columns.map((column) => {
        const columnProjects = getColumnProjects(column.status)
        return (
          <div key={column.id} className="space-y-2">
            <Card className="border-border/50 py-1 gap-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="text-xs">
                    {columnProjects.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-2">
              {columnProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`border-l-4 border-border/50 hover:shadow-md transition-shadow cursor-pointer py-1 gap-1 ${getPriorityColor(project.priority)}`}
                >
                  <CardContent className="p-2 space-y-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-xs leading-tight">{project.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-3 w-3">
                          <AvatarImage src={project.clientAvatar || "/placeholder.svg"} alt={project.client} />
                          <AvatarFallback className="text-xs">
                            {project.client
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{project.client}</span>
                      </div>
                    </div>

                    {project.status !== "completed" && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{project.budget}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-2 w-2 mr-1" />
                        {project.endDate}
                      </div>
                      <div className="text-muted-foreground">
                        {project.completedTasks}/{project.tasks} tasks
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <div className="flex items-center space-x-1">
                        {project.team.slice(0, 2).map((member, index) => (
                          <Avatar key={index} className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {member
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.team.length > 2 && (
                          <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{project.team.length - 2}</span>
                          </div>
                        )}
                      </div>
                      <Badge className={`${getStatusColor(project.status)} text-xs`}>{project.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full bg-transparent border-dashed" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
