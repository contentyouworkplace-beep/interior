"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Search, 
  MoreHorizontal, 
  Users, 
  Calendar, 
  DollarSign,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for companies
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompanies([
        {
          id: 1,
          name: "Elite Design Studio",
          email: "contact@elitedesign.com",
          phone: "+91 98765 43210",
          city: "Mumbai",
          state: "Maharashtra",
          subscription: "Pro",
          status: "active",
          users: 5,
          projects: 23,
          revenue: 45000,
          joinDate: "2024-01-15",
          lastActive: "2 hours ago"
        },
        {
          id: 2,
          name: "Modern Interiors LLC",
          email: "hello@moderninteriors.com",
          phone: "+91 87654 32109",
          city: "Delhi",
          state: "Delhi",
          subscription: "Basic",
          status: "active",
          users: 3,
          projects: 12,
          revenue: 28000,
          joinDate: "2024-02-20",
          lastActive: "1 day ago"
        },
        {
          id: 3,
          name: "Creative Spaces",
          email: "info@creativespaces.co.in",
          phone: "+91 76543 21098",
          city: "Bangalore",
          state: "Karnataka",
          subscription: "Enterprise",
          status: "active",
          users: 12,
          projects: 45,
          revenue: 89000,
          joinDate: "2023-11-10",
          lastActive: "30 minutes ago"
        },
        {
          id: 4,
          name: "Luxury Living Designs",
          email: "contact@luxuryliving.com",
          phone: "+91 65432 10987",
          city: "Pune",
          state: "Maharashtra",
          subscription: "Pro",
          status: "inactive",
          users: 2,
          projects: 8,
          revenue: 15000,
          joinDate: "2024-03-05",
          lastActive: "2 weeks ago"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'trial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionColor = (subscription) => {
    switch (subscription) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800'
      case 'Pro': return 'bg-blue-100 text-blue-800'
      case 'Basic': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage all registered companies</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search companies, emails, or cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold">{companies.filter(c => c.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{companies.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{companies.reduce((sum, c) => sum + c.users, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No companies found matching your search.
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div 
                  key={company.id} 
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 lg:space-y-0"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        <div className="flex space-x-2 mt-1 sm:mt-0">
                          <Badge className={getStatusColor(company.status)}>
                            {company.status}
                          </Badge>
                          <Badge className={getSubscriptionColor(company.subscription)}>
                            {company.subscription}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{company.email}</p>
                      <p className="text-sm text-gray-500">{company.phone} • {company.city}, {company.state}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(company.joinDate).toLocaleDateString()} • Last active {company.lastActive}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:min-w-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{company.users}</p>
                        <p className="text-xs text-gray-500">Users</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{company.projects}</p>
                        <p className="text-xs text-gray-500">Projects</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">₹{company.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
                    </div>
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