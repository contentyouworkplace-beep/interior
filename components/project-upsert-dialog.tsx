"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"

const schema = z.object({
  clientId: z.string().uuid("Please select a client"),
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  budget: z.string().optional(),
  status: z.enum(["planning", "in-progress", "on-hold", "completed"]).default("planning"),
  projectType: z.enum(["residential", "commercial", "hospitality", "retail", "office", "other"]).default("residential"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  location: z.string().optional(),
  stylePreference: z.string().optional(),
})

export type ProjectUpsertValues = z.infer<typeof schema>

interface ProjectUpsertDialogProps {
  trigger?: React.ReactNode
  mode: "create" | "edit" | "view"
  project?: Tables<'projects'> & { clients?: { id: string; first_name: string; last_name: string } }
  onCompleted?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProjectUpsertDialog({ trigger, mode, project, onCompleted, open, onOpenChange }: ProjectUpsertDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = typeof open === 'boolean'
  const isOpen = controlled ? open! : internalOpen
  const setOpen = (o: boolean) => {
    if (controlled) onOpenChange?.(o)
    else setInternalOpen(o)
  }
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string; company?: string | null }>>([])
  const { toast } = useToast()
  const supabase = createClient()

  const defaultValues: Partial<ProjectUpsertValues> | undefined = useMemo(() => {
    if (!project) return undefined
    return {
      clientId: project.client_id || project.clients?.id || "",
      name: project.name,
      description: project.description || "",
      startDate: project.start_date ? new Date(project.start_date) : undefined,
      endDate: project.end_date ? new Date(project.end_date) : undefined,
      budget: project.budget != null ? String(project.budget) : "",
      status: (project.status as any) || "planning",
      projectType: (project.project_type as any) || "residential",
      priority: (project.priority as any) || "medium",
      location: project.location || "",
      stylePreference: project.style_preference || "",
    }
  }, [project])

  const form = useForm<ProjectUpsertValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      name: "",
      description: "",
      startDate: new Date(),
      endDate: undefined,
      budget: "",
      status: "planning",
      projectType: "residential",
      priority: "medium",
      location: "",
      stylePreference: "",
    },
  })

  useEffect(() => {
    if (!isOpen) return
    if (project) {
      form.reset({
        clientId: project.client_id || project.clients?.id || "",
        name: project.name || "",
        description: project.description || "",
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : undefined,
        budget: project.budget != null ? String(project.budget) : "",
        status: (project.status as any) || "planning",
        projectType: (project.project_type as any) || "residential",
        priority: (project.priority as any) || "medium",
        location: project.location || "",
        stylePreference: project.style_preference || "",
      })
    } else {
      form.reset({
        clientId: "",
        name: "",
        description: "",
        startDate: new Date(),
        endDate: undefined,
        budget: "",
        status: "planning",
        projectType: "residential",
        priority: "medium",
        location: "",
        stylePreference: "",
      })
    }
  }, [isOpen, project, form])

  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company')
        .order('first_name')
      if (!error && data) setClients(data)
    }
    run()
  }, [isOpen, supabase])

  const readOnly = mode === "view"

  async function onSubmit(values: ProjectUpsertValues) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        client_id: values.clientId,
        name: values.name,
        description: values.description || null,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: values.endDate ? values.endDate.toISOString().split('T')[0] : null,
        budget: values.budget ? parseFloat(values.budget) : null,
        status: values.status,
        project_type: values.projectType,
        priority: values.priority,
        location: values.location || null,
        style_preference: values.stylePreference || null,
      }

      if (mode === 'create') {
        const { error } = await supabase.from('projects').insert(payload)
        if (error) throw error
      } else if (mode === 'edit' && project) {
        const { error } = await supabase.from('projects').update(payload).eq('id', project.id)
        if (error) throw error
      }

      toast({ title: 'Success', description: `Project ${mode === 'create' ? 'created' : 'updated'} successfully.` })
  setOpen(false)
      onCompleted?.()
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Project' : mode === 'edit' ? 'Edit Project' : 'Project Details'}</DialogTitle>
          <DialogDescription>
            {mode === 'view' ? 'Review project fields below.' : 'Fill in project details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="clientId" control={form.control} render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Client</FormLabel>
                  <Select disabled={readOnly} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.company || `${c.first_name} ${c.last_name}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input disabled={readOnly} placeholder="e.g., Villa Renovation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="projectType" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select disabled={readOnly} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="priority" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select disabled={readOnly} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea disabled={readOnly} placeholder="Describe the project scope" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="location" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input disabled={readOnly} placeholder="e.g., Bandra, Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="budget" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (₹)</FormLabel>
                  <FormControl>
                    <Input disabled={readOnly} type="number" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="startDate" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button disabled={readOnly} variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground") }>
                          {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="endDate" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button disabled={readOnly} variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground") }>
                          {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="status" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select disabled={readOnly} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="stylePreference" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Style Preference</FormLabel>
                  <FormControl>
                    <Input disabled={readOnly} placeholder="Modern / Minimalist / Classic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {!readOnly && (
              <DialogFooter>
                <Button type="submit">{mode === 'create' ? 'Create Project' : 'Save Changes'}</Button>
              </DialogFooter>
            )}
            {readOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
