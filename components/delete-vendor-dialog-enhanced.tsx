"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DeleteVendorDialogEnhancedProps {
  vendor: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteVendorDialogEnhanced({ 
  vendor, 
  open, 
  onOpenChange,
  onSuccess
}: DeleteVendorDialogEnhancedProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const handleDelete = async () => {
    // Verify confirmation text
    if (confirmation !== vendor.name) {
      setError(`Please type "${vendor.name}" to confirm deletion`)
      return
    }
    
    setIsDeleting(true)
    setError(null)
    
    try {
      // Try direct Supabase delete first
      try {
        // Delete any vendor files records from database
        await supabase
          .from('vendor_files')
          .delete()
          .eq('vendor_id', vendor.id)
        
        // Delete vendor record
        const { error: deleteError } = await supabase
          .from('vendors')
          .delete()
          .eq('id', vendor.id)
        
        if (deleteError) throw deleteError
        
        toast({
          title: "Vendor Deleted",
          description: `${vendor.name} has been successfully deleted.`,
        })

        onOpenChange(false)
        onSuccess?.()
      } catch (dbError: any) {
        // If database delete fails, try using the fallback API
        console.log("Trying fallback API for vendor deletion")
        const response = await fetch(`/api/vendors-fallback/${vendor.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete vendor using fallback API')
        }

        toast({
          title: "Vendor Deleted (Demo Mode)",
          description: `${vendor.name} has been deleted in demo mode.`,
        })

        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error: any) {
      console.error("Error deleting vendor:", error)
      setError(error.message || "An unexpected error occurred")
      toast({
        title: "Error Deleting Vendor",
        description: error.message || "Failed to delete vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Delete Vendor
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The vendor and all associated data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Warning</p>
              <p className="text-sm">
                Deleting this vendor will remove all vendor information, project links, and files.
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="confirmDelete" className="text-sm font-medium mb-2 block">
              Type <span className="font-semibold">"{vendor.name}"</span> to confirm deletion
            </Label>
            <Input
              id="confirmDelete"
              placeholder={`Type "${vendor.name}" here`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="border-destructive/50 focus:border-destructive"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete} 
            disabled={isDeleting || confirmation !== vendor.name}
          >
            {isDeleting ? "Deleting..." : "Delete Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}