/**
 * Share Management Component
 * Manages portfolio sharing links, QR codes, and PDF generation
 * Complete sharing solution for portfolio projects
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import PortfolioService from '@/lib/services/portfolio-service'
import QRCodeGenerator from '@/lib/utils/qr-code-generator'
import PDFGenerator from '@/lib/services/pdf-generator'
import type { PortfolioProject, PortfolioMedia, PortfolioShare, CreateShareRequest } from '@/types/portfolio'
import { 
  Share2,
  Copy,
  Download,
  QrCode,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  Link2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Settings,
  Users,
  BarChart3,
  Loader2,
  Mail,
  MessageCircle,
  ImageIcon,
  Palette
} from 'lucide-react'

interface ShareManagerProps {
  project: PortfolioProject
  media: PortfolioMedia[]
  className?: string
  onShareCreated?: (share: PortfolioShare) => void
  onShareDeleted?: (shareId: string) => void
}

export function ShareManager({ 
  project, 
  media, 
  className = '',
  onShareCreated,
  onShareDeleted
}: ShareManagerProps) {
  const [shares, setShares] = useState<PortfolioShare[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<PortfolioShare | null>(null)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [shareForm, setShareForm] = useState<CreateShareRequest>({
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    password_protected: false,
    password: '',
    allow_downloads: true
  })
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [selectedShareForMessaging, setSelectedShareForMessaging] = useState<PortfolioShare | null>(null)
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: `Portfolio: ${project.title}`,
    message: `Hi,\n\nI'd like to share my interior design portfolio with you. Please check out the project "${project.title}" using the link below.\n\nBest regards`
  })
  const [whatsappMessage, setWhatsappMessage] = useState(
    `Hi! Check out my interior design portfolio: "${project.title}" 🏠✨`
  )
  const { toast } = useToast()

  useEffect(() => {
    loadShares()
  }, [project.id])

  const loadShares = async () => {
    try {
      setLoading(true)
      const result = await PortfolioService.getProjectShares(project.id)
      if (result.success && result.shares) {
        setShares(result.shares)
      }
    } catch (error) {
      console.error('Failed to load shares:', error)
      toast({
        title: "Failed to Load Shares",
        description: "Could not load existing shares",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createShare = async () => {
    try {
      const result = await PortfolioService.createShare(project.id, shareForm)
      if (result.success && result.share) {
        setShares(prev => [...prev, result.share])
        setCreateDialogOpen(false)
        onShareCreated?.(result.share)
        
        // Reset form
        setShareForm({
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          password_protected: false,
          password: '',
          allow_downloads: true
        })

        toast({
          title: "Share Created",
          description: "Portfolio share link created successfully",
        })
      }
    } catch (error) {
      console.error('Failed to create share:', error)
      toast({
        title: "Failed to Create Share",
        description: "Could not create share link",
        variant: "destructive",
      })
    }
  }

  const deleteShare = async (shareId: string) => {
    try {
      const result = await PortfolioService.deleteShare(shareId)
      if (result.success) {
        setShares(prev => prev.filter(s => s.id !== shareId))
        onShareDeleted?.(shareId)
        
        toast({
          title: "Share Deleted",
          description: "Share link has been deleted",
        })
      }
    } catch (error) {
      console.error('Failed to delete share:', error)
      toast({
        title: "Failed to Delete Share",
        description: "Could not delete share link",
        variant: "destructive",
      })
    }
  }

  const copyShareUrl = async (share: PortfolioShare) => {
    const url = `${window.location.origin}/portfolio/shared/${share.share_token}`
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = async (share: PortfolioShare) => {
    try {
      const url = `${window.location.origin}/portfolio/shared/${share.share_token}`
      const qrCode = await QRCodeGenerator.generatePortfolioQR(
        share.share_token, 
        window.location.origin,
        {
          includeWatermark: watermarkEnabled,
          logoUrl: watermarkEnabled ? '/logo.png' : undefined // Add your logo path here
        }
      )
      setQrCodeDataURL(qrCode)
      setSelectedShare(share)
      setQrDialogOpen(true)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      toast({
        title: "QR Code Failed",
        description: "Could not generate QR code",
        variant: "destructive",
      })
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataURL || !selectedShare) return

    const a = document.createElement('a')
    a.href = qrCodeDataURL
    a.download = `${project.title}-qr-code.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast({
      title: "QR Code Downloaded",
      description: "QR code image saved to downloads",
    })
  }

  const generatePDF = async (share?: PortfolioShare, withWatermark?: boolean) => {
    try {
      setLoading(true)
      
      const shareUrl = share 
        ? `${window.location.origin}/portfolio/shared/${share.share_token}`
        : undefined

      const pdfBlob = await PDFGenerator.generatePortfolioPDF({
        project,
        media,
        share,
        shareUrl
      }, {
        includeMedia: true,
        includeQRCode: !!shareUrl,
        includeWatermark: withWatermark ?? watermarkEnabled,
        branding: {
          companyName: 'Portfolio CRM',
          website: window.location.origin,
          logo: '/logo.png' // Add your logo path here
        }
      })

      // Download PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title}-portfolio.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Generated",
        description: "Portfolio PDF downloaded successfully",
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate portfolio PDF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getShareUrl = (share: PortfolioShare) => {
    return `${window.location.origin}/portfolio/shared/${share.share_token}`
  }

  const isExpired = (share: PortfolioShare) => {
    return share.expires_at && new Date(share.expires_at) < new Date()
  }

  const shareViaEmail = (share: PortfolioShare) => {
    setSelectedShareForMessaging(share)
    setEmailForm({
      ...emailForm,
      subject: `Portfolio: ${project.title}`,
      message: `Hi,\n\nI'd like to share my interior design portfolio with you. Please check out the project "${project.title}" using the link below.\n\n${getShareUrl(share)}\n\nBest regards`
    })
    setEmailDialogOpen(true)
  }

  const sendEmail = async () => {
    if (!selectedShareForMessaging) return

    try {
      const shareUrl = getShareUrl(selectedShareForMessaging)
      const mailtoLink = `mailto:${emailForm.to}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(`${emailForm.message}\n\n${shareUrl}`)}`
      
      window.location.href = mailtoLink
      setEmailDialogOpen(false)
      
      toast({
        title: "Email Opened",
        description: "Your email client should open with the portfolio link",
      })
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Could not open email client",
        variant: "destructive",
      })
    }
  }

  const shareViaWhatsApp = (share: PortfolioShare) => {
    setSelectedShareForMessaging(share)
    setWhatsappMessage(`Hi! Check out my interior design portfolio: "${project.title}" 🏠✨\n\n${getShareUrl(share)}`)
    setWhatsappDialogOpen(true)
  }

  const sendWhatsApp = () => {
    if (!selectedShareForMessaging) return

    try {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
      window.open(whatsappUrl, '_blank')
      setWhatsappDialogOpen(false)
      
      toast({
        title: "WhatsApp Opened",
        description: "WhatsApp should open with the portfolio link",
      })
    } catch (error) {
      toast({
        title: "WhatsApp Failed",
        description: "Could not open WhatsApp",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Share Portfolio</h2>
          <p className="text-muted-foreground">
            Create public links, QR codes, and PDF reports for this portfolio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              id="watermark-toggle"
              checked={watermarkEnabled}
              onCheckedChange={setWatermarkEnabled}
            />
            <Label htmlFor="watermark-toggle" className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span>Watermark</span>
            </Label>
          </div>
          <Button onClick={() => generatePDF()}>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Share2 className="mr-2 h-4 w-4" />
                Create Share Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Share Link</DialogTitle>
                <DialogDescription>
                  Generate a public link to share this portfolio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expires_at">Expires On</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={shareForm.expires_at}
                    onChange={(e) => setShareForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow_downloads"
                    checked={shareForm.allow_downloads}
                    onCheckedChange={(checked) => setShareForm(prev => ({ ...prev, allow_downloads: checked }))}
                  />
                  <Label htmlFor="allow_downloads">Allow downloads</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="password_protected"
                    checked={shareForm.password_protected}
                    onCheckedChange={(checked) => setShareForm(prev => ({ ...prev, password_protected: checked, password: checked ? prev.password : '' }))}
                  />
                  <Label htmlFor="password_protected">Password protect</Label>
                </div>
                {shareForm.password_protected && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={shareForm.password}
                      onChange={(e) => setShareForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createShare}>
                  Create Share Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{shares.length}</div>
            <div className="text-sm text-muted-foreground">Active Shares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{shares.filter(s => !isExpired(s)).length}</div>
            <div className="text-sm text-muted-foreground">Valid Links</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{shares.reduce((sum, s) => sum + (s.view_count || 0), 0)}</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{media.length}</div>
            <div className="text-sm text-muted-foreground">Media Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Shares List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link2 className="mr-2 h-5 w-5" />
            Share Links
          </CardTitle>
          <CardDescription>
            Manage public access links for this portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Share Links</h3>
              <p className="text-muted-foreground mb-4">
                Create a share link to allow public access to this portfolio
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create First Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={isExpired(share) ? "destructive" : "default"}>
                        {isExpired(share) ? "Expired" : "Active"}
                      </Badge>
                      {share.password_protected && (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Password Protected
                        </Badge>
                      )}
                      {share.allow_downloads && (
                        <Badge variant="outline">
                          Downloads Enabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getShareUrl(share)}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Expires: {share.expires_at ? new Date(share.expires_at).toLocaleDateString() : 'Never'}
                      </span>
                      <span className="flex items-center">
                        <Eye className="mr-1 h-3 w-3" />
                        {share.view_count || 0} views
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        Created {new Date(share.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => copyShareUrl(share)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button size="sm" variant="outline" onClick={() => shareViaEmail(share)}>
                      <Mail className="h-4 w-4" />
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => shareViaWhatsApp(share)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    
                    <Button size="sm" variant="outline" onClick={() => generateQRCode(share)}>
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => generatePDF(share)}>
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(getShareUrl(share), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Share Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the share link. Anyone with this link will no longer be able to access the portfolio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteShare(share.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to access the portfolio on mobile devices
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeDataURL && (
              <>
                <img 
                  src={qrCodeDataURL} 
                  alt="Portfolio QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {selectedShare && getShareUrl(selectedShare)}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={downloadQRCode}>
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Sharing Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Share via Email
            </DialogTitle>
            <DialogDescription>
              Send portfolio link via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="client@example.com"
                value={emailForm.to}
                onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <textarea
                id="email-message"
                className="w-full min-h-24 p-3 border rounded-md resize-none"
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a personal message..."
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p className="font-medium mb-1">Share link will be added automatically:</p>
              <p className="break-all">
                {selectedShareForMessaging && getShareUrl(selectedShareForMessaging)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={!emailForm.to}>
              <Mail className="mr-2 h-4 w-4" />
              Open Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Sharing Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
              Share via WhatsApp
            </DialogTitle>
            <DialogDescription>
              Send portfolio link via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="whatsapp-message">Message</Label>
              <textarea
                id="whatsapp-message"
                className="w-full min-h-24 p-3 border rounded-md resize-none"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Add your WhatsApp message..."
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p className="font-medium mb-1">Preview:</p>
              <div className="bg-green-50 p-2 rounded border-l-4 border-green-500 mt-2">
                <p className="whitespace-pre-line text-sm">{whatsappMessage}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShareManager