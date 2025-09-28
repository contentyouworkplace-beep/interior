"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface TaxConfig {
  type: "none" | "vat" | "custom"
  rate: number
  amount: number
}

interface TaxCalculatorProps {
  subtotal: number
  tax: TaxConfig
  onTaxChange: (tax: TaxConfig) => void
  disabled?: boolean
}

export function TaxCalculator({ subtotal, tax, onTaxChange, disabled }: TaxCalculatorProps) {
  useEffect(() => {
    // Recalculate tax amount when subtotal or rate changes
    const amount = tax.type === "none" ? 0 : (subtotal * tax.rate) / 100
    if (amount !== tax.amount) {
      onTaxChange({ ...tax, amount })
    }
  }, [subtotal, tax.rate, tax.type])

  return (
    <div className="flex items-center gap-4">
      <Select
        value={tax.type}
        onValueChange={(value: "none" | "vat" | "custom") => {
          const rate = value === "vat" ? 5 : value === "custom" ? tax.rate : 0
          onTaxChange({ type: value, rate, amount: (subtotal * rate) / 100 })
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select tax" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Tax</SelectItem>
          <SelectItem value="vat">VAT (5%)</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {tax.type === "custom" && (
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={tax.rate}
          onChange={(e) => {
            const rate = parseFloat(e.target.value) || 0
            onTaxChange({ ...tax, rate, amount: (subtotal * rate) / 100 })
          }}
          className="w-24"
          disabled={disabled}
        />
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Amount:</span>
        <Input
          type="number"
          value={tax.amount.toFixed(2)}
          disabled
          className="w-32 bg-muted"
        />
      </div>
    </div>
  )
}