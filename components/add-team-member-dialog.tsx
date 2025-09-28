"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, UserCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { PermissionEditor, type Permission, getDefaultPermissions } from "./permission-editor"

const teamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9+\s-]{10,}$/, "Invalid phone number"),
  designation: z.string().min(2, "Designation is required"),
  skills: z.string().optional(),
  avatar_url: z.string().optional(),
  permissions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    isGranted: z.boolean(),
  })),
})

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>

const rolePermissionPresets: Record<string, string[]> = {
  admin: [
    "client.view", "client.create", "client.edit", "client.delete",
    "project.view", "project.create", "project.edit", "project.delete",
    "financial.view", "financial.create", "financial.approve", "expense.manage",
    "team.view", "team.invite", "team.manage",
    "settings.view", "settings.edit"
  ],
  manager: [
    "client.view", "client.create", "client.edit",
    "project.view", "project.create", "project.edit",
    "financial.view", "financial.create", "financial.approve", "expense.manage",
    "team.view"
  ],
  designer: [
    "client.view",
    "project.view", "project.create", "project.edit",
    "financial.view",
    "team.view"
  ],
  assistant: [
    "client.view",
    "project.view",
    "financial.view",
    "team.view"
  ]
}

interface AddTeamMemberDialogProps {
  children: React.ReactNode
  onMemberAdded?: () => void
}

export function AddTeamMemberDialog({ children, onMemberAdded }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>(getDefaultPermissions())
  // Department logic removed
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      skills: "",
      permissions: getDefaultPermissions(),
    },
  })

  // Department fetch removed

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Profile picture should be less than 5MB",
          variant: "destructive",
        })
        return
      }
      setAvatar(file)
    }
  }

  // Department add logic removed

  // Role change logic removed

  async function onSubmit(data: TeamMemberFormValues) {
    try {
      setIsLoading(true)

      // Upload avatar if exists
      let avatarUrl = null
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, avatar)

        if (uploadError) throw uploadError
        
        avatarUrl = uploadData.path
      }

      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
        }
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          avatar_url: avatarUrl,
          designation: data.designation,
          skills: data.skills,
          permissions: data.permissions,
        })

      if (profileError) throw profileError

      toast({
        title: "Success",
        description: "Team member has been added successfully.",
      })

      setOpen(false)
      form.reset()
      setAvatar(null)
      setPermissions(getDefaultPermissions())
      onMemberAdded?.()
    } catch (error) {
      console.error('Error adding team member:', error)
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ...existing code...
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member and set their information and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatar ? URL.createObjectURL(avatar) : undefined} />
                    <AvatarFallback>
                      <UserCircle className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <FormField
                    control={form.control as any}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="avatar-upload"
                              onChange={handleAvatarChange}
                              disabled={isLoading}
                            />
                            <Label
                              htmlFor="avatar-upload"
                              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                            </Label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control as any}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+971 XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Interior Designer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Interior design, 3D modeling, Color theory, AutoCAD..." 
                          {...field}
                          className="h-24"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter skills separated by commas to help with team assignments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Team Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}