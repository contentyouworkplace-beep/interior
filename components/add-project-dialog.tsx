"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover as RPopover, PopoverContent as RPopoverContent, PopoverTrigger as RPopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, FolderOpen, IndianRupee, MapPin, Plus, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"
import { projectsService } from '@/lib/services/supabase/projects'
import { useToast } from "@/hooks/use-toast"
import { AddClientDialog } from '@/components/add-client-dialog'

interface AddProjectDialogProps {
  children: React.ReactNode
  onProjectAdded?: () => void
}

export function AddProjectDialog({ children, onProjectAdded }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [clients, setClients] = useState<Array<Pick<Tables<'clients'>, 'id' | 'first_name' | 'last_name'>>>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{id: string; name: string; role: string | null}>>([])
  const { toast } = useToast()
  const supabase = createClient()
  const uniqueClients = useMemo(() => {
    const seen = new Set<string>()
    return clients.filter(c => {
      const key = `${(c.first_name || '').trim().toLowerCase()} ${(c.last_name || '').trim().toLowerCase()}`.trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [clients])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    projectType: '',
    priority: 'medium',
    budget: '',
    location: '',
    stylePreference: ''
  })

  // Multi-team state
  const [selectedTeam, setSelectedTeam] = useState<string[]>([])
  const [managerId, setManagerId] = useState<string>('')

  // Phases state (custom Kanban columns) - capped to 4
  const [phases, setPhases] = useState<Array<{ id: string; name: string; description: string }>>([
    { id: crypto.randomUUID(), name: 'Concept', description: '' },
    { id: crypto.randomUUID(), name: 'Design Development', description: '' },
    { id: crypto.randomUUID(), name: 'Execution', description: '' },
  ])

  // Fetch clients & team for dropdowns
  useEffect(() => {
    const run = async () => {
      setLoadingClients(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const [{ data: clientData, error: clientErr }, { data: teamData, error: teamErr }] = await Promise.all([
          supabase
            .from('clients')
            .select('id, first_name, last_name')
            .eq('user_id', user?.id ?? '')
            .order('first_name'),
          supabase
            .from('team_members')
            .select('id, name, role')
            .order('name')
        ])
        if (clientErr) console.error('Failed to load clients', clientErr)
        if (teamErr) console.error('Failed to load team', teamErr)
        if (clientData) setClients(clientData)
        if (teamData) setTeamMembers(teamData)
      } finally {
        setLoadingClients(false)
      }
    }
    if (open) run()
  }, [open, supabase])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Build team assignments
      const teamAssignments = selectedTeam.map(id => ({
        team_member_id: id,
        is_manager: id === managerId,
      }))

      // Build phases payload (filter empty names)
      const phasePayload = phases
        .filter(p => p.name.trim().length > 0)
        .map((p, idx) => ({ name: p.name.trim(), description: p.description || null, position: idx }))

      await projectsService.createWithRelations({
        project: {
          user_id: user.id,
          client_id: formData.clientId,
          name: formData.name,
          description: formData.description || null,
          project_type: formData.projectType,
          priority: formData.priority,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          start_date: startDate?.toISOString().split('T')[0] || null,
          end_date: endDate?.toISOString().split('T')[0] || null,
          location: formData.location || null,
          style_preference: formData.stylePreference || null,
          status: 'planning'
        },
        team: teamAssignments,
        phases: phasePayload
      })

      toast({
        title: "Success!",
        description: "Project has been created successfully.",
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        clientId: '',
        projectType: '',
        priority: 'medium',
        budget: '',
        location: '',
        stylePreference: ''
      })
      setSelectedTeam([])
      setManagerId('')
      setPhases([
        { id: crypto.randomUUID(), name: 'Concept', description: '' },
        { id: crypto.randomUUID(), name: 'Design Development', description: '' },
      ])
      setStartDate(undefined)
      setEndDate(undefined)
      setOpen(false)
      onProjectAdded?.()

    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Set up a new interior design project for your client.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Project Information</h4>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="projectName"
                  placeholder="e.g., Villa Renovation - Palm Jumeirah"
                  className="pl-10"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="flex items-center justify-between">
                <span>Client *</span>
                <AddClientDialog onClientAdded={async () => {
                  // Refresh clients list then auto-select the most recent one
                  setLoadingClients(true)
                  const { data: { user } } = await supabase.auth.getUser()
                  const { data } = await supabase
                    .from('clients')
                    .select('id, first_name, last_name')
                    .eq('user_id', user?.id ?? '')
                    .order('created_at', { ascending: false })
                    .limit(1)
                  if (data && data[0]) {
                    // Also refresh the full dropdown options
                    const { data: all } = await supabase
                      .from('clients')
                      .select('id, first_name, last_name')
                      .eq('user_id', user?.id ?? '')
                      .order('first_name')
                    if (all) setClients(all)
                    handleInputChange('clientId', data[0].id)
                  }
                  setLoadingClients(false)
                }}>
                  <Button type="button" size="sm" variant="outline">Create new</Button>
                </AddClientDialog>
              </Label>
              <RPopover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <RPopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between" disabled={loadingClients}>
                    {formData.clientId
                      ? (() => {
                          const c = clients.find(c => c.id === formData.clientId)
                          return c ? `${c.first_name} ${c.last_name}` : 'Select a client'
                        })()
                      : (loadingClients ? 'Loading clients…' : 'Select a client')}
                  </Button>
                </RPopoverTrigger>
                <RPopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                  <Command>
                    <CommandInput placeholder="Search clients..." />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        {uniqueClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={`${client.first_name} ${client.last_name}`}
                            onSelect={() => { handleInputChange('clientId', client.id); setClientPickerOpen(false) }}
                          >
                            {client.first_name} {client.last_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </RPopoverContent>
              </RPopover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the project scope, requirements, and objectives..."
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

          {/* Location & Budget */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Location & Budget</h4>

            <div className="space-y-2">
              <Label htmlFor="location">Project Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="location" 
                  placeholder="e.g., Palm Jumeirah, Dubai" 
                  className="pl-10" 
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="budget" 
                    type="number" 
                    placeholder="0" 
                    className="pl-10" 
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                  />
                </div>
              </div>
              {/* Removed square footage field */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stylePreference">Style Preference</Label>
              <Select value={formData.stylePreference} onValueChange={(value) => handleInputChange('stylePreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select design style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="contemporary">Contemporary</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Project Timeline</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Expected End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Team Assignment</h4>
            <div className="space-y-2">
              <Label>Project Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(tm => (
                    <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="border rounded p-3 space-y-2">
                {teamMembers.map(tm => {
                  const checked = selectedTeam.includes(tm.id)
                  return (
                    <label key={tm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => {
                          setSelectedTeam(prev => checked ? prev.filter(id => id !== tm.id) : [...prev, tm.id])
                        }}
                      />
                      <span>{tm.name}{managerId === tm.id && ' (Manager)'}</span>
                    </label>
                  )
                })}
                {teamMembers.length === 0 && <p className="text-xs text-muted-foreground">No team members yet.</p>}
              </div>
            </div>
          </div>

          {/* Project Phases (Custom Kanban Columns) */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground flex items-center justify-between">
              <span>Phases <span className="text-xs text-muted-foreground">(max 4)</span></span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPhases(p => p.length < 4 ? [...p, { id: crypto.randomUUID(), name: 'New Phase', description: '' }] : p)}
                disabled={phases.length >= 4}
                aria-disabled={phases.length >= 4}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Phase
              </Button>
            </h4>
            {phases.length >= 4 && (
              <p className="text-[11px] text-muted-foreground">You can add up to 4 phases. Rename them to match your process.</p>
            )}
            <div className="space-y-3">
              {phases.map((phase, idx) => (
                <div key={phase.id} className="border rounded p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={phase.name}
                      onChange={e => setPhases(ph => ph.map(p => p.id === phase.id ? { ...p, name: e.target.value } : p))}
                      placeholder={`Phase ${idx+1} name`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPhases(ph => ph.filter(p => p.id !== phase.id))}
                      disabled={phases.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={phase.description}
                    onChange={e => setPhases(ph => ph.map(p => p.id === phase.id ? { ...p, description: e.target.value } : p))}
                    placeholder="Description (optional)"
                    rows={2}
                  />
                </div>
              ))}
              {phases.length === 0 && <p className="text-xs text-muted-foreground">No phases yet.</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddProjectDialog
