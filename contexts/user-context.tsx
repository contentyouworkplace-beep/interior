"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ProfileService, ProfileData } from '@/lib/services/profile-service'

interface UserContextType {
  profile: ProfileData | null
  loading: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<ProfileData>) => Promise<{ success: boolean; error?: string }>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const profileService = new ProfileService()

  const loadProfile = async () => {
    try {
      setLoading(true)
      const result = await profileService.getProfile()
      
      if (result.data) {
        setProfile(result.data)
      } else if (result.error) {
        console.error('Error loading profile:', result.error)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    await loadProfile()
  }

  const updateProfile = async (updates: Partial<ProfileData>): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await profileService.updateProfile(updates)
      
      if (result.data) {
        setProfile(result.data)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile, updateProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}