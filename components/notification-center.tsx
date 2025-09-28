"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Check, X, AlertCircle, IndianRupee, Users, Calendar } from "lucide-react"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "client",
      title: "New client inquiry",
      message: "Sarah Johnson submitted a project request for apartment renovation",
      time: "5 minutes ago",
      unread: true,
      priority: "high",
      icon: Users,
    },
    {
      id: 2,
      type: "payment",
      title: "Payment received",
  message: "₹ 25,00,000 payment received from Rajesh Kumar for Villa project",
      time: "1 hour ago",
      unread: true,
      priority: "medium",
  icon: IndianRupee,
    },
    {
      id: 3,
      type: "project",
      title: "Project milestone completed",
      message: "Villa renovation design phase has been completed and approved",
      time: "2 hours ago",
      unread: false,
      priority: "low",
      icon: Check,
    },
    {
      id: 4,
      type: "reminder",
      title: "Meeting reminder",
  message: "Client meeting with Mahadev Industries scheduled for tomorrow at 2:00 PM",
      time: "3 hours ago",
      unread: true,
      priority: "high",
      icon: Calendar,
    },
    {
      id: 5,
      type: "alert",
      title: "Invoice overdue",
  message: "Invoice #INV-2024-001 is 5 days overdue - ₹ 15,00,000",
      time: "1 day ago",
      unread: false,
      priority: "high",
      icon: AlertCircle,
    },
  ])

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "client":
        return "text-blue-600"
      case "payment":
        return "text-green-600"
      case "project":
        return "text-primary"
      case "reminder":
        return "text-orange-600"
      case "alert":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
        <CardDescription>Stay updated with your business activities</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 border border-border rounded-lg ${getPriorityColor(notification.priority)} ${
                  notification.unread ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-full bg-muted ${getTypeColor(notification.type)}`}>
                      <notification.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                        {notification.unread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {notification.unread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3 mt-4">
            {notifications
              .filter((n) => n.unread)
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 border border-border rounded-lg ${getPriorityColor(notification.priority)} bg-muted/30`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full bg-muted ${getTypeColor(notification.type)}`}>
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="important" className="space-y-3 mt-4">
            {notifications
              .filter((n) => n.priority === "high")
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 border border-border rounded-lg ${getPriorityColor(notification.priority)} ${
                    notification.unread ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full bg-muted ${getTypeColor(notification.type)}`}>
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                          {notification.unread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {notification.unread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="today" className="space-y-3 mt-4">
            {notifications
              .filter((n) => n.time.includes("hour") || n.time.includes("minute"))
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 border border-border rounded-lg ${getPriorityColor(notification.priority)} ${
                    notification.unread ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full bg-muted ${getTypeColor(notification.type)}`}>
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                          {notification.unread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {notification.unread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
