import { createClient } from '@/lib/supabase/client'

export interface ProfileData {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  phone: string
  role: string
  designation?: string
  department?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export class ProfileService {
  private supabase = createClient()

  async getProfile(): Promise<{ data: ProfileData | null; error?: string }> {
    try {
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        return { data: null, error: result.error }
      }
      
      return { data: result.profile }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { data: null, error: 'Failed to fetch profile' }
    }
  }

  async updateProfile(updates: Partial<ProfileData>): Promise<{ data: ProfileData | null; error?: string }> {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        return { data: null, error: result.error }
      }
      
      return { data: result.profile }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error: 'Failed to update profile' }
    }
  }

  async uploadAvatar(file: File): Promise<{ url?: string; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { error: 'Not authenticated' }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Failed to upload avatar' }
      }

      const { data } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await this.updateProfile({ avatar_url: data.publicUrl })

      return { url: data.publicUrl }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return { error: 'Failed to upload avatar' }
    }
  }
}