import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddDepartmentDialog } from "./dialogs/add-department-dialog"

interface Department {
  id: string
  name: string
}

interface DepartmentListProps {
  departments: Department[]
  onAdd: (name: string) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function DepartmentList({ departments, onAdd, onEdit, onDelete }: DepartmentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddDepartmentDialog onAdd={onAdd}>
          <Button variant="primary">+ Add Department</Button>
        </AddDepartmentDialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="border rounded-lg p-4 flex flex-col gap-2">
            {editingId === dept.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (editName.trim()) {
                    onEdit(dept.id, editName.trim())
                    setEditingId(null)
                  }
                }}
                className="flex gap-2"
              >
                <input
                  className="border rounded px-2 py-1 flex-1"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <div className="font-semibold text-lg">{dept.name}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(dept.id); setEditName(dept.name); }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(dept.id)}>Delete</Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
