"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, X, Loader2, AlertCircle } from "lucide-react"

interface SaveProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  steps: Array<{
    id: string
    label: string
    status: 'pending' | 'loading' | 'completed' | 'error'
    error?: string
  }>
  overallStatus: 'saving' | 'success' | 'error'
}

export function SaveProgressDialog({ 
  isOpen, 
  onClose, 
  title = "Saving Settings",
  steps,
  overallStatus 
}: SaveProgressDialogProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getOverallIcon = () => {
    switch (overallStatus) {
      case 'saving':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return null
    }
  }

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'saving':
        return "Saving your settings..."
      case 'success':
        return "Settings saved successfully!"
      case 'error':
        return "Some errors occurred while saving"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOverallIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {getOverallMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{completedSteps}/{totalSteps}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.error && (
                    <div className="text-xs text-red-500 mt-1">{step.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {overallStatus !== 'saving' && (
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex items-center gap-2"
              >
                {overallStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Done
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Close
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}