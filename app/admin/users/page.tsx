"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Building2,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  organization?: {
    id: string
    name: string
  }
  subscription?: {
    plan: string
    plan_id?: string
    status: string
    expires_at: string
  }
  is_active?: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    company: 'Acctech',
    plan: ''
  })
  
  const [editUser, setEditUser] = useState({
    id: '',
    email: '',
    company: '',
    plan: '',
    password: '',
    is_active: true
  })
  
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans/active')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
        if (data.plans.length > 0) {
          setNewUser(prev => ({ ...prev, plan: data.plans[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }

  const calculateDaysLeft = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgressColor = (daysLeft: number, totalDays: number) => {
    const percentage = (daysLeft / totalDays) * 100
    if (percentage > 60) return '#10b981' // green
    if (percentage > 30) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getProgressPercentage = (daysLeft: number, totalDays: number) => {
    if (daysLeft < 0) return 0
    return Math.min((daysLeft / totalDays) * 100, 100)
  }

  const DaysLeftIndicator = ({ daysLeft, totalDays = 90 }: { daysLeft: number, totalDays?: number }) => {
    const percentage = getProgressPercentage(daysLeft, totalDays)
    const color = getProgressColor(daysLeft, totalDays)
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <svg className="transform -rotate-90" width="40" height="40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color }}>
            {daysLeft > 0 ? daysLeft : 0}
          </div>
        </div>
        <span className="text-sm text-gray-600">days left</span>
      </div>
    )
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.plan) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        })
        setNewUser({ 
          email: '', 
          password: '', 
          company: 'Acctech',
          plan: plans.length > 0 ? plans[0].id : ''
        })
        setIsAddUserOpen(false)
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewOpen(true)
  }

  const handleEditClick = (user: User) => {
    // Try to get plan_id first, then match by name
    let planId = user.subscription?.plan_id || ''
    
    if (!planId) {
      // Find the plan ID from the plan name
      const userPlanName = user.subscription?.plan || ''
      const matchingPlan = plans.find(p => 
        p.name.toLowerCase() === userPlanName.toLowerCase() || 
        p.id === userPlanName
      )
      planId = matchingPlan?.id || ''
    }
    
    // Default to first plan if no match
    if (!planId && plans.length > 0) {
      planId = plans[0].id
    }
    
    console.log('Editing user:', user)
    console.log('User plan name:', user.subscription?.plan)
    console.log('User plan_id:', user.subscription?.plan_id)
    console.log('Selected plan ID:', planId)
    console.log('Available plans:', plans)
    
    setEditUser({
      id: user.id,
      email: user.email,
      company: user.organization?.name || '',
      plan: planId,
      password: '',
      is_active: user.is_active !== false
    })
    setIsEditOpen(true)
  }

  const handleEditUser = async () => {
    setIsLoading(true)
    try {
      console.log('Updating user with data:', editUser)
      const response = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editUser.email,
          company: editUser.company,
          plan: editUser.plan,
          password: editUser.password || undefined,
          is_active: editUser.is_active
        }),
      })

      const data = await response.json()
      console.log('Update response:', data)

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditOpen(false)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const openDeleteDialog = (userId: string) => {
    setDeletingUserId(userId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUserId) return

    setIsLoading(true)
    try {
      console.log('Deleting user:', deletingUserId)
      const response = await fetch(`/api/admin/users/${deletingUserId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      console.log('Delete response:', data)

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setDeletingUserId(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      console.log(`Toggling user ${userId} from ${currentStatus} to ${newStatus}`)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      })

      const data = await response.json()
      console.log('Toggle response:', data)

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage CRM users and their subscriptions</p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.is_active !== false).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">
                  {new Set(users.map(u => u.organization?.name).filter(Boolean)).size}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const daysLeft = user.subscription?.expires_at 
                      ? calculateDaysLeft(user.subscription.expires_at)
                      : 0
                    const isExpired = daysLeft <= 0
                    const status = user.subscription?.status || 'active'

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{user.organization?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.subscription?.plan || 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm font-semibold">Expired</span>
                            </div>
                          ) : (
                            <DaysLeftIndicator daysLeft={daysLeft} totalDays={90} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={status === 'active' ? "default" : "destructive"}
                            className={status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {status === 'active' ? 'Active' : 'Expired'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="user@company.com"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                placeholder="Company Name"
                value={newUser.company}
                onChange={(e) => setNewUser({...newUser, company: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subscription Plan *</Label>
              <Select value={newUser.plan} onValueChange={(value) => setNewUser({...newUser, plan: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUser} 
                disabled={isLoading || !newUser.email || !newUser.password || !newUser.plan}
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Company</Label>
                <p className="font-medium">{selectedUser.organization?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Plan</Label>
                <p className="font-medium capitalize">{selectedUser.subscription?.plan || 'None'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{selectedUser.subscription?.status || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Expires At</Label>
                <p className="font-medium">
                  {selectedUser.subscription?.expires_at 
                    ? new Date(selectedUser.subscription.expires_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="font-medium">
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </p>
              </div>
              {selectedUser.last_sign_in_at && (
                <div>
                  <Label className="text-muted-foreground">Last Sign In</Label>
                  <p className="font-medium">
                    {new Date(selectedUser.last_sign_in_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                placeholder="user@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={editUser.company}
                onChange={(e) => setEditUser({...editUser, company: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>New Password (optional)</Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-gray-500">Minimum 6 characters. Leave blank to keep existing password.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={editUser.plan} onValueChange={(value) => setEditUser({...editUser, plan: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editUser.is_active}
                onCheckedChange={(checked) => setEditUser({...editUser, is_active: checked})}
              />
              <Label>Active Status</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
