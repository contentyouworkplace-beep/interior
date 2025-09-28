"use client"

import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadBrandFile } from '@/lib/storage/branding'
import { useCompanySettings } from '@/hooks/useCompanySettings'
import { useOrganization } from '@/hooks/useOrganization'
import { TemplatePreviewModal } from '@/components/template-preview-modal'
import { BusinessSettings as LegacyBusinessSettings } from '@/lib/services/business-settings-service'

// UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, 
  Upload, 
  ImageIcon, 
  Save, 
  RefreshCcw, 
  FileText, 
  Receipt, 
  Eye, 
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Landmark,
  Palette,
  CheckCircle,
  AlertCircle,
  Camera,
  User,
  Hash,
  Shield,
  IndianRupee,
  Sparkles,
  Briefcase
} from 'lucide-react'

// Enhanced validation schema
const companyFormSchema = z.object({
  // Company Information
  // company_name is optional now — allow empty string
  company_name: z.string().max(100, "Company name too long").optional().or(z.literal('')),
  company_tagline: z.string().max(200, "Tagline too long").optional(),
  
  // Contact Details
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").optional().or(z.literal('')),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  
  // Address Information
  address: z.string().max(500, "Address too long").optional(),
  city: z.string().max(50, "City name too long").optional(),
  state: z.string().max(50, "State name too long").optional(),
  pin_code: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid PIN code").optional().or(z.literal('')),
  
  // Legal Information
  gstin: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(val), {
      message: 'Invalid GSTIN format'
    }),
  pan: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
      message: 'Invalid PAN format'
    }),
  cin: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val), {
      message: 'Invalid CIN format'
    }),
  
  // Terms & Conditions
  terms_and_conditions: z.string().max(5000, "Terms & conditions too long").optional(),
  
  // Banking Information
  bank_name: z.string().max(100, "Bank name too long").optional(),
  account_number: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number").optional().or(z.literal('')),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[0-9A-Z]{6}$/, "Invalid IFSC code").optional().or(z.literal('')),
  
  // Branding
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3B82F6"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#1E40AF"),
  quotation_template: z.enum(["modern", "classic", "minimalist", "corporate", "creative", "premium"]).default("modern"),
  invoice_template: z.enum(["modern", "classic", "minimalist", "corporate", "creative", "premium"]).default("modern"),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

// Enhanced template options with better descriptions
const templateOptions = {
  quotation: [
    { 
      value: "modern", 
      label: "Modern Executive", 
      description: "Sleek gradient design with contemporary corporate branding",
      color: "#3B82F6",
      icon: Sparkles
    },
    { 
      value: "classic", 
      label: "Classic Professional", 
      description: "Timeless business elegance with traditional formatting",
      color: "#1F2937",
      icon: Briefcase
    },
    { 
      value: "minimalist", 
      label: "Minimalist Elite", 
      description: "Clean lines and sophisticated simplicity",
      color: "#6B7280",
      icon: User
    },
    { 
      value: "corporate", 
      label: "Corporate Power", 
      description: "Bold executive styling with professional theme",
      color: "#1E40AF",
      icon: Building2
    },
    { 
      value: "creative", 
      label: "Creative Vision", 
      description: "Dynamic gradients and artistic flair",
      color: "#7C3AED",
      icon: Palette
    },
    { 
      value: "premium", 
      label: "Luxury Premium", 
      description: "High-end gold accents with luxury positioning",
      color: "#D97706",
      icon: IndianRupee
    }
  ],
  invoice: [
    { 
      value: "modern", 
      label: "Modern Professional", 
      description: "Clean contemporary invoice design",
      color: "#3B82F6",
      icon: FileText
    },
    { 
      value: "classic", 
      label: "Classic Business", 
      description: "Traditional invoice layout",
      color: "#1F2937",
      icon: Receipt
    },
    { 
      value: "minimalist", 
      label: "Minimalist Clean", 
      description: "Ultra-clean design focusing on clarity",
      color: "#6B7280",
      icon: User
    },
    { 
      value: "corporate", 
      label: "Corporate Standard", 
      description: "Formal business invoice structure",
      color: "#1E40AF",
      icon: Building2
    },
    { 
      value: "creative", 
      label: "Creative Accent", 
      description: "Stylish invoice with branding focus",
      color: "#7C3AED",
      icon: Palette
    },
    { 
      value: "premium", 
      label: "Premium Elite", 
      description: "Luxury invoice design",
      color: "#D97706",
      icon: IndianRupee
    }
  ]
}

