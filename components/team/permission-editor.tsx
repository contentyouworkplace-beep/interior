"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface Permission {
  id: string
  name: string
  description: string
  category: "clients" | "projects" | "financial" | "team" | "settings"
  isGranted: boolean
}

const defaultPermissions: Omit<Permission, "isGranted">[] = [
  // Client Permissions
  {
    id: "client.view",
    name: "View Clients",
    description: "Can view client list and profiles",
    category: "clients"
  },
  {
    id: "client.create",
    name: "Create Clients",
    description: "Can add new clients",
    category: "clients"
  },
  {
    id: "client.edit",
    name: "Edit Clients",
    description: "Can modify client information",
    category: "clients"
  },
  {
    id: "client.delete",
    name: "Delete Clients",
    description: "Can remove clients from the system",
    category: "clients"
  },
  // Project Permissions
  {
    id: "project.view",
    name: "View Projects",
    description: "Can view project details",
    category: "projects"
  },
  {
    id: "project.create",
    name: "Create Projects",
    description: "Can create new projects",
    category: "projects"
  },
  {
    id: "project.edit",
    name: "Edit Projects",
    description: "Can modify project details",
    category: "projects"
  },
  {
    id: "project.delete",
    name: "Delete Projects",
    description: "Can delete projects",
    category: "projects"
  },
  // Financial Permissions
  {
    id: "financial.view",
    name: "View Financials",
    description: "Can view financial documents",
    category: "financial"
  },
  {
    id: "financial.create",
    name: "Create Financials",
    description: "Can create quotations and invoices",
    category: "financial"
  },
  {
    id: "financial.approve",
    name: "Approve Financials",
    description: "Can approve financial documents",
    category: "financial"
  },
  {
    id: "expense.manage",
    name: "Manage Expenses",
    description: "Can create and manage expenses",
    category: "financial"
  },
  // Team Permissions
  {
    id: "team.view",
    name: "View Team",
    description: "Can view team members",
    category: "team"
  },
  {
    id: "team.invite",
    name: "Invite Team Members",
    description: "Can invite new team members",
    category: "team"
  },
  {
    id: "team.manage",
    name: "Manage Team",
    description: "Can manage team roles and permissions",
    category: "team"
  },
  // Settings Permissions
  {
    id: "settings.view",
    name: "View Settings",
    description: "Can view system settings",
    category: "settings"
  },
  {
    id: "settings.edit",
    name: "Edit Settings",
    description: "Can modify system settings",
    category: "settings"
  }
]

export function getDefaultPermissions(): Permission[] {
  return defaultPermissions.map(p => ({ ...p, isGranted: false }))
}

interface PermissionEditorProps {
  permissions: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}

export function PermissionEditor({ permissions, onChange, disabled }: PermissionEditorProps) {
  const togglePermission = (permissionId: string) => {
    const newPermissions = permissions.map(p => 
      p.id === permissionId ? { ...p, isGranted: !p.isGranted } : p
    )
    onChange(newPermissions)
  }

  const categories = Array.from(new Set(permissions.map(p => p.category)))

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium capitalize">{category}</h4>
            <Badge variant="outline" className="capitalize">
              {permissions.filter(p => p.category === category && p.isGranted).length} /{" "}
              {permissions.filter(p => p.category === category).length}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {permissions
              .filter(p => p.category === category)
              .map(permission => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between space-x-2 rounded-lg border p-4"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={permission.id}>{permission.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    id={permission.id}
                    checked={permission.isGranted}
                    onCheckedChange={() => togglePermission(permission.id)}
                    disabled={disabled}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}