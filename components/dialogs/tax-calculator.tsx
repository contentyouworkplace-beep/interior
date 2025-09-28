"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface TaxConfig {
  type: 'percentage' | 'fixed'
  rate: number
  name: string
}

interface TaxCalculatorProps {
  subtotal: number
  taxes: TaxConfig[]
  onTaxesChange: (taxes: TaxConfig[]) => void
  onTotalChange: (total: number, taxAmount: number) => void
}

export function TaxCalculator({ 
  subtotal, 
  taxes, 
  onTaxesChange, 
  onTotalChange 
}: TaxCalculatorProps) {
  const [localTaxes, setLocalTaxes] = useState<TaxConfig[]>(taxes)

  useEffect(() => {
    setLocalTaxes(taxes)
  }, [taxes])

  const updateTax = (index: number, field: keyof TaxConfig, value: string | number) => {
    const updatedTaxes = [...localTaxes]
    updatedTaxes[index] = { ...updatedTaxes[index], [field]: value }
    setLocalTaxes(updatedTaxes)
    onTaxesChange(updatedTaxes)
  }

  const addTax = () => {
    const newTax: TaxConfig = {
      type: 'percentage',
      rate: 0,
      name: 'Tax',
    }
    const updatedTaxes = [...localTaxes, newTax]
    setLocalTaxes(updatedTaxes)
    onTaxesChange(updatedTaxes)
  }

  const removeTax = (index: number) => {
    const updatedTaxes = localTaxes.filter((_, i) => i !== index)
    setLocalTaxes(updatedTaxes)
    onTaxesChange(updatedTaxes)
  }

  const calculateTaxAmount = (tax: TaxConfig) => {
    if (tax.type === 'percentage') {
      return (subtotal * tax.rate) / 100
    }
    return tax.rate
  }

  const totalTaxAmount = localTaxes.reduce((sum, tax) => sum + calculateTaxAmount(tax), 0)
  const finalTotal = subtotal + totalTaxAmount

  useEffect(() => {
    onTotalChange(finalTotal, totalTaxAmount)
  }, [finalTotal, totalTaxAmount, onTotalChange])

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Taxes & Charges</Label>
            <button
              type="button"
              onClick={addTax}
              className="text-xs text-primary hover:underline"
            >
              + Add Tax
            </button>
          </div>
          
          {localTaxes.map((tax, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Input
                  value={tax.name}
                  onChange={(e) => updateTax(index, 'name', e.target.value)}
                  placeholder="Tax name"
                  className="flex-1 mr-2"
                />
                <button
                  type="button"
                  onClick={() => removeTax(index)}
                  className="text-xs text-destructive hover:underline ml-2"
                >
                  Remove
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={tax.type}
                  onValueChange={(value: 'percentage' | 'fixed') => updateTax(index, 'type', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  value={tax.rate}
                  onChange={(e) => updateTax(index, 'rate', parseFloat(e.target.value) || 0)}
                  placeholder={tax.type === 'percentage' ? '0.00' : '0.00'}
                  step="0.01"
                  min="0"
                  className="flex-1"
                />
                
                <div className="text-sm font-medium w-20 text-right">
                  ₹{calculateTaxAmount(tax).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {localTaxes.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span>Total Tax:</span>
              <span className="font-medium">₹{totalTaxAmount.toFixed(2)}</span>
            </div>
          </>
        )}
        
        <Separator />
        
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Final Total:</span>
          <span>₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}