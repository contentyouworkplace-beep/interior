"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteClient } from "@/lib/services/supabase/clients"

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientId: string
  onDeleted?: () => void
}

export function DeleteClientDialog({ open, onOpenChange, clientName, clientId, onDeleted }: DeleteClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const { error } = await deleteClient(clientId)
      if (error) throw error

      toast({
        title: "Success!",
        description: "Client has been deleted successfully.",
      })
      
      onDeleted?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting client:', error)
      const message = (error as any)?.message || (error instanceof Error ? error.message : 'Failed to delete client')
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-medium text-foreground">{clientName}&apos;s</span> client profile
            and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={handleDelete}
            className="bg-red-600 focus:ring-red-600"
          >
            {isLoading ? "Deleting..." : "Delete Client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}