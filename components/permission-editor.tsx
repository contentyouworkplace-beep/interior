"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export interface Permission {
  id: string
  name: string
  description: string
  category: string
  isGranted: boolean
}

interface PermissionEditorProps {
  permissions: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}

export function PermissionEditor({ permissions, onChange, disabled = false }: PermissionEditorProps) {
  const handlePermissionChange = (permissionId: string, isGranted: boolean) => {
    const updatedPermissions = permissions.map(permission =>
      permission.id === permissionId
        ? { ...permission, isGranted }
        : permission
    )
    onChange(updatedPermissions)
  }

  const categoryGroups = permissions.reduce((groups, permission) => {
    if (!groups[permission.category]) {
      groups[permission.category] = []
    }
    groups[permission.category].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-4">
      {Object.entries(categoryGroups).map(([category, categoryPermissions]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryPermissions.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-2">
                <Checkbox
                  id={permission.id}
                  checked={permission.isGranted}
                  disabled={disabled}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(permission.id, !!checked)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={permission.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function getDefaultPermissions(): Permission[] {
  return [
    {
      id: "clients.view",
      name: "View Clients",
      description: "Can view client information and details",
      category: "clients",
      isGranted: true
    },
    {
      id: "clients.create",
      name: "Create Clients",
      description: "Can create new client records",
      category: "clients",
      isGranted: false
    },
    {
      id: "clients.edit",
      name: "Edit Clients",
      description: "Can modify existing client information",
      category: "clients",
      isGranted: false
    },
    {
      id: "clients.delete",
      name: "Delete Clients",
      description: "Can delete client records",
      category: "clients",
      isGranted: false
    },
    {
      id: "projects.view",
      name: "View Projects",
      description: "Can view project information and details",
      category: "projects",
      isGranted: true
    },
    {
      id: "projects.create",
      name: "Create Projects",
      description: "Can create new projects",
      category: "projects",
      isGranted: false
    },
    {
      id: "projects.edit",
      name: "Edit Projects",
      description: "Can modify existing projects",
      category: "projects",
      isGranted: false
    },
    {
      id: "projects.delete",
      name: "Delete Projects",
      description: "Can delete projects",
      category: "projects",
      isGranted: false
    },
    {
      id: "tasks.view",
      name: "View Tasks",
      description: "Can view task information",
      category: "tasks",
      isGranted: true
    },
    {
      id: "tasks.create",
      name: "Create Tasks",
      description: "Can create new tasks",
      category: "tasks",
      isGranted: false
    },
    {
      id: "tasks.edit",
      name: "Edit Tasks",
      description: "Can modify existing tasks",
      category: "tasks",
      isGranted: false
    },
    {
      id: "tasks.delete",
      name: "Delete Tasks",
      description: "Can delete tasks",
      category: "tasks",
      isGranted: false
    },
    {
      id: "expenses.view",
      name: "View Expenses",
      description: "Can view expense information",
      category: "expenses",
      isGranted: true
    },
    {
      id: "expenses.create",
      name: "Create Expenses",
      description: "Can create new expenses",
      category: "expenses",
      isGranted: false
    },
    {
      id: "expenses.edit",
      name: "Edit Expenses",
      description: "Can modify existing expenses",
      category: "expenses",
      isGranted: false
    },
    {
      id: "expenses.delete",
      name: "Delete Expenses",
      description: "Can delete expenses",
      category: "expenses",
      isGranted: false
    },
    {
      id: "invoices.view",
      name: "View Invoices",
      description: "Can view invoice information",
      category: "invoices",
      isGranted: true
    },
    {
      id: "invoices.create",
      name: "Create Invoices",
      description: "Can create new invoices",
      category: "invoices",
      isGranted: false
    },
    {
      id: "invoices.edit",
      name: "Edit Invoices",
      description: "Can modify existing invoices",
      category: "invoices",
      isGranted: false
    },
    {
      id: "invoices.delete",
      name: "Delete Invoices",
      description: "Can delete invoices",
      category: "invoices",
      isGranted: false
    },
    {
      id: "quotations.view",
      name: "View Quotations",
      description: "Can view quotation information",
      category: "quotations",
      isGranted: true
    },
    {
      id: "quotations.create",
      name: "Create Quotations",
      description: "Can create new quotations",
      category: "quotations",
      isGranted: false
    },
    {
      id: "quotations.edit",
      name: "Edit Quotations",
      description: "Can modify existing quotations",
      category: "quotations",
      isGranted: false
    },
    {
      id: "quotations.delete",
      name: "Delete Quotations",
      description: "Can delete quotations",
      category: "quotations",
      isGranted: false
    },
    {
      id: "team.view",
      name: "View Team",
      description: "Can view team member information",
      category: "team",
      isGranted: true
    },
    {
      id: "team.manage",
      name: "Manage Team",
      description: "Can add, edit, and remove team members",
      category: "team",
      isGranted: false
    },
    {
      id: "reports.view",
      name: "View Reports",
      description: "Can view reports and analytics",
      category: "reports",
      isGranted: true
    },
    {
      id: "reports.export",
      name: "Export Reports",
      description: "Can export reports to various formats",
      category: "reports",
      isGranted: false
    },
    {
      id: "settings.view",
      name: "View Settings",
      description: "Can view system settings",
      category: "settings",
      isGranted: false
    },
    {
      id: "settings.edit",
      name: "Edit Settings",
      description: "Can modify system settings",
      category: "settings",
      isGranted: false
    }
  ]
}