import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddDepartmentDialogProps {
  onAdd: (name: string) => void
  children: React.ReactNode
}

export function AddDepartmentDialog({ onAdd, children }: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    onAdd(name.trim())
    setIsLoading(false)
    setName("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Department name"
            disabled={isLoading}
            required
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Adding..." : "Add Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
