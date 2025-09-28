"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Award,
  TrendingUp,
  BarChart3,
  Clock
} from "lucide-react"
import { AddTeamMemberDialog } from "@/components/add-team-member-dialog"

interface TeamMember {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: "active" | "on-leave" | "inactive"
  joinDate: string
  avatar: string
  location: string
  salary: string
  activeProjects: number
  completedProjects: number
  performance: number
  skills: string[]
  currentWorkload: number
  lastActive: string
}

export default function TeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@designstudio.ae",
      phone: "+971 50 123 4567",
      role: "Senior Interior Designer",
      status: "active",
      joinDate: "2023-01-15",
      avatar: "/placeholder.svg?height=64&width=64",
      location: "Mumbai, India",
      salary: "AED 15,000",
      activeProjects: 3,
      completedProjects: 12,
      performance: 92,
      skills: ["3D Modeling", "AutoCAD", "Project Management"],
      currentWorkload: 85,
      lastActive: "2024-01-15"
    },
    {
      id: 2,
      name: "Sarah Smith",
      email: "sarah@designstudio.ae",
      phone: "+971 55 987 6543",
      role: "Junior Designer",
      status: "active",
      joinDate: "2023-06-20",
      avatar: "/placeholder.svg?height=64&width=64",
      location: "Bengaluru, India",
      salary: "AED 8,000",
      activeProjects: 2,
      completedProjects: 6,
      performance: 88,
      skills: ["Sketching", "Color Theory", "Client Relations"],
      currentWorkload: 65,
      lastActive: "2024-01-15"
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@designstudio.ae",
      phone: "+971 52 345 6789",
      role: "Project Manager",
      status: "active",
      joinDate: "2022-11-10",
      avatar: "/placeholder.svg?height=64&width=64",
      location: "Hyderabad, India",
      salary: "AED 12,000",
      activeProjects: 5,
      completedProjects: 18,
      performance: 95,
      skills: ["Leadership", "Planning", "Budget Management"],
      currentWorkload: 90,
      lastActive: "2024-01-14"
    },
    {
      id: 4,
      name: "Lisa Anderson",
      email: "lisa@designstudio.ae",
      phone: "+971 56 234 5678",
      role: "3D Visualizer",
      status: "on-leave",
      joinDate: "2023-03-05",
      avatar: "/placeholder.svg?height=64&width=64",
      location: "Chennai, India",
      salary: "AED 10,000",
      activeProjects: 0,
      completedProjects: 8,
      performance: 90,
      skills: ["3ds Max", "V-Ray", "Photoshop"],
      currentWorkload: 0,
      lastActive: "2024-01-10"
    }
  ]

  const [viewedMember, setViewedMember] = useState<TeamMember | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [members, setMembers] = useState(teamMembers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return "text-red-600"
    if (workload >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || member.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const teamStats = [
    {
      title: "Total Team Members",
      value: teamMembers.length.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Members",
      value: teamMembers.filter((m) => m.status === "active").length.toString(),
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Average Performance",
      value: `${Math.round(teamMembers.reduce((sum, m) => sum + m.performance, 0) / teamMembers.length)}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Avg Workload",
      value: `${Math.round(teamMembers.reduce((sum, m) => sum + m.currentWorkload, 0) / teamMembers.length)}%`,
      icon: BarChart3,
      color: "text-purple-600",
    }
  ]

  return (
    <DashboardLayout title="Team Members">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamStats.map((stat, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Analytics */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Team Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Distribution */}
              <div>
                <h4 className="font-medium mb-3">Performance Distribution</h4>
                <div className="space-y-2">
                  {[
                    { range: "90-100%", count: teamMembers.filter(m => m.performance >= 90).length, color: "bg-green-500" },
                    { range: "80-89%", count: teamMembers.filter(m => m.performance >= 80 && m.performance < 90).length, color: "bg-blue-500" },
                    { range: "70-79%", count: teamMembers.filter(m => m.performance >= 70 && m.performance < 80).length, color: "bg-yellow-500" },
                    { range: "Below 70%", count: teamMembers.filter(m => m.performance < 70).length, color: "bg-red-500" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.range}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workload Analysis */}
              <div>
                <h4 className="font-medium mb-3">Workload Status</h4>
                <div className="space-y-2">
                  {[
                    { status: "Overloaded (90%+)", count: teamMembers.filter(m => m.currentWorkload >= 90).length, color: "text-red-600" },
                    { status: "High (75-89%)", count: teamMembers.filter(m => m.currentWorkload >= 75 && m.currentWorkload < 90).length, color: "text-yellow-600" },
                    { status: "Optimal (50-74%)", count: teamMembers.filter(m => m.currentWorkload >= 50 && m.currentWorkload < 75).length, color: "text-green-600" },
                    { status: "Available (<50%)", count: teamMembers.filter(m => m.currentWorkload < 50).length, color: "text-blue-600" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <span className={`text-sm font-medium ${item.color}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Summary */}
              <div>
                <h4 className="font-medium mb-3">Top Skills</h4>
                <div className="space-y-2">
                  {(() => {
                    const skillCount = teamMembers.reduce((acc, member) => {
                      member.skills.forEach(skill => {
                        acc[skill] = (acc[skill] || 0) + 1
                      })
                      return acc
                    }, {} as Record<string, number>)
                    
                    return Object.entries(skillCount)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([skill, count], index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{skill}</span>
                          <span className="text-sm font-medium text-primary">{count}</span>
                        </div>
                      ))
                  })()}
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium mb-3">Quick Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Performance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {teamMembers.filter(m => m.performance >= 90).length} high performers (90%+)
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-sm">Capacity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {teamMembers.filter(m => m.currentWorkload < 75).length} members available for new projects
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Experience</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Avg {Math.round(teamMembers.reduce((sum, m) => sum + m.completedProjects, 0) / teamMembers.length)} completed projects per member
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Team Health</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {teamMembers.filter(m => m.status === 'active').length}/{teamMembers.length} active members
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-transparent">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter: {selectedFilter === "all" ? "All" : selectedFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedFilter("all")}>All Members</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter("active")}>Active</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter("on-leave")}>On Leave</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter("inactive")}>Inactive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AddTeamMemberDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </AddTeamMemberDialog>
            </div>
          </CardContent>
        </Card>

        {/* Team View Tabs */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="space-y-6">
            {/* Team Members Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMembers.map((member) => (
            <Card key={member.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewedMember(member)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingMember(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Member
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          View Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => setMembers(members.filter((m) => m.id !== member.id))}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {member.phone}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {member.location}
                  </div>
                </div>

                {/* Performance & Workload */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance</span>
                    <span className="text-sm font-semibold text-green-600">{member.performance}%</span>
                  </div>
                  <Progress value={member.performance} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Workload</span>
                    <span className={`text-sm font-semibold ${getWorkloadColor(member.currentWorkload)}`}>
                      {member.currentWorkload}%
                    </span>
                  </div>
                  <Progress value={member.currentWorkload} className="h-2" />
                </div>

                {/* Projects */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">{member.activeProjects}</p>
                    <p className="text-muted-foreground text-xs">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{member.completedProjects}</p>
                    <p className="text-muted-foreground text-xs">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-600">{member.skills.length}</p>
                    <p className="text-muted-foreground text-xs">Skills</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-muted-foreground">{member.joinDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="text-muted-foreground">{member.lastActive}</span>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first team member"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            {/* Team Members Table */}
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-medium">Member</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Performance</th>
                        <th className="text-left p-4 font-medium">Workload</th>
                        <th className="text-left p-4 font-medium">Projects</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                                <AvatarFallback>
                                  {member.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{member.role}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Progress value={member.performance} className="h-2 w-16" />
                              <span className="text-sm font-medium">{member.performance}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Progress value={member.currentWorkload} className="h-2 w-16" />
                              <span className={`text-sm font-medium ${getWorkloadColor(member.currentWorkload)}`}>
                                {member.currentWorkload}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 font-medium">{member.activeProjects}</span>
                                <span className="text-muted-foreground">active</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600 font-medium">{member.completedProjects}</span>
                                <span className="text-muted-foreground">completed</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewedMember(member)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Member
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  View Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => setMembers(members.filter((m) => m.id !== member.id))}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Empty State for Table */}
            {filteredMembers.length === 0 && (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first team member"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>        {/* View Member Dialog */}
        <Dialog open={!!viewedMember} onOpenChange={(open) => !open && setViewedMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Team Member Profile</DialogTitle>
            </DialogHeader>
            {viewedMember && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewedMember.avatar || "/placeholder.svg"} alt={viewedMember.name} />
                    <AvatarFallback>
                      {viewedMember.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{viewedMember.name}</h3>
                    <p className="text-muted-foreground">{viewedMember.role}</p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Email:</Label>
                    <span className="text-sm">{viewedMember.email}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Phone:</Label>
                    <span className="text-sm">{viewedMember.phone}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Location:</Label>
                    <span className="text-sm">{viewedMember.location}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Status:</Label>
                    <Badge className={getStatusColor(viewedMember.status)}>{viewedMember.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Performance:</Label>
                    <div className="flex items-center space-x-2">
                      <Progress value={viewedMember.performance} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{viewedMember.performance}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Workload:</Label>
                    <div className="flex items-center space-x-2">
                      <Progress value={viewedMember.currentWorkload} className="h-2 flex-1" />
                      <span className={`text-sm font-medium ${getWorkloadColor(viewedMember.currentWorkload)}`}>
                        {viewedMember.currentWorkload}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <Label className="font-medium">Projects:</Label>
                    <span className="text-sm">{viewedMember.activeProjects} active, {viewedMember.completedProjects} completed</span>
                  </div>
                  <div className="grid grid-cols-1">
                    <Label className="font-medium mb-2">Skills:</Label>
                    <div className="flex flex-wrap gap-1">
                      {viewedMember.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewedMember(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Input
                    id="role"
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input
                    id="phone"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input
                    id="location"
                    value={editingMember.location}
                    onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingMember) {
                    setMembers(members.map((m) => m.id === editingMember.id ? editingMember : m))
                    setEditingMember(null)
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}