export default function CompanyPageNew() {
  const { toast } = useToast()
  const { orgId, loading: orgLoading, error: orgError } = useOrganization()
  const { data: lastBundle, getCompanySettings, updateCompanySettings, loading, error } = useCompanySettings()
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string>('')
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [qrCodePreview, setQrCodePreview] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('company')
  const [showDebug, setShowDebug] = useState(false)
  const [debugOrgId, setDebugOrgId] = useState<string>('')
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState<'quotation' | 'invoice'>('quotation')
  const [previewTemplate, setPreviewTemplate] = useState<string>('modern')
  
  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      company_name: '',
      company_tagline: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      pin_code: '',
      gstin: '',
      pan: '',
      cin: '',
      terms_and_conditions: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'modern',
      invoice_template: 'modern',
    }
  })

  // Build company data object for the preview modal
  const buildCompanyDataForPreview = () => {
    const vals = form.getValues()
    return {
      profile: {
        company_name: vals.company_name || '',
        company_tagline: vals.company_tagline || '',
        address: vals.address || '',
        city: vals.city || '',
        state: vals.state || '',
        pincode: vals.pin_code || '',
        country: 'India',
        phone: vals.phone || '',
        email: vals.email || '',
        website: vals.website || '',
        gstin: vals.gstin || '',
        pan: vals.pan || '',
        cin: vals.cin || '',
        terms_and_conditions: vals.terms_and_conditions || ''
      },
      banking: {
        bank_name: vals.bank_name || '',
        account_number: vals.account_number || '',
        ifsc_code: vals.ifsc_code || ''
      },
      branding: {
        logo_url: logoPreview || undefined,
        signature_url: signaturePreview || undefined,
        qr_code_url: qrCodePreview || undefined,
        primary_color: vals.primary_color || '#3B82F6',
        secondary_color: vals.secondary_color || '#1E40AF',
        quotation_template: vals.quotation_template,
        invoice_template: vals.invoice_template
      }
    }
  }

  // Load existing data
  // Wait for organization resolution to finish before loading company data to avoid race conditions
  useEffect(() => {
    // orgLoading comes from useOrganization; if it's falsy we assume it's resolved
    if (typeof (orgId) !== 'undefined' && orgId && !orgLoading) {
      setDebugOrgId(orgId)
      loadCompanyData()
    }
  // include orgLoading so we react to changes in the loading state
  }, [orgId, orgLoading])

  const loadCompanyData = async () => {
    if (!orgId) return

    try {
      const result = await getCompanySettings(orgId)
      
      if (result.data) {
        
        // Support both shapes:
        // 1) { profile: {...}, banking: {...}, branding: {...} }
        // 2) flattened: { company_name, email, bank_name, primary_color, ... }
        const maybeProfile = result.data.profile || result.data
        const maybeBanking = result.data.banking || result.data
        const maybeBranding = result.data.branding || result.data



        // Reset and explicitly set registered field values so inputs update reliably
        const values = {
          company_name: maybeProfile?.company_name || maybeProfile?.company || '',
          company_tagline: maybeProfile?.company_tagline || maybeProfile?.tagline || '',
          email: maybeProfile?.email || '',
          phone: maybeProfile?.phone || '',
          website: maybeProfile?.website || '',
          address: maybeProfile?.address || '',
          city: maybeProfile?.city || '',
          state: maybeProfile?.state || '',
          pin_code: maybeProfile?.pin_code || maybeProfile?.pincode || '',
          gstin: maybeProfile?.gstin || '',
          pan: maybeProfile?.pan || '',
          cin: maybeProfile?.cin || '',
          terms_and_conditions: maybeProfile?.terms_and_conditions || '',
          bank_name: maybeBanking?.bank_name || '',
          account_number: maybeBanking?.account_number || '',
          ifsc_code: maybeBanking?.ifsc_code || '',
          primary_color: maybeBranding?.primary_color || '#3B82F6',
          secondary_color: maybeBranding?.secondary_color || '#1E40AF',
          quotation_template: (maybeBranding?.quotation_template as any) || 'modern',
          invoice_template: (maybeBranding?.invoice_template as any) || 'modern',
        }
        

        
        form.reset(values)
        // Also call setValue for each registered field to ensure controlled inputs receive the value
        Object.entries(values).forEach(([k, v]) => {
          try { 
            form.setValue(k as any, v as any, { shouldValidate: false, shouldDirty: false }) 
          } catch (e) { 
            console.error(`🔍 Failed to set field ${k}:`, e)
          }
        })
        // Immediately re-validate so Save button reflects current validity
        await form.trigger()
        

        
        // Set logo, signature, and QR code previews (support both shapes)
        const logoUrl = (result.data.branding && result.data.branding.logo_url) || result.data.logo_url || ''
        const signatureUrl = (result.data.branding && result.data.branding.signature_url) || result.data.signature_url || ''
        const qrCodeUrl = (result.data.branding && result.data.branding.qr_code_url) || ''
        if (logoUrl) setLogoPreview(logoUrl)
        if (signatureUrl) setSignaturePreview(signatureUrl)
        if (qrCodeUrl) setQrCodePreview(qrCodeUrl)
      }
      // If nothing came back, surface a helpful hint
      if (!result.data || (!result.data.profile && !result.data.banking && !result.data.branding)) {
        toast({
          title: "No company settings found",
          description: "We didn’t find any saved company settings for this organization. Double-check your .env points to the correct Supabase project and that your user is a member of the same organization.",
        })
      }
    } catch (error) {
      console.error('Failed to load company data:', error)
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive"
      })
    }
  }

  // Handle file uploads
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setLogoFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      })
      return
    }

    setSignatureFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setSignaturePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleQrCodeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      })
      return
    }

    setQrCodeFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setQrCodePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  const onSubmit = async (data: CompanyFormData) => {
    if (!orgId) {
      toast({
        title: "Error",
        description: "Organization not found",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setProgress(0)

    try {
  // Use submitted data (argument) as source of truth for the update payload
  const current = data

      let logoUrl = logoPreview
      let signatureUrl = signaturePreview
      let qrCodeUrl = qrCodePreview

      // Upload files if new ones are selected
      if (logoFile) {
        setProgress(20)
        try {
          const res = await uploadBrandFile('logo', orgId, logoFile, logoPreview)
          if (res.error) throw new Error(res.error)
          logoUrl = res.url || ''
        } catch (error) {
          console.error('Logo upload failed:', error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload logo",
            variant: "destructive"
          })
          return
        }
      }

      if (signatureFile) {
        setProgress(40)
        try {
          const res = await uploadBrandFile('signature', orgId, signatureFile, signaturePreview)
          if (res.error) throw new Error(res.error)
          signatureUrl = res.url || ''
        } catch (error) {
          console.error('Signature upload failed:', error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload signature",
            variant: "destructive"
          })
          return
        }
      }

      if (qrCodeFile) {
        setProgress(60)
        try {
          const res = await uploadBrandFile('qr_code', orgId, qrCodeFile, qrCodePreview)
          if (res.error) throw new Error(res.error)
          qrCodeUrl = res.url || ''
        } catch (error) {
          console.error('QR code upload failed:', error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload QR code",
            variant: "destructive"
          })
          return
        }
      }

      setProgress(75)

      // Prepare data for API
      // Normalize: build payload only with keys that are non-empty where appropriate
      const normalize = (obj: Record<string, any>) => {
        const out: Record<string, any> = {}
        Object.entries(obj).forEach(([k, v]) => {
          if (v === undefined) return
          // keep booleans and numbers; trim strings
          if (typeof v === 'string') {
            const t = v.trim()
            if (t === '') return
            out[k] = t
          } else {
            out[k] = v
          }
        })
        return out
      }

      const normalizedProfile = normalize({
          company_name: current.company_name,
          company_tagline: current.company_tagline,
          email: current.email,
          phone: current.phone,
          website: current.website,
          address: current.address,
          city: current.city,
          state: current.state,
          pin_code: current.pin_code,
          gstin: current.gstin,
          pan: current.pan,
          cin: current.cin,
        })
      const normalizedBanking = normalize({
          bank_name: current.bank_name,
          account_number: current.account_number,
          ifsc_code: current.ifsc_code,
        })
      const normalizedBranding = normalize({
          logo_url: logoUrl,
          signature_url: signatureUrl,
          qr_code_url: qrCodeUrl,
          primary_color: current.primary_color,
          secondary_color: current.secondary_color,
          quotation_template: current.quotation_template,
          invoice_template: current.invoice_template,
        })

      // Build payload conditionally: omit empty sections entirely
      const updatePayload: any = {}
      if (Object.keys(normalizedProfile).length > 0) updatePayload.profile = normalizedProfile
      if (Object.keys(normalizedBanking).length > 0) updatePayload.banking = normalizedBanking
      if (Object.keys(normalizedBranding).length > 0) updatePayload.branding = normalizedBranding

      // Update via API
  const result = await updateCompanySettings(orgId, updatePayload)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setProgress(100)

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      })

      // Clear file states after successful upload
      setLogoFile(null)
      setSignatureFile(null)
      setQrCodeFile(null)

      // Refresh form with authoritative saved data so changes persist across refresh
      await loadCompanyData()

    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {orgLoading && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <Loader2 className="animate-spin h-4 w-4" />
            <div>
              <div className="font-medium">Resolving organization...</div>
              <div className="text-xs text-gray-500">Waiting for organization membership to be determined before loading settings.</div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-1">Manage your company information and branding</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Badge variant={orgId ? "default" : "secondary"}>
            {orgId ? "Connected" : "Not Connected"}
          </Badge>
          {orgId && (
            <span className="text-xs text-gray-500 hidden sm:inline">org: {orgId.slice(0,8)}…</span>
          )}
          {process.env.NODE_ENV !== 'production' && (
            <Button size="sm" variant="outline" onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </Button>
          )}
        </div>
      </div>

      {process.env.NODE_ENV !== 'production' && showDebug && (
        <Card>
          <CardContent className="pt-6 text-xs text-gray-700 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div><span className="font-medium">Org ID:</span> <code>{orgId || '—'}</code></div>
              <div><span className="font-medium">Loading:</span> {String(loading)}</div>
              <div><span className="font-medium">Error:</span> {error || '—'}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="font-medium">Org override:</label>
              <input
                className="border rounded px-2 py-1 w-full sm:w-96"
                value={debugOrgId}
                onChange={(e) => setDebugOrgId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000001"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!debugOrgId) return
                  const result = await getCompanySettings(debugOrgId)
                  if (result.data) {
                    const { profile, banking, branding } = result.data
                    const values = {
                      company_name: profile?.company_name || '',
                      company_tagline: profile?.company_tagline || '',
                      email: profile?.email || '',
                      phone: profile?.phone || '',
                      website: profile?.website || '',
                      address: profile?.address || '',
                      city: profile?.city || '',
                      state: profile?.state || '',
                      pin_code: profile?.pin_code || '',
                      gstin: profile?.gstin || '',
                      pan: profile?.pan || '',
                      cin: profile?.cin || '',
                      bank_name: banking?.bank_name || '',
                      account_number: banking?.account_number || '',
                      ifsc_code: banking?.ifsc_code || '',
                      primary_color: branding?.primary_color || '#3B82F6',
                      secondary_color: branding?.secondary_color || '#1E40AF',
                      quotation_template: (branding?.quotation_template as any) || 'modern',
                      invoice_template: (branding?.invoice_template as any) || 'modern',
                    }
                    form.reset(values)
                    Object.entries(values).forEach(([k, v]) => {
                      try { form.setValue(k as any, v as any, { shouldValidate: false, shouldDirty: false }) } catch (e) { /* ignore */ }
                    })
                    await form.trigger()
                    setLogoPreview(branding?.logo_url || '')
                    setSignaturePreview(branding?.signature_url || '')
                    toast({ title: 'Loaded via override', description: `Fetched company settings for ${debugOrgId.slice(0,8)}…` })
                  } else {
                    toast({ title: 'No data for override', description: 'No company settings found for this org id' })
                  }
                }}
              >
                Load
              </Button>
            </div>
            <div className="mt-2">
              <span className="font-medium">Last fetched bundle:</span>
              <pre className="mt-1 bg-gray-50 rounded p-2 overflow-auto max-h-64">
{JSON.stringify(lastBundle, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress indicator when submitting */}
      {isSubmitting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Saving company settings...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

  <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic information about your company that will appear on documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      placeholder="Enter your company name"
                      value={form.watch("company_name") || ''}
                      onChange={(e) => {
                        form.setValue("company_name", e.target.value, { shouldValidate: true, shouldDirty: true })
                      }}
                      aria-invalid={!!form.formState.errors.company_name}
                      className={form.formState.errors.company_name ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.company_name && (
                      <p className="text-sm text-red-500">{form.formState.errors.company_name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_tagline">Company Tagline</Label>
                    <Input
                      id="company_tagline"
                      placeholder="Your company motto or tagline"
                      value={form.watch("company_tagline") || ''}
                      onChange={(e) => {
                        form.setValue("company_tagline", e.target.value, { shouldValidate: true, shouldDirty: true })
                      }}
                      aria-invalid={!!form.formState.errors.company_tagline}
                    />
                    {form.formState.errors.company_tagline && (
                      <p className="text-sm text-red-500">{form.formState.errors.company_tagline.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      GSTIN
                    </Label>
                    <Input
                      id="gstin"
                      placeholder="22AAAAA0000A1Z5"
                      value={form.watch("gstin") || ''}
                      onChange={(e) => form.setValue("gstin", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.gstin && (
                      <p className="text-sm text-red-500">{form.formState.errors.gstin.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pan" className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      PAN
                    </Label>
                    <Input
                      id="pan"
                      placeholder="AAAAA0000A"
                      {...form.register("pan")}
                    />
                    {form.formState.errors.pan && (
                      <p className="text-sm text-red-500">{form.formState.errors.pan.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <Input
                      id="cin"
                      placeholder="U12345AB1234ABC123456"
                      {...form.register("cin")}
                    />
                    {form.formState.errors.cin && (
                      <p className="text-sm text-red-500">{form.formState.errors.cin.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="terms_and_conditions" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Terms & Conditions
                  </Label>
                  <textarea
                    id="terms_and_conditions"
                    rows={6}
                    placeholder="Enter your company's terms and conditions that will appear on quotes and invoices..."
                    value={form.watch("terms_and_conditions") || ''}
                    onChange={(e) => {
                      form.setValue("terms_and_conditions", e.target.value, { shouldValidate: true, shouldDirty: true })
                    }}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
                    aria-invalid={!!form.formState.errors.terms_and_conditions}
                  />
                  {form.formState.errors.terms_and_conditions && (
                    <p className="text-sm text-red-500">{form.formState.errors.terms_and_conditions.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum 5000 characters. This will be included in your quotes and invoices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  How customers can reach your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={form.watch("email") || ''}
                      onChange={(e) => form.setValue("email", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      value={form.watch("phone") || ''}
                      onChange={(e) => form.setValue("phone", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.company.com"
                    value={form.watch("website") || ''}
                    onChange={(e) => form.setValue("website", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  />
                  {form.formState.errors.website && (
                    <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Business Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your complete business address"
                    rows={3}
                    {...form.register("address")}
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={form.watch("city") || ''}
                      onChange={(e) => form.setValue("city", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Maharashtra"
                      value={form.watch("state") || ''}
                      onChange={(e) => form.setValue("state", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.state && (
                      <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pin_code">PIN Code</Label>
                    <Input
                      id="pin_code"
                      placeholder="400001"
                      {...form.register("pin_code")}
                    />
                    {form.formState.errors.pin_code && (
                      <p className="text-sm text-red-500">{form.formState.errors.pin_code.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Banking Information
                </CardTitle>
                <CardDescription>
                  Bank details for payment processing and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="State Bank of India"
                    value={form.watch("bank_name") || ''}
                    onChange={(e) => form.setValue("bank_name", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  />
                  {form.formState.errors.bank_name && (
                    <p className="text-sm text-red-500">{form.formState.errors.bank_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      placeholder="123456789012"
                      value={form.watch("account_number") || ''}
                      onChange={(e) => form.setValue("account_number", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.account_number && (
                      <p className="text-sm text-red-500">{form.formState.errors.account_number.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                    <Input
                      id="ifsc_code"
                      placeholder="SBIN0001234"
                      value={form.watch("ifsc_code") || ''}
                      onChange={(e) => form.setValue("ifsc_code", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    />
                    {form.formState.errors.ifsc_code && (
                      <p className="text-sm text-red-500">{form.formState.errors.ifsc_code.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Payment QR Code
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a QR code for customers to make payments (UPI, Payment apps, etc.)
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          id="qr_code_upload"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('qr_code_upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload QR Code
                        </Button>
                      </div>
                      
                      {qrCodePreview && (
                        <div className="relative">
                          <img 
                            src={qrCodePreview} 
                            alt="QR Code Preview" 
                            className="w-20 h-20 object-contain border border-gray-200 rounded-lg bg-white p-2"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => {
                              setQrCodeFile(null)
                              setQrCodePreview('')
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            {/* Logo and Signature Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Company Assets
                </CardTitle>
                <CardDescription>
                  Upload your company logo and signature for documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <Label>Company Logo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {logoPreview ? (
                        <div className="space-y-3">
                          <Avatar className="h-16 w-16 mx-auto">
                            <AvatarImage src={logoPreview} alt="Company Logo" />
                            <AvatarFallback><ImageIcon className="h-8 w-8" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Logo uploaded</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              className="mt-2"
                            >
                              Change Logo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="space-y-3 cursor-pointer"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Upload Logo</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Signature Upload */}
                  <div className="space-y-4">
                    <Label>Authorized Signature</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {signaturePreview ? (
                        <div className="space-y-3">
                          <div className="h-16 w-32 mx-auto bg-gray-100 rounded border overflow-hidden">
                            <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Signature uploaded</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => signatureInputRef.current?.click()}
                              className="mt-2"
                            >
                              Change Signature
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="space-y-3 cursor-pointer"
                          onClick={() => signatureInputRef.current?.click()}
                        >
                          <User className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Upload Signature</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Colors
                </CardTitle>
                <CardDescription>
                  Choose colors that represent your brand in documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        className="w-16 h-10 p-1 border rounded"
                        value={form.watch("primary_color") || '#3B82F6'}
                        onChange={(e) => form.setValue("primary_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                      />
                      <Input
                        type="text"
                        placeholder="#3B82F6"
                        value={form.watch("primary_color") || '#3B82F6'}
                        onChange={(e) => form.setValue("primary_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                      />
                    </div>
                    {form.formState.errors.primary_color && (
                      <p className="text-sm text-red-500">{form.formState.errors.primary_color.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        className="w-16 h-10 p-1 border rounded"
                        value={form.watch("secondary_color") || '#1E40AF'}
                        onChange={(e) => form.setValue("secondary_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                      />
                      <Input
                        type="text"
                        placeholder="#1E40AF"
                        value={form.watch("secondary_color") || '#1E40AF'}
                        onChange={(e) => form.setValue("secondary_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                      />
                    </div>
                    {form.formState.errors.secondary_color && (
                      <p className="text-sm text-red-500">{form.formState.errors.secondary_color.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Templates
                </CardTitle>
                <CardDescription>
                  Choose templates for your quotations and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quotation Templates */}
                <div className="space-y-3">
                  <Label>Quotation Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templateOptions.quotation.map((template) => {
                      const IconComponent = template.icon
                      return (
                        <div
                          key={template.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            form.watch("quotation_template") === template.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => form.setValue("quotation_template", template.value as any, { shouldValidate: true, shouldDirty: true })}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: template.color }}
                            >
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{template.label}</h4>
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              <div className="mt-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewType('quotation')
                                    setPreviewTemplate(template.value)
                                    setShowPreview(true)
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Preview
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Invoice Templates */}
                <div className="space-y-3">
                  <Label>Invoice Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templateOptions.invoice.map((template) => {
                      const IconComponent = template.icon
                      return (
                        <div
                          key={template.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            form.watch("invoice_template") === template.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => form.setValue("invoice_template", template.value as any, { shouldValidate: true, shouldDirty: true })}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: template.color }}
                            >
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{template.label}</h4>
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              <div className="mt-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewType('invoice')
                                    setPreviewTemplate(template.value)
                                    setShowPreview(true)
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Preview
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {form.formState.isDirty && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>You have unsaved changes</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    loadCompanyData()
                  }}
                  disabled={isSubmitting}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting || !orgId}
                  className="min-w-32"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        type={previewType}
        template={previewTemplate}
        companyData={buildCompanyDataForPreview()}
      />
    </div>
  )
}