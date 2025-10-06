"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Star,
  Zap,
  Users,
  CheckCircle,
  Settings as SettingsIcon,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  features: string[]
  max_projects: number
  max_users: number
  support_level: string
  is_active: boolean
  created_at: string
  user_count?: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    duration_days: 30,
    is_active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    console.log('Component mounted, fetching plans...')
    fetchPlans()
  }, [])

  useEffect(() => {
    console.log('Plans state updated:', plans.length, 'plans')
    console.log('Plans data:', plans)
  }, [plans])

  const fetchPlans = async () => {
    try {
      console.log('Fetching plans from API...')
      const response = await fetch('/api/admin/plans')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Plans received:', data)
        setPlans(data.plans)
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
    setLoading(false)
  }

  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.duration_days) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const planData = {
        ...newPlan,
        description: `${newPlan.name} - ₹${newPlan.price} for ${newPlan.duration_days} days`,
        features: ['Basic CRM Features'],
        max_projects: 50,
        max_users: 5,
        support_level: 'email'
      }

      console.log('Creating plan with data:', planData)

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Plan created successfully:', result)
        toast({
          title: "Success",
          description: "Plan created successfully",
        })
        resetForm()
        setIsAddPlanOpen(false)
        fetchPlans()
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        toast({
          title: "Error",
          description: error.error || "Failed to create plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Network error:', error)
      toast({
        title: "Error",
        description: "Network error - check console for details",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleEditPlan = async () => {
    if (!editingPlan) return

    setIsLoading(true)
    try {
      // Send only the fields that should be updated
      const updateData = {
        name: editingPlan.name,
        description: editingPlan.description,
        price: editingPlan.price,
        duration_days: editingPlan.duration_days,
        features: editingPlan.features,
        max_projects: editingPlan.max_projects,
        max_users: editingPlan.max_users,
        support_level: editingPlan.support_level,
        is_active: editingPlan.is_active
      }
      
      console.log('Updating plan with data:', updateData)
      
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      console.log('Update response:', data)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Plan updated successfully",
        })
        setEditingPlan(null)
        fetchPlans()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update plan",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteDialog = (planId: string) => {
    setDeletingPlanId(planId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePlan = async () => {
    if (!deletingPlanId) return

    setIsLoading(true)
    try {
      console.log('Deleting plan:', deletingPlanId)
      const response = await fetch(`/api/admin/plans/${deletingPlanId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      console.log('Delete response:', data)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setDeletingPlanId(null)
        fetchPlans()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete plan",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setNewPlan({
      name: '',
      price: 0,
      duration_days: 30,
      is_active: true
    })
  }

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase()
    if (name.includes('enterprise')) return Crown
    if (name.includes('pro')) return Star
    if (name.includes('basic')) return CheckCircle
    return Zap
  }

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase()
    if (name.includes('enterprise')) return 'bg-yellow-100 text-yellow-800'
    if (name.includes('pro')) return 'bg-purple-100 text-purple-800'
    if (name.includes('basic')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Plan Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Create and manage subscription plans</p>
          </div>
        </div>
        
        <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="e.g., Pro Plan"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: parseFloat(e.target.value) || 0})}
                  placeholder="1499"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newPlan.duration_days}
                  onChange={(e) => setNewPlan({...newPlan, duration_days: parseInt(e.target.value) || 30})}
                  placeholder="30"
                  min={1}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newPlan.is_active}
                  onCheckedChange={(checked) => setNewPlan({...newPlan, is_active: checked})}
                />
                <Label htmlFor="isActive">Active Plan</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => { setIsAddPlanOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPlan} 
                  disabled={isLoading || !newPlan.name || !newPlan.price || !newPlan.duration_days}
                >
                  {isLoading ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
              <SettingsIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{plans.reduce((sum, p) => sum + (p.user_count || 0), 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold">₹{Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.name)
          return (
            <Card key={plan.id} className={`border-2 ${plan.is_active ? 'border-primary/20' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PlanIcon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <Badge className={getPlanColor(plan.name)}>
                    ₹{plan.price}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-1 font-medium">{plan.duration_days} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Projects:</span>
                      <span className="ml-1 font-medium">{plan.max_projects === -1 ? 'Unlimited' : plan.max_projects}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Users:</span>
                      <span className="ml-1 font-medium">{plan.max_users === -1 ? 'Unlimited' : plan.max_users}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Support:</span>
                      <span className="ml-1 font-medium capitalize">{plan.support_level}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Features:</p>
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <p className="text-xs text-gray-500">+{plan.features.length - 3} more features</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {plan.user_count !== undefined && (
                        <span className="text-xs text-gray-500">{plan.user_count} users</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteDialog(plan.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Created</h3>
            <p className="text-gray-600 mb-4">Create your first subscription plan to get started.</p>
            <Button onClick={() => setIsAddPlanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Plan Dialog */}
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan: {editingPlan.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Duration (Days) *</Label>
                <Input
                  type="number"
                  value={editingPlan.duration_days}
                  onChange={(e) => setEditingPlan({...editingPlan, duration_days: parseInt(e.target.value) || 30})}
                  min={1}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_active: checked})}
                />
                <Label>Active Plan</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditPlan} 
                  disabled={isLoading || !editingPlan.name || !editingPlan.price || !editingPlan.duration_days}
                >
                  {isLoading ? 'Updating...' : 'Update Plan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan
              and remove it from our servers.
              {deletingPlanId && plans.find(p => p.id === deletingPlanId)?.user_count && plans.find(p => p.id === deletingPlanId)!.user_count! > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Warning:</strong> This plan has {plans.find(p => p.id === deletingPlanId)!.user_count} active user(s). 
                  Deleting it may affect their subscriptions.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}