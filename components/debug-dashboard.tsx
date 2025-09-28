"use client"

import { useState, useEffect } from 'react'
import { useDebugBot } from '@/lib/debug-bot'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Server, 
  FileText, 
  Settings,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2
} from 'lucide-react'

export function DebugDashboard() {
  const { 
    errors, 
    stats, 
    isDebugMode, 
    toggleDebugMode, 
    clearErrors, 
    resolveError 
  } = useDebugBot()
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Auto-show when errors occur
  useEffect(() => {
    if (errors.length > 0 && !isVisible) {
      setIsVisible(true)
    }
  }, [errors.length, isVisible])

  // Don't render if not in debug mode and no errors
  if (!isDebugMode && errors.length === 0) return null

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Bug className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <Server className="h-4 w-4" />
      case 'form': return <FileText className="h-4 w-4" />
      case 'dialog': return <Settings className="h-4 w-4" />
      case 'validation': return <AlertTriangle className="h-4 w-4" />
      case 'render': return <Activity className="h-4 w-4" />
      case 'storage': return <Settings className="h-4 w-4" />
      default: return <Bug className="h-4 w-4" />
    }
  }

  const getErrorsByCategory = () => {
    const categories = ['api', 'form', 'dialog', 'validation', 'render', 'storage']
    return categories.map(category => ({
      category,
      errors: errors.filter(error => error.category === category),
      count: stats.errorsByCategory[category] || 0
    }))
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-500 text-white border-red-500 hover:bg-red-600"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({errors.length})
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-80' : 'w-96'} max-h-[600px]`}>
      <Card className="bg-white shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm">Debug Bot</CardTitle>
              <Badge variant={isDebugMode ? "default" : "secondary"}>
                {isDebugMode ? "Active" : "Passive"}
              </Badge>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isMinimized && (
            <CardDescription className="text-xs">
              {stats.totalErrors} total errors • {stats.apiSuccessRate.toFixed(1)}% API success rate
            </CardDescription>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-3">
            <div className="flex space-x-2 mb-3">
              <Button
                size="sm"
                variant={isDebugMode ? "default" : "outline"}
                onClick={toggleDebugMode}
                className="text-xs"
              >
                {isDebugMode ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {isDebugMode ? "Disable" : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearErrors}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>

            <Tabs defaultValue="errors" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-xs">
                <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>

              <TabsContent value="errors">
                <ScrollArea className="h-64 w-full">
                  {errors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      No errors detected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {errors.slice(0, 10).map((error) => (
                        <div key={error.id} className="border rounded p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              {getSeverityIcon(error.severity)}
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {error.category}
                              </Badge>
                            </div>
                            <div className="flex space-x-1">
                              {!error.resolved && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resolveError(error.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className={`${error.resolved ? 'opacity-50 line-through' : ''}`}>
                            <p className="font-medium mb-1">{error.message}</p>
                            <p className="text-gray-600">📍 {error.location}</p>
                            <p className="text-gray-600">👤 {error.userAction}</p>
                            <p className="text-gray-500">🕒 {error.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="font-medium">{stats.totalErrors}</p>
                      <p className="text-gray-600">Total Errors</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="font-medium">{stats.apiCallsToday}</p>
                      <p className="text-gray-600">API Calls</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="font-medium text-green-700">{stats.apiSuccessRate.toFixed(1)}%</p>
                    <p className="text-green-600">API Success Rate</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-2">Errors by Severity</p>
                    {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex justify-between items-center py-1">
                        <div className="flex items-center space-x-1">
                          {getSeverityIcon(severity)}
                          <span className="capitalize">{severity}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories">
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {getErrorsByCategory().map(({ category, errors: categoryErrors, count }) => (
                      <div key={category} className="border rounded p-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(category)}
                            <span className="font-medium text-sm capitalize">{category}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        {categoryErrors.slice(0, 3).map((error) => (
                          <div key={error.id} className="text-xs text-gray-600 mb-1">
                            • {error.message.slice(0, 50)}...
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  )
}