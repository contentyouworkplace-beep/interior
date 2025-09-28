// Enhanced hooks for form validation and API monitoring
"use client"

import { useState, useEffect, useCallback } from 'react'

// Hook for enhanced form handling with automatic error tracking
export const useDebugForm = (formName: string) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)

  const validateField = useCallback((name: string, value: any, rules?: any) => {
    let error = ''

    if (rules?.required && (!value || value.toString().trim() === '')) {
      error = `${name} is required`
    } else if (rules?.minLength && value.length < rules.minLength) {
      error = `${name} must be at least ${rules.minLength} characters`
    } else if (rules?.pattern && !rules.pattern.test(value)) {
      error = `${name} format is invalid`
    }

    setErrors(prev => ({ ...prev, [name]: error }))

    return error === ''
  }, [formName])

  const submitForm = useCallback(async (
    data: any,
    submitFn: (data: any) => Promise<any>,
    options?: { skipValidation?: boolean }
  ) => {
    setIsSubmitting(true)
    setSubmitCount(prev => prev + 1)

    try {
      // Track submission attempt

      const result = await submitFn(data)
      
      return result
    } catch (error) {
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [formName, submitCount])

  const hasErrors = Object.values(errors).some(error => error !== '')

  return {
    errors,
    isSubmitting,
    submitCount,
    hasErrors,
    validateField,
    submitForm,
    setErrors,
    clearErrors: () => setErrors({})
  }
}

// Hook for API calls with automatic monitoring
export const useDebugApi = () => {

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {},
    config?: { timeout?: number; retries?: number }
  ): Promise<T> => {
    const startTime = Date.now()
    const { timeout = 10000, retries = 0 } = config || {}

    let lastError: any

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(endpoint, {
          ...options,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        return data
      } catch (error) {
        lastError = error
        const responseTime = Date.now() - startTime

        if (attempt === retries) {
          // Final attempt failed
        } else {
          // Retry attempt

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError
  }, [])

  return { apiCall }
}

// Hook for dialog state monitoring
export const useDebugDialog = (dialogName: string) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogHistory, setDialogHistory] = useState<string[]>([])

  const openDialog = useCallback(() => {
    try {
      setIsOpen(true)
      setDialogHistory(prev => [...prev, 'opened'])
      
    } catch (error) {
      console.error(`Failed to open dialog: ${dialogName} - ${error}`)
    }
  }, [dialogName])

  const closeDialog = useCallback(() => {
    try {
      setIsOpen(false)
      setDialogHistory(prev => [...prev, 'closed'])
      
    } catch (error) {
      console.error(`Failed to close dialog: ${dialogName} - ${error}`)
    }
  }, [dialogName])

  const dialogAction = useCallback((actionName: string, actionFn: () => void | Promise<void>) => {
    return async () => {
      try {
        setDialogHistory(prev => [...prev, actionName])
        await actionFn()
        
      } catch (error) {
        console.error(`Dialog action failed: ${actionName} in ${dialogName} - ${error}`)
        throw error
      }
    }
  }, [dialogName])

  return {
    isOpen,
    dialogHistory,
    openDialog,
    closeDialog,
    dialogAction,
    setIsOpen
  }
}

// Hook for storage operations monitoring
export const useDebugStorage = () => {

  const setStorageItem = useCallback((key: string, value: any, storageType: 'local' | 'session' = 'local') => {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage
      storage.setItem(key, JSON.stringify(value))
      
    } catch (error) {
      console.error(`Storage set failed: ${key} - ${error}`)
      throw error
    }
  }, [])

  const getStorageItem = useCallback((key: string, storageType: 'local' | 'session' = 'local') => {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage
      const item = storage.getItem(key)
      const value = item ? JSON.parse(item) : null
      
      return value
    } catch (error) {
      console.error(`Storage get failed: ${key} - ${error}`)
      return null
    }
  }, [])

  return {
    setStorageItem,
    getStorageItem
  }
}