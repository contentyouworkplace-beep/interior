"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface LineItemsEditorProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  disabled?: boolean
}

export function LineItemsEditor({ items, onChange, disabled }: LineItemsEditorProps) {
  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    }
    onChange([...items, newItem])
  }

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalculate amount if quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
    }
    
    onChange(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4 items-start">
          <div className="flex-1">
            <Textarea
              placeholder="Item description"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              disabled={disabled}
              className="resize-none h-[60px]"
            />
          </div>
          <div className="w-20">
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="w-32">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit Price"
              value={item.unitPrice}
              onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="w-32">
            <Input
              type="number"
              value={item.amount}
              disabled
              className="bg-muted"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => removeItem(index)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        disabled={disabled}
        className="w-full"
      >
        Add Item
      </Button>
    </div>
  )
}