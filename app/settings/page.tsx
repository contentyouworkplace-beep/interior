"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Building2, Bell, Shield, CreditCard, Palette, Save, Upload, Eye, EyeOff, IndianRupee, CheckCircle, AlertCircle, ImageIcon, Loader2, FileText, Smartphone, Monitor, Settings, Activity } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
// Legacy BusinessSettingsService removed from this page
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/hooks/useOrganization"
import CompanyPageNew from "./CompanyPageNew"
import { SecurityService } from "@/lib/services/security-service"
// SaveProgressDialog and TemplatePreviewModal were only used by legacy business settings; removed

const templateOptions = [
  { 
    value: "modern", 
    label: "Modern Executive", 
    description: "Sleek gradient design with contemporary corporate branding" 
  },
  { 
    value: "classic", 
    label: "Classic Professional", 
    description: "Timeless business elegance with traditional formatting" 
  },
  { 
    value: "minimalist", 
    label: "Minimalist Elite", 
    description: "Clean lines and sophisticated simplicity for premium brands" 
  },
  { 
    value: "corporate", 
    label: "Corporate Power", 
    description: "Bold executive styling with professional dark theme" 
  },
  { 
    value: "creative", 
    label: "Creative Vision", 
    description: "Dynamic gradients and artistic flair for design professionals" 
  },
  { 
    value: "premium", 
    label: "Luxury Premium", 
    description: "High-end gold accents with luxury brand positioning" 
  }
]

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
]

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Legacy business settings state removed; this page uses CompanyPageNew for company settings
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [securityLoading, setSecurityLoading] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })
  const { toast } = useToast()
  const supabase = createClient()
  const { gstRate, setGstRate, loading: settingsLoading } = useSettings()
  // const businessService = new BusinessSettingsService(supabase) // removed
  const securityService = new SecurityService(supabase)
  const { profile: userProfile, loading: profileLoading, updateProfile, refreshProfile } = useUser()
  const { user } = useAuth()
  const { orgId, loading: orgLoading, error: orgError } = useOrganization()

  // Local form state for Profile tab (avoid updating API on each keystroke)
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'designer'
  })

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        phone: userProfile.phone || '',
        role: (userProfile.role as string) || 'designer'
      })
    }
  }, [userProfile])

  // Load required settings on mount (skip legacy business settings fetch)
  useEffect(() => {
    loadSecuritySettings()
  }, [])

  const loadSecuritySettings = async () => {
    setSecurityLoading(true)
    try {
      // Load active sessions
      const sessionsResult = await securityService.getActiveSessions()
      if (sessionsResult.success && sessionsResult.sessions) {
        setActiveSessions(sessionsResult.sessions)
      }
    } catch (error) {
      console.error('Error loading security settings:', error)
    } finally {
      setSecurityLoading(false)
    }
  }

  // loadBusinessSettings removed

  // handleBusinessSave removed

  // handleBusinessInputChange removed

  // legacy template preview/save-progress handlers removed

  // legacy asset upload handlers removed

  // legacy GST/PAN validators removed (handled in CompanyPageNew)

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    setFormErrors({})
    
    // Validate form
    const errors: Record<string, string> = {}
    if (!profileForm.first_name?.trim()) errors.first_name = 'First name is required'
    if (!profileForm.last_name?.trim()) errors.last_name = 'Last name is required'
    if (profileForm.phone && !/^[+]?[\d\s-()]{10,}$/.test(profileForm.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsLoading(false)
      return
    }
    
    try {
      // Persist changes through the profile service once on Save
      const result = await updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
        role: profileForm.role
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      await refreshProfile()
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordLoading(true)
    setFormErrors({})
    
    // Basic validation
    const errors: Record<string, string> = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setPasswordLoading(false)
      return
    }
    
    try {
      // Use the security service for password change
      const result = await securityService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      )
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Your password has been updated successfully. You can now use your new password to log in.",
        })
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Reload security settings
        loadSecuritySettings()
      } else {
        throw new Error(result.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const result = await securityService.revokeSession(sessionId)
      if (result.success) {
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId))
        toast({
          title: "Session Revoked",
          description: "The selected session has been terminated.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error revoking session:', error)
      toast({
        title: "Error",
        description: "Failed to revoke session.",
        variant: "destructive"
      })
    }
  }

  const handleRevokeAllSessions = async () => {
    setSecurityLoading(true)
    try {
      const result = await securityService.revokeAllOtherSessions()
      if (result.success) {
        // Reload active sessions
        const sessionsResult = await securityService.getActiveSessions()
        if (sessionsResult.success && sessionsResult.sessions) {
          setActiveSessions(sessionsResult.sessions)
        }
        toast({
          title: "Sessions Revoked",
          description: "All other sessions have been revoked successfully.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error revoking sessions:', error)
      toast({
        title: "Error",
        description: "Failed to revoke sessions.",
        variant: "destructive"
      })
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, or GIF).",
        variant: "destructive"
      })
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive"
      })
      return
    }

    setAvatarUploading(true)
    setAvatarFile(file)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Create file name with user ID and timestamp
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('Uploading avatar:', { filePath, fileSize: file.size, fileType: file.type })

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful, getting public URL...')

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      console.log('Profile updated successfully')

      // Update the user context
      updateProfile({ avatar_url: publicUrl })

      console.log('User context updated')

      toast({
        title: "Success!",
        description: "Profile photo updated successfully.",
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      })
    } finally {
      setAvatarUploading(false)
      setAvatarFile(null)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account settings and preferences"
      currentPath="/settings"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and profile settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="space-y-6">
                  {/* Avatar skeleton */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Form field skeletons */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  {userProfile?.avatar_url ? (
                    <AvatarImage 
                      src={userProfile.avatar_url} 
                      alt={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarImage src="/placeholder-user.jpg" alt="Default avatar" />
                  )}
                  <AvatarFallback className="text-lg bg-blue-100 text-blue-800">
                    {userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                    {userProfile?.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  {userProfile?.avatar_url && (
                    <p className="text-xs text-green-600">✓ Custom photo uploaded</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={profileForm.first_name}
                    onChange={(e) => {
                      setProfileForm(prev => ({ ...prev, first_name: e.target.value }))
                      if (formErrors.first_name) {
                        setFormErrors(prev => ({ ...prev, first_name: '' }))
                      }
                    }}
                    className={formErrors.first_name ? 'border-red-500' : ''}
                  />
                  {formErrors.first_name && (
                    <p className="text-sm text-red-500">{formErrors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={profileForm.last_name}
                    onChange={(e) => {
                      setProfileForm(prev => ({ ...prev, last_name: e.target.value }))
                      if (formErrors.last_name) {
                        setFormErrors(prev => ({ ...prev, last_name: '' }))
                      }
                    }}
                    className={formErrors.last_name ? 'border-red-500' : ''}
                  />
                  {formErrors.last_name && (
                    <p className="text-sm text-red-500">{formErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || userProfile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profileForm.phone}
                    onChange={(e) => {
                      setProfileForm(prev => ({ ...prev, phone: e.target.value }))
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }))
                      }
                    }}
                    placeholder="+971 XX XXX XXXX"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500">{formErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={profileForm.role} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="designer">Interior Designer</SelectItem>
                      <SelectItem value="architect">Architect</SelectItem>
                      <SelectItem value="manager">Project Manager</SelectItem>
                      <SelectItem value="owner">Business Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
              </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          {orgLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading organization...</span>
                </div>
              </CardContent>
            </Card>
          ) : orgError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                  <div>
                    <h3 className="text-lg font-medium">Organization Setup Required</h3>
                    <p className="text-sm text-muted-foreground mt-2">{orgError}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please run this SQL in your Supabase dashboard:
                    </p>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-2 text-left">
{`INSERT INTO organization_members (organization_id, user_id) 
VALUES ('00000000-0000-0000-0000-000000000001', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6');`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : orgId ? (
            <CompanyPageNew />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No organization found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        <TabsContent value="security" className="space-y-6">
          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password Security
              </CardTitle>
              <CardDescription>Change your password and manage security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                          if (formErrors.currentPassword) {
                            setFormErrors(prev => ({ ...prev, currentPassword: '' }))
                          }
                        }}
                        className={formErrors.currentPassword ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formErrors.currentPassword && (
                      <p className="text-sm text-red-500">{formErrors.currentPassword}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                        if (formErrors.newPassword) {
                          setFormErrors(prev => ({ ...prev, newPassword: '' }))
                        }
                      }}
                      className={formErrors.newPassword ? 'border-red-500' : ''}
                    />
                    {formErrors.newPassword && (
                      <p className="text-sm text-red-500">{formErrors.newPassword}</p>
                    )}
                    {passwordForm.newPassword && (
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">Password requirements:</p>
                        <ul className="space-y-1 ml-2">
                          <li className={passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'}>
                            • At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-500'}>
                            • One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-500'}>
                            • One lowercase letter
                          </li>
                          <li className={/\d/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-500'}>
                            • One number
                          </li>
                          <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-500'}>
                            • One special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                        if (formErrors.confirmPassword) {
                          setFormErrors(prev => ({ ...prev, confirmPassword: '' }))
                        }
                      }}
                      className={formErrors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Monitor className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">{session.device_info || 'Unknown Device'}</h5>
                          <p className="text-sm text-muted-foreground">
                            {session.ip_address} • Last active: {new Date(session.last_activity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.is_current && (
                          <Badge variant="default">Current</Badge>
                        )}
                        {!session.is_current && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={securityLoading}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => handleRevokeAllSessions()}
                disabled={securityLoading || activeSessions.length <= 1}
                className="w-full"
              >
                {securityLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Revoke All Other Sessions'
                )}
              </Button>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>Your current subscription plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">Professional Plan</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Active subscription with full access to all features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-900">₹ 2,499</p>
                    <p className="text-sm text-blue-700">per month</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Plan Status</h4>
                    <p className="text-sm text-gray-600 mt-1">Active</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Next Billing Date</h4>
                    <p className="text-sm text-gray-600 mt-1">January 15, 2026</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Validity</h4>
                    <p className="text-sm text-gray-600 mt-1">Until Jan 15, 2026</p>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Unlimited Projects",
                    "Advanced Templates", 
                    "PDF Generation",
                    "Client Management",
                    "Team Collaboration",
                    "Priority Support",
                    "Custom Branding",
                    "Analytics & Reports"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600">
                  Have a Suggestion? Share it with us: <a href="mailto:support@goplnr.com" className="text-blue-600 hover:underline">support@goplnr.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Tax (GST) Settings
              </CardTitle>
              <CardDescription>Configure Goods and Services Tax percentage applied to quotations and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="gstRate">Default GST Rate (%)</Label>
                <Input
                  id="gstRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  defaultValue={gstRate}
                  onBlur={async (e) => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val)) await setGstRate(val)
                  }}
                />
                <p className="text-xs text-muted-foreground">Used as default GST for new invoices and quotations. Adjust if government revises rates.</p>
              </div>
              <Button onClick={async () => { await setGstRate(gstRate) }} disabled={settingsLoading}>
                <Save className="h-4 w-4 mr-2" />
                {settingsLoading ? 'Saving...' : 'Save Tax Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legacy SaveProgressDialog and TemplatePreviewModal removed */}
    </DashboardLayout>
  )
}
