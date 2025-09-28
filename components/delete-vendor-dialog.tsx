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
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeleteVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: { id: string; name: string } | null
  onVendorDeleted: () => void
}

export function DeleteVendorDialog({
  open,
  onOpenChange,
  vendor,
  onVendorDeleted
}: DeleteVendorDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!vendor) return

    setLoading(true)
    try {
      const response = await fetch('/api/vendors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: vendor.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete vendor')
      }

      toast({
        title: "Success",
        description: "Vendor deleted successfully.",
      })

      onVendorDeleted()
      onOpenChange(false)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!vendor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Vendor
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{vendor.name}</strong>? 
            This action cannot be undone and will also delete all associated files and records.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 my-4">
          <p className="text-sm text-destructive font-medium">
            ⚠️ This will permanently delete:
          </p>
          <ul className="text-sm text-destructive mt-2 ml-4 list-disc space-y-1">
            <li>Vendor information and details</li>
            <li>All uploaded files and documents</li>
            <li>Project associations</li>
            <li>Quotations and records</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}