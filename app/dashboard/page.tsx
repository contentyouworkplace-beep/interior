"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Users, FileText, IndianRupee, Receipt, Plus, User, Calendar as CalendarIcon, Clock, Activity, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { format } from "date-fns"
import { AddScheduleTaskDialog } from "@/components/add-schedule-task-dialog"
import { SimpleAddTaskDialog } from "@/components/simple-add-task-dialog"
import { AddClientDialog } from "@/components/add-client-dialog"
import { CreateQuotationDialog } from "@/components/create-quotation-dialog-clean"

interface DashboardMetrics {
  totalClients: number
  quotationsCreated: number // total quotations created (any status: draft/approved/rejected)
  pendingPayments: number
  expensesThisMonth: number
}

interface Project {
  id: number
  name: string
  client: string
  status: "In Progress" | "Planning" | "Review" | "Completed"
  progress: number
  deadline: string
  priority: "high" | "medium" | "low"
  updatedAt: string
}

interface Task {
  id: string
  title: string
  time: string
  client?: string
  completed: boolean
  type: "meeting" | "deadline" | "personal" | "call"
}

export default function DashboardPage() {
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    quotationsCreated: 0,
    pendingPayments: 0,
    expensesThisMonth: 0
  })
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  
  // Dialog states
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showCreateQuoteDialog, setShowCreateQuoteDialog] = useState(false)

  const loadMetrics = async (retryCount = 0) => {
    try {
      setLoadingMetrics(true)
      setMetricsError(null)
      const response = await fetch('/api/dashboard/metrics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMetrics({
          totalClients: data.totalClients,
          quotationsCreated: data.quotationsCreated ?? data.quotationsSent, // backward compatibility
          pendingPayments: data.pendingPayments,
          expensesThisMonth: data.expensesThisMonth
        })
        setMetricsError(null)
      } else {
        throw new Error(data.error || 'Failed to load metrics')
      }
    } catch (error) {
      console.error('Error loading dashboard metrics:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics'
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying metrics load... (${retryCount + 1}/2)`)
        setTimeout(() => loadMetrics(retryCount + 1), 1000)
        return
      }
      
      setMetricsError(errorMessage)
      // Fallback to mock data for development
      setMetrics({
        totalClients: 28,
        quotationsCreated: 15,
        pendingPayments: 1250000,
        expensesThisMonth: 185000
      })
    } finally {
      setLoadingMetrics(false)
    }
  }

  const loadProjects = async (retryCount = 0) => {
    try {
      setLoadingProjects(true)
      setProjectsError(null)
      const response = await fetch('/api/projects/recent')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecentProjects(data.projects)
          setProjectsError(null)
        } else {
          throw new Error(data.error || 'Failed to load projects')
        }
      } else {
        throw new Error('Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error loading recent projects:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects'
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying projects load... (${retryCount + 1}/2)`)
        setTimeout(() => loadProjects(retryCount + 1), 1000)
        return
      }
      
      setProjectsError(errorMessage)
      // Fallback to mock data
      setRecentProjects([
        {
          id: 1,
          name: "Modern Villa Renovation - Bandra",
          client: "Priya Sharma",
          status: "In Progress",
          progress: 75,
          deadline: "2024-10-15",
          priority: "high",
          updatedAt: "2024-09-14"
        },
        {
          id: 2,
          name: "Corporate Office Design - BKC",
          client: "Tech Solutions Pvt Ltd",
          status: "Planning",
          progress: 30,
          deadline: "2024-11-20",
          priority: "medium",
          updatedAt: "2024-09-13"
        }
      ])
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadTasks = async (retryCount = 0) => {
    try {
      setLoadingTasks(true)
      setTasksError(null)
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch(`/api/tasks?date=${dateStr}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTasks(data.tasks)
          setTasksError(null)
        } else {
          throw new Error(data.error || 'Failed to load tasks')
        }
      } else {
        throw new Error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks'
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying tasks load... (${retryCount + 1}/2)`)
        setTimeout(() => loadTasks(retryCount + 1), 1000)
        return
      }
      
      setTasksError(errorMessage)
      // Fallback to mock data
      setTasks([
        {
          id: "1",
          title: "Client meeting - Villa project",
          time: "10:00 AM",
          client: "Ahmed Al Mansouri",
          completed: false,
          type: "meeting"
        },
        {
          id: "2", 
          title: "Submit design proposal",
          time: "2:00 PM",
          client: "Mahadev Industries",
          completed: false,
          type: "deadline"
        }
      ])
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  // Load recent projects
  useEffect(() => {
    loadProjects()
  }, [])

  // Load tasks when date changes
  useEffect(() => {
    loadTasks()
  }, [selectedDate])

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ))

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      })

      if (!response.ok) {
        setTasks(tasks.map(t => 
          t.id === taskId ? { ...t, completed: task.completed } : t
        ))
        console.error('Failed to update task')
      }
    } catch (error) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setTasks(tasks.map(t => 
          t.id === taskId ? { ...t, completed: task.completed } : t
        ))
      }
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    const prev = tasks
    try {
      setTasks(tasks.filter(t => t.id !== taskId))
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
    } catch (err) {
      console.error('Delete task failed:', err)
      setTasks(prev)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Planning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Review":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
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

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return "👥"
      case "deadline":
        return "📋"
      case "call":
        return "📞"
      case "personal":
        return "📝"
      default:
        return "📝"
    }
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening with your projects today."
      currentPath="/dashboard"
    >
      {/* Error Banner */}
      {(metricsError || projectsError || tasksError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-800">
                {metricsError && "Failed to load dashboard metrics. "}
                {projectsError && "Failed to load recent projects. "}
                {tasksError && "Failed to load tasks. "}
                Using fallback data.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (metricsError) loadMetrics()
                if (projectsError) loadProjects()
                if (tasksError) loadTasks()
              }}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {loadingMetrics ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 sm:w-24" />
                    <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                  </div>
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* Total Clients Card */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Clients</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.totalClients}</p>
                    <p className="text-xs text-muted-foreground">Total clients</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-full bg-blue-100">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotations Created Card */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Quotations Created</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.quotationsCreated}</p>
                    <p className="text-xs text-muted-foreground">
                      All statuses{metrics.quotationsCreated === 0 && ' (none found this user)'}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-full bg-green-100">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments Card */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Payments</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{formatINR(metrics.pendingPayments)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding amount</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-full bg-orange-100">
                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses This Month Card */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Expenses This Month</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{formatINR(metrics.expensesThisMonth)}</p>
                    <p className="text-xs text-muted-foreground">Current month total</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-full bg-red-100">
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Projects */}
        <div className="xl:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Latest projects sorted by most recent activity</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingProjects ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 sm:p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : projectsError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                      <Activity className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-700 font-medium">Failed to load projects</p>
                    <p className="text-sm mb-4">{projectsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => loadProjects()}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 sm:p-4 border-l-4 border border-border rounded-lg ${getPriorityColor(project.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm sm:text-base truncate">{project.name}</h4>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ml-2 ${getStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.client}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-1.5 sm:h-2" />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                            <span className="capitalize">{project.priority} priority</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <Activity className="h-8 w-8" />
                    </div>
                    <p>No recent projects found</p>
                    <p className="text-sm">Start by creating your first project</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Today's Schedule & Quick Actions */}
        <div className="space-y-6">
          {/* Today's Schedule with Date Picker */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your personal tasks and appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const previousDay = new Date(selectedDate)
                      previousDay.setDate(previousDay.getDate() - 1)
                      setSelectedDate(previousDay)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const nextDay = new Date(selectedDate)
                      nextDay.setDate(nextDay.getDate() + 1)
                      setSelectedDate(nextDay)
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h4>
                {loadingTasks ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                      <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-1" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-1 flex-shrink-0 border-2 border-gray-300 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm flex-shrink-0">{getTaskIcon(task.type)}</span>
                          <p className={`text-sm font-medium break-words ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                        </div>
                        {task.client && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{task.client}</p>
                        )}
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{task.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {task.completed && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : tasksError ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <div className="w-12 h-12 mx-auto mb-2 bg-red-50 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-red-700 font-medium text-sm">Failed to load tasks</p>
                    <p className="text-xs mb-3">{tasksError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => loadTasks()}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No tasks scheduled for this date</p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => setShowAddTaskDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common actions to help you get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AddClientDialog onClientAdded={loadMetrics}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </AddClientDialog>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowCreateQuoteDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog Components */}
      <SimpleAddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        selectedDate={selectedDate}
        onTaskAdded={loadTasks}
      />
      
      <CreateQuotationDialog
        open={showCreateQuoteDialog}
        onOpenChange={setShowCreateQuoteDialog}
      />
    </DashboardLayout>
  )
}