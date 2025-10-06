"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Building2,
  Mail,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
    plan: '',
    validityDays: 30,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
        // Set default plan if available
        if (data.plans.length > 0) {
          setNewUser(prev => ({
            ...prev,
            plan: data.plans[0].id
          }))
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

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.company || !newUser.plan || !newUser.validityDays) {
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          firstName: '',
          lastName: '',
          company: '', 
          plan: plans.length > 0 ? plans[0].id : '',
          validityDays: 30,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        setIsAddUserOpen(false)
        fetchUsers() // Refresh the list
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage CRM users and organizations</p>
          </div>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="user@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={newUser.company}
                  onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                  placeholder="Company Name"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan *</Label>
                  <select 
                    id="plan"
                    value={newUser.plan}
                    onChange={(e) => {
                      const selectedPlan = plans.find(p => p.id === e.target.value)
                      setNewUser({
                        ...newUser, 
                        plan: e.target.value,
                        validityDays: selectedPlan?.duration_days || 30,
                        expiryDate: new Date(Date.now() + (selectedPlan?.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    <option value="">Select a plan...</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                      </option>
                    ))}
                  </select>
                  {plans.length === 0 && (
                    <p className="text-xs text-gray-500">Loading plans...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validityDays">Validity (Days) *</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={newUser.validityDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 30
                      setNewUser({
                        ...newUser, 
                        validityDays: days,
                        expiryDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      })
                    }}
                    placeholder="30"
                    min={1}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newUser.expiryDate}
                  onChange={(e) => setNewUser({...newUser, expiryDate: e.target.value})}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Automatically calculated based on validity days, but you can override if needed
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser} 
                  disabled={isLoading || !newUser.email || !newUser.password || !newUser.company || !newUser.plan}
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users or companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Organizations</p>
                <p className="text-2xl font-bold">{new Set(users.map(u => u.organization?.id)).size}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">+12</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        {user.organization?.name || 'No organization'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                      {user.email_confirmed_at ? "Verified" : "Unverified"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}