"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Upload, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  FileText,
  Palette,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BusinessSettingsService, type BusinessSettings } from "@/lib/services/business-settings-service"

const templateOptions = [
  { value: "modern", label: "Modern", description: "Clean and contemporary design" },
  { value: "classic", label: "Classic", description: "Traditional business style" },
  { value: "minimalist", label: "Minimalist", description: "Simple and elegant" },
  { value: "corporate", label: "Corporate", description: "Professional corporate look" },
  { value: "creative", label: "Creative", description: "Bold and artistic design" },
  { value: "premium", label: "Premium", description: "Luxury and sophisticated" }
]

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
]

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({} as BusinessSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const { toast } = useToast()
  const businessService = new BusinessSettingsService()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const result = await businessService.getBusinessSettings()
      if (result.success && result.data) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load business settings",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upload files if selected
      if (logoFile) {
        const uploadResult = await businessService.uploadFile(logoFile, 'logos')
        if (uploadResult.success && uploadResult.url) {
          setSettings(prev => ({ ...prev, logo_url: uploadResult.url }))
        }
      }
      
      if (signatureFile) {
        const uploadResult = await businessService.uploadFile(signatureFile, 'signatures')
        if (uploadResult.success && uploadResult.url) {
          setSettings(prev => ({ ...prev, signature_url: uploadResult.url }))
        }
      }

      const result = await businessService.saveBusinessSettings(settings)
      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Business settings have been updated successfully.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    }
    setSaving(false)
  }

  const handleInputChange = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setSettings(prev => ({ ...prev, logo_url: url }))
    }
  }

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSignatureFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setSettings(prev => ({ ...prev, signature_url: url }))
    }
  }

  const validateGSTIN = (gstin: string) => {
    return businessService.validateGSTIN(gstin)
  }

  const validatePAN = (pan: string) => {
    return businessService.validatePAN(pan)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
            <p className="text-muted-foreground">Configure your company details for quotations</p>
          </div>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-muted-foreground">
            Configure your company details for professional quotations
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic company details that will appear on your quotations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="Company tagline or slogan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {settings.logo_url && (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden">
                    <img src={settings.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: PNG or JPG, max 2MB, square format preferred
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Contact Details
            </CardTitle>
            <CardDescription>
              Contact information for client communication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Complete business address"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={settings.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={settings.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="400001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Legal & Tax Information
            </CardTitle>
            <CardDescription>
              GST and legal compliance details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN *</Label>
                <div className="relative">
                  <Input
                    id="gstin"
                    value={settings.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    className="pr-10"
                  />
                  {settings.gstin && (
                    <div className="absolute right-3 top-3">
                      {validateGSTIN(settings.gstin) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {settings.gstin && !validateGSTIN(settings.gstin) && (
                  <p className="text-xs text-red-500">Invalid GSTIN format</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN Number *</Label>
                <div className="relative">
                  <Input
                    id="pan"
                    value={settings.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                    placeholder="AAAAA9999A"
                    className="pr-10"
                  />
                  {settings.pan && (
                    <div className="absolute right-3 top-3">
                      {validatePAN(settings.pan) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {settings.pan && !validatePAN(settings.pan) && (
                  <p className="text-xs text-red-500">Invalid PAN format</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cin">CIN Number (Optional)</Label>
              <Input
                id="cin"
                value={settings.cin}
                onChange={(e) => handleInputChange('cin', e.target.value)}
                placeholder="Company Identification Number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Banking Information</CardTitle>
            <CardDescription>
              Bank details for payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={settings.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  placeholder="Bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Account Number</Label>
                <Input
                  id="bank_account"
                  value={settings.bank_account}
                  onChange={(e) => handleInputChange('bank_account', e.target.value)}
                  placeholder="Account number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input
                id="ifsc_code"
                value={settings.ifsc_code}
                onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                placeholder="IFSC Code"
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Template Preferences
            </CardTitle>
            <CardDescription>
              Choose different templates for quotations and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quotation Template */}
            <div className="space-y-2">
              <Label>Quotation Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateOptions.map(template => (
                  <div
                    key={template.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      settings.quotation_template === template.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleInputChange('quotation_template', template.value)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.label}</h4>
                      {settings.quotation_template === template.value && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Template */}
            <div className="space-y-2">
              <Label>Invoice Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateOptions.map(template => (
                  <div
                    key={template.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      settings.invoice_template === template.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleInputChange('invoice_template', template.value)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.label}</h4>
                      {settings.invoice_template === template.value && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    placeholder="#1E40AF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="signature"
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {settings.signature_url && (
                  <div className="w-24 h-16 border rounded-lg overflow-hidden">
                    <img src={settings.signature_url} alt="Signature preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your signature image for quotations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>
              Default terms and conditions for quotations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_conditions"
                value={settings.terms}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                placeholder="Enter your terms and conditions"
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                These will appear on all quotations by default
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}