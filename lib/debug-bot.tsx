// Debug Bot - Comprehensive Error Detection and Reporting System
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types for different error categories
export interface ErrorInfo {
  id: string
  timestamp: Date
  category: 'form' | 'api' | 'dialog' | 'validation' | 'render' | 'storage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  location?: string
  userAction?: string
  resolved?: boolean
}

export interface DebugStats {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  recentErrors: ErrorInfo[]
  apiCallsToday: number
  apiSuccessRate: number
  lastUpdated: Date
}

// Debug Context
interface DebugContextType {
  errors: ErrorInfo[]
  stats: DebugStats
  isDebugMode: boolean
  addError: (error: Omit<ErrorInfo, 'id' | 'timestamp'>) => void
  resolveError: (id: string) => void
  clearErrors: () => void
  toggleDebugMode: () => void
  trackApiCall: (endpoint: string, success: boolean, responseTime?: number) => void
  trackFormSubmission: (formName: string, success: boolean, data?: any) => void
  trackDialogAction: (dialogName: string, action: string, success: boolean) => void
}

const DebugContext = createContext<DebugContextType | null>(null)

// Custom hook to use debug context
export const useDebugBot = () => {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebugBot must be used within a DebugBotProvider')
  }
  return context
}

// Debug Bot Provider Component
export function DebugBotProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [apiCalls, setApiCalls] = useState<{[key: string]: {success: number, failed: number, responseTime: number[]}}>({})

  // Load debug state from localStorage
  useEffect(() => {
    const savedDebugMode = localStorage.getItem('debug-mode')
    const savedErrors = localStorage.getItem('debug-errors')
    
    if (savedDebugMode) {
      setIsDebugMode(JSON.parse(savedDebugMode))
    }
    
    if (savedErrors) {
      try {
        const parsedErrors = JSON.parse(savedErrors).map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }))
        setErrors(parsedErrors)
      } catch (e) {
        console.warn('Failed to load saved debug errors:', e)
      }
    }
  }, [])

  // Save errors to localStorage
  useEffect(() => {
    localStorage.setItem('debug-errors', JSON.stringify(errors))
  }, [errors])

  // Save debug mode to localStorage
  useEffect(() => {
    localStorage.setItem('debug-mode', JSON.stringify(isDebugMode))
  }, [isDebugMode])

  const addError = (errorData: Omit<ErrorInfo, 'id' | 'timestamp'>) => {
    const newError: ErrorInfo = {
      ...errorData,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    }

    setErrors(prev => [newError, ...prev.slice(0, 99)]) // Keep last 100 errors

    // Auto-console log in debug mode
    if (isDebugMode) {
      console.group(`🤖 Debug Bot - ${newError.severity.toUpperCase()} ${newError.category}`)
      console.log('Message:', newError.message)
      console.log('Location:', newError.location)
      console.log('User Action:', newError.userAction)
      console.log('Details:', newError.details)
      console.log('Timestamp:', newError.timestamp.toLocaleString())
      console.groupEnd()
    }
  }

  const resolveError = (id: string) => {
    setErrors(prev => prev.map(error => 
      error.id === id ? { ...error, resolved: true } : error
    ))
  }

  const clearErrors = () => {
    setErrors([])
  }

  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev)
  }

  const trackApiCall = (endpoint: string, success: boolean, responseTime?: number) => {
    setApiCalls(prev => {
      const current = prev[endpoint] || { success: 0, failed: 0, responseTime: [] }
      return {
        ...prev,
        [endpoint]: {
          success: success ? current.success + 1 : current.success,
          failed: success ? current.failed : current.failed + 1,
          responseTime: responseTime ? [...current.responseTime.slice(-9), responseTime] : current.responseTime
        }
      }
    })

    if (!success) {
      addError({
        category: 'api',
        severity: 'high',
        message: `API call failed: ${endpoint}`,
        location: endpoint,
        userAction: 'API Request',
        details: { responseTime, endpoint }
      })
    }
  }

  const trackFormSubmission = (formName: string, success: boolean, data?: any) => {
    if (!success) {
      addError({
        category: 'form',
        severity: 'medium',
        message: `Form submission failed: ${formName}`,
        location: formName,
        userAction: 'Form Submission',
        details: data
      })
    }
  }

  const trackDialogAction = (dialogName: string, action: string, success: boolean) => {
    if (!success) {
      addError({
        category: 'dialog',
        severity: 'medium',
        message: `Dialog action failed: ${action} in ${dialogName}`,
        location: dialogName,
        userAction: action,
        details: { dialogName, action }
      })
    }
  }

  // Calculate stats
  const stats: DebugStats = {
    totalErrors: errors.length,
    errorsByCategory: errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    errorsBySeverity: errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    recentErrors: errors.slice(0, 10),
    apiCallsToday: Object.values(apiCalls).reduce((total, calls) => total + calls.success + calls.failed, 0),
    apiSuccessRate: Object.values(apiCalls).reduce((total, calls) => {
      const totalCalls = calls.success + calls.failed
      return totalCalls > 0 ? total + (calls.success / totalCalls) : total
    }, 0) / Math.max(Object.keys(apiCalls).length, 1) * 100,
    lastUpdated: new Date()
  }

  return (
    <DebugContext.Provider value={{
      errors,
      stats,
      isDebugMode,
      addError,
      resolveError,
      clearErrors,
      toggleDebugMode,
      trackApiCall,
      trackFormSubmission,
      trackDialogAction
    }}>
      {children}
    </DebugContext.Provider>
  )
}

// Hook for automatic error boundary integration
export const useErrorBoundary = () => {
  const { addError } = useDebugBot()

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addError({
        category: 'render',
        severity: 'high',
        message: event.message,
        location: `${event.filename}:${event.lineno}:${event.colno}`,
        userAction: 'Page Interaction',
        details: {
          error: event.error,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError({
        category: 'api',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        location: 'Promise',
        userAction: 'Async Operation',
        details: { reason: event.reason }
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [addError])
}