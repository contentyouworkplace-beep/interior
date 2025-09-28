"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, User, Phone, FileText, Plus } from "lucide-react"
import { format } from "date-fns"

interface Client {
  id: string
  name: string
}

interface AddScheduleTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onTaskAdded: () => void
}

export function AddScheduleTaskDialog({
  open,
  onOpenChange,
  selectedDate,
  onTaskAdded,
}: AddScheduleTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time: "",
    client_id: "",
    type: "meeting" as "meeting" | "deadline" | "call" | "personal",
    date: selectedDate || new Date(),
  })

  // Load clients when dialog opens
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  // Update date when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }))
    }
  }, [selectedDate])

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const response = await fetch('/api/clients')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setClients(data.clients || [])
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const taskData = {
        title: formData.title,
        time: formData.time,
        date: formData.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        type: formData.type,
      }

      console.log('Submitting task data:', taskData)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Reset form
          setFormData({
            title: "",
            description: "",
            time: "",
            client_id: "",
            type: "meeting",
            date: selectedDate || new Date(),
          })
          
          onTaskAdded()
          onOpenChange(false)
        } else {
          throw new Error(result.error || 'Failed to create task')
        }
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      // You could add toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <User className="h-4 w-4" />
      case "call":
        return <Phone className="h-4 w-4" />
      case "deadline":
        return <FileText className="h-4 w-4" />
      case "personal":
        return <Plus className="h-4 w-4" />
      default:
        return <Plus className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for {format(formData.date, "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Task Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "meeting" | "deadline" | "call" | "personal") =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Meeting</span>
                  </div>
                </SelectItem>
                <SelectItem value="call">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Call</span>
                  </div>
                </SelectItem>
                <SelectItem value="deadline">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Deadline</span>
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Personal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client (Optional)</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              disabled={loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}