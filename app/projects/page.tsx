"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Icons & UI
import { AddProjectDialog } from "@/components/add-project-dialog"
import { ProjectUpsertDialog } from "@/components/project-upsert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  FileText,
  Edit,
  Trash2,
  Eye,
  FolderOpen,
} from "lucide-react"
import { ProjectTasks } from "@/components/project-tasks"
import { formatINR } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Tables, TablesInsert } from "@/types/supabase"

type Project = Tables<'projects'> & { clients?: { id: string; first_name: string; last_name: string; email: string } }
type ProjectTask = Tables<'project_tasks'>
type TaskTimeLog = Tables<'task_time_logs'>
type ProjectPhase = Tables<'project_phases'>

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [projects, setProjects] = useState<Project[]>([])
  const [projectTasks, setProjectTasks] = useState<Record<string, ProjectTask[]>>({})
  const [timeLogsByTask, setTimeLogsByTask] = useState<Record<string, TaskTimeLog[]>>({})
  const [phasesByProject, setPhasesByProject] = useState<Record<string, ProjectPhase[]>>({})
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { toast } = useToast()

  // Helper function to calculate project completion percentage based on tasks
  const calculateProjectProgress = (tasks: ProjectTask[]): number => {
    if (!tasks || tasks.length === 0) return 0
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    
    return Math.round((completedTasks / totalTasks) * 100)
  }

  // Helper function to update project completion percentage
  const updateProjectProgress = async (projectId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ completion_percentage: newProgress })
        .eq('id', projectId)

      if (error) throw error

      // Update local projects state
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, completion_percentage: newProgress }
          : project
      ))
    } catch (error) {
      console.error('Error updating project progress:', error)
    }
  }

  // Function to update task
  const handleTaskUpdate = async (taskId: string, updates: Partial<ProjectTask> & { due_date?: string | null }) => {
    try {
      // Build safe update payload; map UI due_date -> DB end_date
      const updatePayload: Tables<'project_tasks'> extends infer T
        ? Partial<T> & { end_date?: string | null }
        : any = {
        ...(updates as any),
        end_date: (updates as any).due_date ?? (updates as any).end_date,
      }
      delete (updatePayload as any).due_date

      const { data, error } = await supabase
        .from('project_tasks')
        .update(updatePayload as any)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      // Update local state using returned row; also alias end_date -> due_date for UI
      const viewTask = { ...(data as any), due_date: (data as any).end_date ?? null } as ProjectTask & { due_date?: string | null }
      const projectId = viewTask.project_id

      // Update task state
      setProjectTasks(prev => {
        const currentProjectTasks = prev[projectId] || []
        const updatedProjectTasks = currentProjectTasks.map(task =>
          task.id === taskId ? (viewTask as any) : task
        )
        const updatedTasks = {
          ...prev,
          [projectId]: updatedProjectTasks
        }

        // Recalculate and update project progress if task status changed
        if (updates.status) {
          const newProgress = calculateProjectProgress(updatedProjectTasks)
          updateProjectProgress(projectId, newProgress)
        }

        return updatedTasks
      })

      toast({
        title: "Success",
        description: "Task updated successfully"
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      })
    }
  }

  // Function to create task
  // Accepts partial data from dialog; maps UI fields (due_date) -> DB fields (end_date)
  const handleTaskCreate = async (taskData: Partial<ProjectTask> & { project_id: string }) => {
    try {
      // Build a clean insert payload restricted to actual DB columns
  const insertPayload: any = {
        project_id: taskData.project_id,
        name: (taskData as any).name || 'Untitled Task',
        description: (taskData as any).description ?? null,
        assigned_to: (taskData as any).assigned_to ?? null,
        role: (taskData as any).role ?? null,
        start_date: (taskData as any).start_date ?? null,
        // Map UI due_date -> DB end_date if provided
        end_date: (taskData as any).due_date ?? (taskData as any).end_date ?? null,
    phase_id: (taskData as any).phase_id ?? null,
        estimated_hours: (taskData as any).estimated_hours ?? null,
        actual_hours: (taskData as any).actual_hours ?? 0,
        status: (taskData as any).status ?? 'pending',
        priority: (taskData as any).priority ?? 'medium',
        completion_percentage: (taskData as any).completion_percentage ?? 0,
        dependencies: (taskData as any).dependencies ?? null,
        notes: (taskData as any).notes ?? null,
        template_id: (taskData as any).template_id ?? null,
      }

      const { data, error } = await supabase
        .from('project_tasks')
  .insert(insertPayload as TablesInsert<'project_tasks'>)
        .select()
        .single()

      if (error) throw error

      // Update local state; alias end_date -> due_date for UI rendering
      const viewTask = { ...(data as any), due_date: (data as any).end_date ?? null } as ProjectTask & { due_date?: string | null }
      const projectId = insertPayload.project_id

      setProjectTasks(prev => {
        const currentProjectTasks = prev[projectId] || []
        const updatedProjectTasks = [...currentProjectTasks, viewTask as any]
        const updatedTasks = {
          ...prev,
          [projectId]: updatedProjectTasks
        }
        
        // Recalculate project progress after adding task
        const newProgress = calculateProjectProgress(updatedProjectTasks)
        updateProjectProgress(projectId, newProgress)
        
        return updatedTasks
      })

      toast({
        title: "Success",
        description: "Task created successfully"
      })
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      })
    }
  }

  // Function to delete task
  const handleTaskDelete = async (taskId: string) => {
    try {
      const task = Object.values(projectTasks)
        .flat()
        .find(t => t.id === taskId)
      
      if (!task) throw new Error('Task not found')

      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Update local state
      const projectId = task.project_id
      setProjectTasks(prev => {
        const currentProjectTasks = prev[projectId] || []
        const updatedProjectTasks = currentProjectTasks.filter(t => t.id !== taskId)
        const updatedTasks = {
          ...prev,
          [projectId]: updatedProjectTasks
        }
        
        // Recalculate project progress after deleting task
        const newProgress = calculateProjectProgress(updatedProjectTasks)
        updateProjectProgress(projectId, newProgress)
        
        return updatedTasks
      })

      toast({
        title: "Success",
        description: "Task deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      })
    }
  }
  const supabase = createClient()

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        })
        return
      }

      // Fetch team members (unrelated to heavy Kanban data)
      const teamPromise = supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)

      // Normalize client relationship shape (Supabase may return an object or error type)
      const normalized = (data || []).map(p => ({
        ...p,
        // Normalize status to hyphenated style for consistent UI (e.g., in_progress -> in-progress)
        status: (p as any).status ? String((p as any).status).replace(/_/g, "-") : (p as any).status,
        clients: (p as any).clients && !(p as any).clients.code ? (p as any).clients : undefined
      })) as Project[]
      setProjects(normalized)
      // Batch fetch tasks, phases, and time logs for all projects to avoid N+1 queries
      if (data && data.length > 0) {
        const projectIds = data.map(p => p.id)

        // Fetch tasks and phases in parallel
        const [tasksRes, phasesRes, teamRes] = await Promise.all([
          supabase
            .from('project_tasks')
            .select('*')
            .in('project_id', projectIds),
          supabase
            .from('project_phases')
            .select('*')
            .in('project_id', projectIds)
            .order('position', { ascending: true }),
          teamPromise,
        ])

        if (teamRes.error) {
          console.error('Error fetching team members:', teamRes.error)
        } else {
          setTeamMembers(teamRes.data || [])
        }

        const rawTasks = tasksRes.data || []
        // Map end_date -> due_date alias for UI components expecting `due_date`
        const uiTasks = rawTasks.map((t: any) => ({ ...t, due_date: t.due_date ?? t.end_date ?? null })) as any[]
        const tasksByProject: Record<string, ProjectTask[]> = {}
        for (const t of uiTasks) {
          const pid = (t as any).project_id
          if (!tasksByProject[pid]) tasksByProject[pid] = [] as any
          tasksByProject[pid].push(t as any)
        }
        setProjectTasks(tasksByProject)

        const allTaskIds = rawTasks.map((t: any) => t.id)
        let timeLogsByTask: Record<string, TaskTimeLog[]> = {}
        if (allTaskIds.length > 0) {
          const logsRes = await supabase
            .from('task_time_logs')
            .select('*')
            .in('task_id', allTaskIds)
          const logs = logsRes.data || []
          // Group logs by task_id
          timeLogsByTask = logs.reduce((acc: Record<string, TaskTimeLog[]>, log: any) => {
            const tid = log.task_id
            if (!acc[tid]) acc[tid] = []
            acc[tid].push(log)
            return acc
          }, {})
        }
        setTimeLogsByTask(timeLogsByTask)

        const phases = phasesRes.data || []
        const phasesByProject: Record<string, ProjectPhase[]> = {}
        for (const ph of phases) {
          const pid = (ph as any).project_id
          if (!phasesByProject[pid]) phasesByProject[pid] = [] as any
          phasesByProject[pid].push(ph as any)
        }
        setPhasesByProject(phasesByProject)
      } else {
        // No projects -> clear maps and team members
        setProjectTasks({})
        setTimeLogsByTask({})
        setPhasesByProject({})
        const teamRes = await teamPromise
        if (!teamRes.error) setTeamMembers(teamRes.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Best-effort cascade delete for related rows before deleting the project
      await supabase.from('task_time_logs').delete().in('task_id', (
        (await supabase.from('project_tasks').select('id').eq('project_id', projectId)).data?.map(r => r.id) || []
      ))
      await supabase.from('project_tasks').delete().eq('project_id', projectId)
      await supabase.from('project_phases').delete().eq('project_id', projectId)
      await supabase.from('project_team_members').delete().eq('project_id', projectId)
      const { error } = await supabase.from('projects').delete().eq('id', projectId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        })
        return
      }

      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const getStatusColor = (status?: string | null) => {
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

  const getPriorityColor = (priority?: string | null) => {
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clients?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clients?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    
    if (selectedFilter === "all") return matchesSearch
    return matchesSearch && project.status === selectedFilter
  })

  // Real metrics for cards
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => {
    const s = (p.status || '').toLowerCase()
    return s !== 'completed' && s !== 'cancelled' && s !== 'canceled'
  }).length
  const completedProjects = projects.filter((p) => (p.status || '').toLowerCase() === 'completed').length
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ? Number(p.budget as unknown as number) : 0), 0)

  const stats = [
    { title: 'Total Projects', value: totalProjects.toString(), icon: FileText, color: 'text-blue-600' },
    { title: 'Active Projects', value: activeProjects.toString(), icon: Clock, color: 'text-yellow-600' },
    { title: 'Completed', value: completedProjects.toString(), icon: FileText, color: 'text-green-600' },
    { title: 'Total Value', value: formatINR(totalBudget), icon: IndianRupee, color: 'text-primary' },
  ]

  return (
    <DashboardLayout
      title="Project Management"
      subtitle="Manage your interior design projects and track progress"
      currentPath="/projects"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-transparent">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter: {selectedFilter === "all" ? "All" : selectedFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedFilter("all")}>All Projects</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("planning")}>Planning</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("in-progress")}>In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("review")}>Review</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("completed")}>Completed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <AddProjectDialog onProjectAdded={fetchProjects}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </AddProjectDialog>
          </div>
        </CardContent>
      </Card>

      {/* View label (plain text only) */}
      <div className="space-y-6">
        <div className="text-xs text-muted-foreground">Grid View</div>

        {/* Formerly TabsContent */}
        <div className="space-y-6">
          {/* Zero state */}
          {!isLoading && filteredProjects.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="py-16">
                <div className="flex flex-col items-center text-center gap-4">
                  <FolderOpen className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">No projects found</p>
                    <p className="text-sm text-muted-foreground">Get started by creating your first project.</p>
                  </div>
                  <AddProjectDialog onProjectAdded={fetchProjects}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Project
                    </Button>
                  </AddProjectDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Grid: 2 cards per row for clarity */}
          {filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={`border-l-4 border-border/50 hover:shadow-md transition-shadow py-2 gap-2 ${getPriorityColor(project.priority)}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xs font-semibold">{project.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src="/placeholder-user.jpg" alt={`${project.clients?.first_name} ${project.clients?.last_name}`} />
                          <AvatarFallback className="text-xs">
                            {project.clients?.first_name?.charAt(0) || 'C'}
                            {project.clients?.last_name?.charAt(0) || 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">
                          {project.clients?.first_name} {project.clients?.last_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Badge className={`${getStatusColor(project.status)} text-[10px] py-0.5 px-1.5`}>{project.status || 'unknown'}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingProject(project)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600"
                            onClick={() => setConfirmDeleteId(project.id)}
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
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
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
                      {projectTasks[project.id]?.length || 0} tasks
                    </div>
                  </div>

                  {/* Enhanced Task Management Section */}
                  <div className="pt-2 border-t border-border/50">
                    <ProjectTasks
                      projectId={project.id}
                      tasks={projectTasks[project.id] || []}
                      timeLogs={timeLogsByTask}
                      phases={phasesByProject.hasOwnProperty(project.id) ? phasesByProject[project.id] : undefined}
                      teamMembers={teamMembers.map(member => ({
                        id: member.id,
                        name: member.name,
                        role: member.role
                      }))}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskCreate={handleTaskCreate}
                      onTaskDelete={handleTaskDelete}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{project.completion_percentage}%</span>
                    </div>
                    <Progress value={project.completion_percentage} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Edit / View unified dialogs using the same form as New Project */}
          {editingProject && (
            <ProjectUpsertDialog
              mode="edit"
              project={editingProject}
              open={true}
              onOpenChange={(o) => { if (!o) setEditingProject(null) }}
              onCompleted={() => { setEditingProject(null); fetchProjects() }}
            />
          )}

          {viewingProject && (
            <ProjectUpsertDialog
              mode="view"
              project={viewingProject}
              open={true}
              onOpenChange={(o) => { if (!o) setViewingProject(null) }}
              onCompleted={() => setViewingProject(null)}
            />
          )}

          {/* Delete Confirmation */}
          <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently remove the project and its tasks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    if (!confirmDeleteId) return
                    await handleDeleteProject(confirmDeleteId)
                    setConfirmDeleteId(null)
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      </DashboardLayout>
  )
}
