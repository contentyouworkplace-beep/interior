"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { getAppSettings, updateGstRate, AppSettings } from '@/lib/services/settings'

interface SettingsContextValue extends AppSettings {
  setGstRate: (rate: number) => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ gstRate: 18, updatedAt: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getAppSettings().then(s => { if (mounted) { setSettings(s); setLoading(false) } })
    return () => { mounted = false }
  }, [])

  const setGstRate = useCallback(async (rate: number) => {
    setSettings(prev => ({ ...prev, gstRate: rate }))
    const saved = await updateGstRate(rate)
    setSettings(saved)
  }, [])

  return (
    <SettingsContext.Provider value={{ ...settings, setGstRate, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
