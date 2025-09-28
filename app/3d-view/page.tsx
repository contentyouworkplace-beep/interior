"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Box, Clock, Sparkles } from "lucide-react"

export default function ThreeDViewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">3D View</h1>
        <p className="text-muted-foreground">
          Advanced 3D visualization for interior design projects
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Box className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">3D Viewer</CardTitle>
            <CardDescription className="text-base">
              Immersive 3D visualization coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="secondary" className="inline-flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Coming Soon
            </Badge>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Interactive 3D model viewing</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Virtual room walkthroughs</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Augmented reality preview</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Real-time design collaboration</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                We're working hard to bring you an amazing 3D experience.
                <br />
                Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}