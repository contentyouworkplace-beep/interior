"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload, Loader2, Save } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { ProfileService } from "@/lib/services/profile-service"

export function ProfileSection() {
  const { profile, loading, updateProfile: updateUserProfile } = useUser()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    role: 'designer'
  })

  const profileService = new ProfileService()

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        role: profile.role || 'designer'
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const result = await updateUserProfile(formData)
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Profile updated successfully.",
        })
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 2MB",
        variant: "destructive",
      })
      return
    }

    setAvatarUploading(true)
    try {
      const result = await profileService.uploadAvatar(file)
      
      if (result.url) {
        toast({
          title: "Success!",
          description: "Avatar updated successfully.",
        })
        // Refresh the profile to get the new avatar URL
        window.location.reload()
      } else {
        throw new Error(result.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information and profile settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>
              {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || 'N'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={avatarUploading} asChild>
                <span>
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Change Photo
                </span>
              </Button>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter your last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+91 XX XXX XXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="designer">Interior Designer</SelectItem>
                <SelectItem value="architect">Architect</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="business_owner">Business Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}