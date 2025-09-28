"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  User,
  Trash2,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  avatar?: string;
  salary?: number; // Monthly salary in INR
  advance_salary?: number; // Advance given
  notes?: string; // Payment notes
  employment_type?: 'salary' | 'freelancer'; // Employment type
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface PaymentRecord {
  id?: number;
  month?: string;
  year?: number;
  payment_type: 'monthly_salary' | 'freelance_payment' | 'advance' | 'bonus';
  amount: number;
  description: string;
  payment_date?: string;
  notes?: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null)
  const [memberProjects, setMemberProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [selectedPaymentMember, setSelectedPaymentMember] = useState<TeamMember | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    salary: '',
    advance_salary: '',
    notes: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    payment_type: 'monthly_salary' as 'monthly_salary' | 'freelance_payment' | 'advance' | 'bonus',
    amount: '',
    description: '',
    payment_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    notes: ''
  });

  // Use 1-based month (1 = January) to match server filtering which expects 1-12
  const [currentPaymentMonth, setCurrentPaymentMonth] = useState(new Date().getMonth() + 1);
  const [currentPaymentYear, setCurrentPaymentYear] = useState(new Date().getFullYear());

  // Helper functions for payment types
  const getDescriptionPlaceholder = (type: string) => {
    switch (type) {
      case 'monthly_salary': return 'e.g., September 2025 salary'
      case 'freelance_payment': return 'e.g., Website design project'
      case 'advance': return 'e.g., Festival advance'
      case 'bonus': return 'e.g., Performance bonus'
      default: return 'Enter description'
    }
  }

  const getPaymentTypeInfo = (type: string) => {
    switch (type) {
      case 'monthly_salary': return '💼 Regular monthly salary payment'
      case 'freelance_payment': return '🎯 One-time project payment for freelancers'
      case 'advance': return '💰 Advance payment (will be adjusted in future)'
      case 'bonus': return '🎉 Additional bonus or incentive payment'
      default: return ''
    }
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'monthly_salary': return 'bg-blue-100 text-blue-800'
      case 'freelance_payment': return 'bg-purple-100 text-purple-800'
      case 'advance': return 'bg-orange-100 text-orange-800'
      case 'bonus': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Fetch team members
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  // Refetch payment history when month/year changes
  useEffect(() => {
    if (selectedPaymentMember) {
      fetchPaymentHistory(selectedPaymentMember.id, currentPaymentMonth, currentPaymentYear)
    }
  }, [currentPaymentMonth, currentPaymentYear, selectedPaymentMember])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      const result = await response.json()
      
      if (response.ok) {
        setTeamMembers(result.data || [])
      } else {
        toast.error('Failed to load team members')
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMemberProjects = async (memberId: number) => {
    setProjectsLoading(true)
    try {
      const response = await fetch(`/api/team/${memberId}/projects`)
      const result = await response.json()
      
      if (response.ok) {
        setMemberProjects(result.projects || [])
      } else {
        console.error('Failed to load member projects:', result.error)
        setMemberProjects([])
      }
    } catch (error) {
      console.error('Error fetching member projects:', error)
      setMemberProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }

  const fetchPaymentHistory = async (memberId: number, month?: number, year?: number) => {
    setPaymentLoading(true)
    try {
      const params = new URLSearchParams()
      if (month !== undefined) params.append('month', month.toString())
      if (year !== undefined) params.append('year', year.toString())
      
      const response = await fetch(`/api/team/${memberId}/payments?${params.toString()}`)
      const result = await response.json()
      
      if (response.ok) {
        // API may return either an array or { data: [...] }
        const payments = Array.isArray(result) ? result : (result.data || [])
        setPaymentRecords(payments)
      } else {
        console.error('Failed to load payment history:', result.error)
        setPaymentRecords([])
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setPaymentRecords([])
    } finally {
      setPaymentLoading(false)
    }
  }

  const savePaymentRecord = async () => {
    if (!selectedPaymentMember) return

    try {
      const response = await fetch(`/api/team/${selectedPaymentMember.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_type: paymentFormData.payment_type,
          amount: parseFloat(paymentFormData.amount) || 0,
          description: paymentFormData.description,
          payment_date: paymentFormData.payment_date || null,
          notes: paymentFormData.notes || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // If API returned the created payment, append it or refetch
        const created = result?.data || result
        toast.success('Payment record saved successfully!')
        // Prefer refetch to get latest set
        fetchPaymentHistory(selectedPaymentMember.id, currentPaymentMonth, currentPaymentYear)
        setPaymentFormData({
          payment_type: 'monthly_salary',
          amount: '',
          description: '',
          payment_date: new Date().toISOString().split('T')[0], // Today's date
          notes: ''
        })
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to save payment record')
      }
    } catch (error) {
      console.error('Error saving payment record:', error)
      toast.error('Failed to save payment record')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      status: 'active',
      salary: '',
      advance_salary: '',
      notes: ''
    });
    setEditingMember(null)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone || null,
          status: 'active',
          monthly_salary: formData.salary ? parseFloat(formData.salary) : null,
          advance_salary: formData.advance_salary ? parseFloat(formData.advance_salary) : null,
          notes: formData.notes || null
        }),
      });

      if (response.ok) {
        toast.success('Team member added successfully!')
        resetForm()
        setShowAddDialog(false)
        fetchTeamMembers()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to add team member')
      }
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Failed to add team member')
    }
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    try {
      const response = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone || null,
          status: formData.status,
          monthly_salary: formData.salary ? parseFloat(formData.salary) : null,
          advance_salary: formData.advance_salary ? parseFloat(formData.advance_salary) : null,
          notes: formData.notes || null
        }),
      });

      if (response.ok) {
        toast.success('Team member updated successfully!')
        resetForm()
        setShowViewDialog(false)
        fetchTeamMembers()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update team member')
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      toast.error('Failed to update team member')
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Deleting team member...');
      
      const response = await fetch(`/api/team/${memberToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.ok) {
        toast.success('Team member deleted successfully!');
        setShowDeleteDialog(false);
        setMemberToDelete(null);
        setMemberProjects([]);
        fetchTeamMembers();
      } else {
        // Get detailed error message
        let errorMessage = 'Failed to delete team member';
        try {
          const result = await response.json();
          if (result && result.error) {
            errorMessage = result.error;
            console.error('API Error:', result.error);
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
        }
        
        // Show more helpful error message based on status code
        if (response.status === 401) {
          toast.error('Authentication error. Please log in again.');
        } else if (response.status === 403) {
          toast.error('You do not have permission to delete this team member.');
        } else if (response.status === 404) {
          toast.error('Team member not found. It may have been already deleted.');
          // Close dialog and refresh list since member doesn't exist
          setShowDeleteDialog(false);
          setMemberToDelete(null);
          fetchTeamMembers();
        } else if (response.status === 409) {
          toast.error('Cannot delete: Team member is still assigned to projects or tasks.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Network error occurred. Please check your connection and try again.');
    }
  }

  const handleUnassignFromProjects = async () => {
    if (!memberToDelete) return;
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Unassigning from all projects...');
      
      // Call API to unassign team member from all projects
      const response = await fetch(`/api/team/${memberToDelete}/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Team member unassigned from all projects!');
        
        // Refresh the projects list to reflect the changes
        await fetchMemberProjects(memberToDelete);
        
        // If no projects remain, clear the list to show the user can now delete
        setTimeout(() => {
          setMemberProjects([]);
        }, 500);
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to unassign from projects');
      }
    } catch (error) {
      console.error('Error unassigning team member:', error);
      toast.error('Failed to unassign from projects');
    }
  }

  const calculateBalance = (salary: number, advance: number) => {
    return salary - advance
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Team Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading team members...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Team Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          {teamMembers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first team member.</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        {member.salary && (
                          <p className="text-xs text-green-600 font-medium">₹{member.salary.toLocaleString()}/month</p>
                        )}
                        {member.advance_salary && (
                          <p className="text-xs text-orange-600">Advance: ₹{member.advance_salary.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="mr-2">
                        {member.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        setViewingMember(member)
                        setEditingMember(null)
                        setShowViewDialog(true)
                        fetchMemberProjects(member.id)
                      }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingMember(member)
                        setViewingMember(member)
                        setFormData({
                          name: member.name,
                          role: member.role,
                          email: member.email,
                          phone: member.phone || '',
                          status: member.status,
                          salary: member.salary?.toString() || '',
                          advance_salary: member.advance_salary?.toString() || '',
                          notes: member.notes || ''
                        });
                        setShowViewDialog(true)
                      }}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="bg-green-50 text-green-600 hover:bg-green-100" onClick={() => {
                        setSelectedPaymentMember(member)
                        setPaymentFormData({
                          payment_type: 'monthly_salary',
                          amount: '',
                          description: '',
                          payment_date: new Date().toISOString().split('T')[0], // Today's date
                          notes: ''
                        })
                        setShowPaymentDialog(true)
                        fetchPaymentHistory(member.id, currentPaymentMonth, currentPaymentYear)
                      }}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Payment
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={async () => {
                        setMemberToDelete(member.id)
                        await fetchMemberProjects(member.id)
                        setShowDeleteDialog(true)
                      }}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Team Member Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Monthly Salary (INR) (Optional)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="Enter monthly salary in INR (optional)"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  resetForm()
                  setShowAddDialog(false)
                }}>
                  Cancel
                </Button>
                <Button type="submit">Add Member</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View/Edit Team Member Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Team Member & Update Payment' : 'Team Member Payment Details'}
              </DialogTitle>
            </DialogHeader>
            
            {viewingMember && !editingMember && (
              <div className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src={viewingMember.avatar} />
                    <AvatarFallback>{viewingMember.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-lg">{viewingMember.name}</h3>
                  <p className="text-gray-600">{viewingMember.role}</p>
                  <Badge variant={viewingMember.status === 'active' ? 'default' : 'secondary'}>
                    {viewingMember.status}
                  </Badge>
                </div>
                
                {/* Payment Information */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Payment Record</h4>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {viewingMember.email}</p>
                    {viewingMember.phone && <p><strong>Phone:</strong> {viewingMember.phone}</p>}
                    {viewingMember.salary && (
                      <p><strong>Monthly Salary:</strong> ₹{viewingMember.salary.toLocaleString()}</p>
                    )}
                    {viewingMember.advance_salary && (
                      <p><strong>Advance Given:</strong> ₹{viewingMember.advance_salary.toLocaleString()}</p>
                    )}
                    {viewingMember.notes && (
                      <p><strong>Notes:</strong> {viewingMember.notes}</p>
                    )}
                    {viewingMember.salary && viewingMember.advance_salary && (
                      <div className="p-3 bg-white rounded border mt-3">
                        <p className="text-lg font-semibold">
                          <strong>Balance Due:</strong> ₹{calculateBalance(viewingMember.salary, viewingMember.advance_salary).toLocaleString()}
                        </p>
                        {calculateBalance(viewingMember.salary, viewingMember.advance_salary) > 0 && (
                          <p className="text-green-600 text-sm">Amount to pay</p>
                        )}
                        {calculateBalance(viewingMember.salary, viewingMember.advance_salary) < 0 && (
                          <p className="text-red-600 text-sm">Excess advance given</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Project Assignments */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Project Assignments</h4>
                  {projectsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading projects...</p>
                    </div>
                  ) : memberProjects.length > 0 ? (
                    <div className="space-y-2">
                      {memberProjects.map((project) => (
                        <div key={project.id} className="p-3 bg-white rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-sm">{project.name}</h5>
                              <p className="text-xs text-gray-500">Started: {new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No project assignments found</p>
                  )}
                </div>
                
                <Button 
                  onClick={() => setShowViewDialog(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}

            {editingMember && (
              <form onSubmit={handleEditMember}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_name">Name</Label>
                    <Input
                      id="edit_name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_role">Role</Label>
                    <Input
                      id="edit_role"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input
                      id="edit_phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Monthly Salary */}
                  <div className="mt-4">
                    <Label htmlFor="edit_salary">Monthly Salary (INR)</Label>
                    <Input
                      id="edit_salary"
                      type="number"
                      placeholder="Enter monthly salary"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm()
                    setShowViewDialog(false)
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Member</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="bg-red-50 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-medium text-lg mb-2">Delete Team Member</h3>
              
              {memberProjects.length > 0 ? (
                <div className="mb-4">
                  <p className="text-gray-600 mb-3">⚠️ This team member is currently assigned to {memberProjects.length} project(s):</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="space-y-2 text-sm">
                      {memberProjects.slice(0, 3).map((project) => (
                        <div key={project.id} className="flex justify-between items-center">
                          <span className="font-medium">{project.name}</span>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                      ))}
                      {memberProjects.length > 3 && (
                        <p className="text-gray-500 text-center mt-2">...and {memberProjects.length - 3} more</p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-yellow-300">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full bg-white hover:bg-gray-50 text-yellow-700 border-yellow-300"
                        onClick={handleUnassignFromProjects}
                      >
                        Unassign from All Projects
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    You can unassign this team member from all projects first, then delete them.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">Are you sure you want to delete this team member? This action cannot be undone.</p>
              )}
            </div>
            <DialogFooter className="flex space-x-2 justify-center">
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false)
                setMemberToDelete(null)
                setMemberProjects([])
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteMember}>
                {memberProjects.length > 0 ? 'Force Delete & Unassign All' : 'Delete Team Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Management Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Management - {selectedPaymentMember?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Month Payment Entry */}
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Add Payment Record
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Select 
                      value={paymentFormData.payment_type} 
                      onValueChange={(value: 'monthly_salary' | 'freelance_payment' | 'advance' | 'bonus') => 
                        setPaymentFormData({...paymentFormData, payment_type: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_salary">💼 Monthly Salary</SelectItem>
                        <SelectItem value="freelance_payment">🎯 Freelance Payment</SelectItem>
                        <SelectItem value="advance">💰 Advance Payment</SelectItem>
                        <SelectItem value="bonus">🎉 Bonus/Incentive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_amount">Amount (₹)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      placeholder="Enter amount"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_description">Description</Label>
                    <Input
                      id="payment_description"
                      placeholder={getDescriptionPlaceholder(paymentFormData.payment_type)}
                      value={paymentFormData.description}
                      onChange={(e) => setPaymentFormData({...paymentFormData, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentFormData.payment_date}
                      onChange={(e) => setPaymentFormData({...paymentFormData, payment_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_notes">Notes</Label>
                    <Textarea
                      id="payment_notes"
                      placeholder="Additional notes..."
                      value={paymentFormData.notes}
                      onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {getPaymentTypeInfo(paymentFormData.payment_type)}
                  </div>
                  <Button onClick={savePaymentRecord} className="bg-green-600 hover:bg-green-700">
                    Save Payment Record
                  </Button>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Payment History</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // currentPaymentMonth is 1-based (1..12). Move to previous month.
                        const isJan = currentPaymentMonth === 1
                        const newMonth = isJan ? 12 : currentPaymentMonth - 1
                        const newYear = isJan ? currentPaymentYear - 1 : currentPaymentYear
                        setCurrentPaymentMonth(newMonth)
                        setCurrentPaymentYear(newYear)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[120px] text-center">
                      {/* Convert to 0-based month for Date constructor */}
                      {new Date(currentPaymentYear, currentPaymentMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // currentPaymentMonth is 1-based (1..12). Move to next month.
                        const isDec = currentPaymentMonth === 12
                        const newMonth = isDec ? 1 : currentPaymentMonth + 1
                        const newYear = isDec ? currentPaymentYear + 1 : currentPaymentYear
                        setCurrentPaymentMonth(newMonth)
                        setCurrentPaymentYear(newYear)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {paymentLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading payment history...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentRecords.length > 0 ? (
                      paymentRecords
                        .filter(record => {
                          // Show all records for now, can filter by date later
                          return true
                        })
                        .sort((a, b) => new Date(b.payment_date || '').getTime() - new Date(a.payment_date || '').getTime())
                        .map((record, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getPaymentTypeColor(record.payment_type)}`}>
                                  {record.payment_type.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="font-medium">{record.description}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-green-600">₹{record.amount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">
                                  {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'Date not set'}
                                </p>
                              </div>
                            </div>
                            
                            {record.notes && (
                              <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
                                <p className="text-sm text-gray-600"><strong>Notes:</strong> {record.notes}</p>
                              </div>
                            )}
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No payment records found for {new Date(currentPaymentYear, currentPaymentMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm mt-2">Add your first payment record above</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPaymentDialog(false)
                setSelectedPaymentMember(null)
                setPaymentRecords([])
              }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
