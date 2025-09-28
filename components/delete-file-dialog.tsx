"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Image, FileSpreadsheet, File, AlertTriangle } from "lucide-react"
import { ClientFile } from "@/lib/services/client-files"

interface DeleteFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: ClientFile | null
  onConfirmDelete: (fileId: string) => Promise<void>
  isDeleting?: boolean
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  file,
  onConfirmDelete,
  isDeleting = false
}: DeleteFileDialogProps) {
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'image':
        return <Image className="h-8 w-8 text-purple-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleConfirm = async () => {
    if (file) {
      await onConfirmDelete(file.id)
      onOpenChange(false)
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete File
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <div className="flex items-center space-x-4">
                {getFileIcon(file.category)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                  {file.description && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {file.description}
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}