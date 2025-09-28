"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Mail, 
  MessageCircle, 
  Share2, 
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File as FileIcon
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ClientFile } from "@/lib/services/client-files"

interface ShareFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: ClientFile | null
  client: {
    first_name: string
    last_name: string
    email?: string
    alt_phone?: string
  } | null
  fileUrl?: string
}

export function ShareFileDialog({
  open,
  onOpenChange,
  file,
  client,
  fileUrl
}: ShareFileDialogProps) {
  const { toast } = useToast()

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="h-6 w-6 text-red-500" />
      case 'image':
        return <ImageIcon className="h-6 w-6 text-purple-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />
      default:
        return <FileIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const handleEmailShare = () => {
    if (!client?.email || !file) return

    const clientName = `${client.first_name} ${client.last_name}`
    const subject = `File from ${clientName}: ${file.filename}`
    const body = `Dear ${client.first_name},\n\nPlease find the attached file: ${file.filename}.\n\nNote: You may need to download and attach this file manually from the app.\n\nBest regards,\n${clientName}`

    const emailUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(emailUrl, '_blank')

    toast({
      title: "Email opened",
      description: `Email client opened. Please attach the file manually.`
    })
  }

  const handleWhatsAppShare = () => {
    if (!client?.alt_phone || !file) return

    const cleanPhone = client.alt_phone.replace(/[^\d]/g, '')
    const message = `📄 ${file.filename}\n\nPlease check your email for the attachment or download it from the app.\n\n— ${client.first_name} ${client.last_name}`
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, '_blank')

    toast({
      title: "WhatsApp opened",
      description: `WhatsApp opened. Attach the file from the app if needed.`
    })
  }

  const handleNativeShare = async () => {
    if (!navigator.share || !file || !fileUrl) return
    
    try {
      // Fetch and share the actual file as document/image
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      
      // Ensure correct MIME type for the file
      const mimeType = file.file_type || blob.type || 'application/octet-stream'
      const shareFile = new window.File([blob], file.filename, { type: mimeType })
      
      await navigator.share({
        title: `📄 ${file.filename}`,
        text: `Sharing document: ${file.filename}`,
        files: [shareFile]
      })
      
      toast({
        title: "File shared",
        description: `${file.filename} shared as document successfully`
      })
    } catch (error) {
      console.error('Native share error:', error)
      toast({
        title: "Share failed",
        description: "Unable to share file. Please use email or WhatsApp options.",
        variant: "destructive"
      })
    }
  }

  if (!file || !client) return null

  const clientName = `${client.first_name} ${client.last_name}`
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share File
          </DialogTitle>
          <DialogDescription>
            Share {file.filename} with {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.category)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sharing Options */}
          <div className="space-y-3">
            {/* Native Share (if supported) */}
            {hasNativeShare && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Document
              </Button>
            )}

            {/* Email */}
            {client.email && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleEmailShare}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email to {client.email}
              </Button>
            )}

            {/* WhatsApp */}
            {client.alt_phone && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp to {client.alt_phone}
              </Button>
            )}

            {/* Open in New Tab */}
            {fileUrl && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </div>

          {/* Contact Info Note */}
          {!client.email && !client.alt_phone && (
            <p className="text-sm text-muted-foreground text-center p-3 bg-muted rounded-md">
              No contact information available for {clientName}. 
              {hasNativeShare ? 'You can use system sharing to share the document.' : 'Please add contact details to enable sharing.'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}