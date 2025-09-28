"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Upload, UserCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { PermissionEditor, type Permission, getDefaultPermissions } from "../permission-editor"

const teamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["admin", "manager", "designer", "assistant"]),
  phone: z.string().regex(/^[0-9+\s-]{10,}$/, "Invalid phone number"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().optional(),
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
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      role: "designer",
      permissions: getDefaultPermissions(),
    },
  })

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

  // Update permissions when role changes
  const handleRoleChange = (role: "admin" | "manager" | "designer" | "assistant") => {
    const preset = rolePermissionPresets[role]
    const newPermissions = permissions.map(p => ({
      ...p,
      isGranted: preset.includes(p.id)
    }))
    setPermissions(newPermissions)
    form.setValue("permissions", newPermissions)
  }

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
          role: data.role,
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
          role: data.role,
          phone: data.phone,
          avatar_url: avatarUrl,
          designation: data.designation,
          department: data.department,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member and set their role and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="role">Role & Department</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatar ? URL.createObjectURL(avatar) : undefined} />
                      <AvatarFallback>
                        <UserCircle className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
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
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
              </TabsContent>

              <TabsContent value="role" className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={(value: "admin" | "manager" | "designer" | "assistant") => {
                          field.onChange(value)
                          handleRoleChange(value)
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="project-management">Project Management</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="admin">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PermissionEditor
                          permissions={permissions}
                          onChange={(newPermissions: Permission[]) => {
                            setPermissions(newPermissions)
                            field.onChange(newPermissions)
                          }}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

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