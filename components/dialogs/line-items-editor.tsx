"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface LineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface LineItemsEditorProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  const [localItems, setLocalItems] = useState<LineItem[]>(items)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const addItem = () => {
    const newItem: LineItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      total: 0,
    }
    const updatedItems = [...localItems, newItem]
    setLocalItems(updatedItems)
    onChange(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = localItems.filter((_, i) => i !== index)
    setLocalItems(updatedItems)
    onChange(updatedItems)
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...localItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setLocalItems(updatedItems)
    onChange(updatedItems)
  }

  const getTotalAmount = () => {
    return localItems.reduce((sum, item) => sum + item.total, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Line Items</Label>
        <Button
          type="button"
          onClick={addItem}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {localItems.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="w-[15%]">Qty</TableHead>
                <TableHead className="w-[20%]">Unit Price</TableHead>
                <TableHead className="w-[20%]">Total</TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="min-h-[60px] resize-none"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ₹{item.total.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="border-t p-4">
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                Total: ₹{getTotalAmount().toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {localItems.length === 0 && (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p>No items added yet</p>
          <p className="text-sm">Click "Add Item" to get started</p>
        </div>
      )}
    </div>
  )
}