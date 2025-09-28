"use client"

import { useEffect, useMemo, useState } from 'react'
import { type Expense, ExpenseService, supabase } from '@/lib/services/expense-service'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import FileAttachmentHandler from './file-attachment-handler-v2'
import { 
  Eye, 
  IndianRupee,
  Calendar,
  Tag,
  Receipt,
  FileText,
  User,
  CreditCard,
  MapPin,
  Clock,
  X,
  Download,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'

interface ViewExpenseDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewExpenseDialog({ expense, open, onOpenChange }: ViewExpenseDialogProps) {
  if (!expense) return null

  // Debug logging for file URLs
  console.log('🔍 ViewExpenseDialog - Debugging expense data:');
  console.log('  - Expense ID:', expense.id);
  console.log('  - Description:', expense.description);
  console.log('  - file_urls raw:', expense.file_urls);
  console.log('  - file_urls type:', typeof expense.file_urls);
  console.log('  - file_urls is array:', Array.isArray(expense.file_urls));
  console.log('  - file_urls length:', expense.file_urls?.length || 0);
  console.log('  - file_urls stringified:', JSON.stringify(expense.file_urls));

  const [projects, setProjects] = useState<Array<{ id: string; name: string; client_id?: string | null }>>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])

  // Load related data when dialog opens
  useEffect(() => {
    const load = async () => {
      try {
        const [pResp, cResp] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/clients')
        ])
        if (pResp.ok) {
          const pdata = await pResp.json()
          const list = Array.isArray(pdata) ? pdata : (pdata.projects || [])
          setProjects(list.map((p: any) => ({ id: p.id, name: p.name || 'Unnamed Project', client_id: p.client_id ?? null })))
        }
        if (cResp.ok) {
          const cdata = await cResp.json()
          const list = Array.isArray(cdata) ? cdata : (cdata.clients || [])
          const unique = list.filter((c: any, i: number, self: any[]) => i === self.findIndex((x: any) => x.id === c.id))
          setClients(unique.map((c: any) => ({ id: c.id, name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Unnamed Client' })))
        }
      } catch (e) {
        // non-fatal
        console.warn('Failed loading related data for view dialog', e)
      }
    }
    if (open) load()
  }, [open])

  const projectName = useMemo(() => {
    if (!expense.project_id) return undefined
    return projects.find(p => p.id === expense.project_id)?.name
  }, [projects, expense.project_id])

  const clientName = useMemo(() => {
    if (!expense.project_id) return undefined
    const proj = projects.find(p => p.id === expense.project_id)
    if (!proj?.client_id) return undefined
    return clients.find(c => c.id === proj.client_id)?.name
  }, [projects, clients, expense.project_id])

  // Normalize file_urls to string[] and fall back to a single legacy receipt URL if present
  const normalizedFiles: string[] = useMemo(() => {
    const raw = expense.file_urls as any
    let urls: string[] = []
    if (raw) {
      if (Array.isArray(raw)) urls = raw
      else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) urls = parsed
        } catch {
          // not JSON; try comma-separated
          urls = raw.split(',').map(s => s.trim()).filter(Boolean)
        }
      }
    }

    // Fallback for legacy single URL columns
    if (urls.length === 0) {
      const legacy = (expense as any).legacy_receipt_url as string | null | undefined
      const receipt = (expense as any).receipt_url as string | null | undefined
      if (legacy && typeof legacy === 'string') return [legacy]
      if (receipt && typeof receipt === 'string') return [receipt]
    }

    return urls
  }, [expense.file_urls, (expense as any).legacy_receipt_url, (expense as any).receipt_url])

  // Local files state to render (DB-provided or storage-listed)
  const [files, setFiles] = useState<string[]>([])

  // Sync local files with normalized DB value
  useEffect(() => {
    setFiles(normalizedFiles)
  }, [normalizedFiles])

  // If we derived files from legacy columns, persist them back to file_urls for future fast loads
  useEffect(() => {
    if (!open || !expense?.id || !expense.user_id) return
    const hasDbFiles = Array.isArray(expense.file_urls) ? expense.file_urls.length > 0 : !!expense.file_urls
    if (!hasDbFiles && normalizedFiles.length > 0) {
      ;(async () => {
        try {
          await ExpenseService.updateExpense(expense.id!, expense.user_id, { file_urls: normalizedFiles })
        } catch (e) {
          console.warn('Failed to persist normalized legacy URLs to expense:', e)
        }
      })()
    }
  }, [open, expense?.id, expense?.user_id, normalizedFiles.length])

  // Fallback: if no files in DB, try listing storage by convention userId/expenseId,
  // and also try a couple of alternative legacy paths.
  useEffect(() => {
    if (!open || !expense?.id || !expense.user_id) return
    if (files.length > 0) return
    (async () => {
      try {
        const oldBucket = supabase.storage.from('expense-documents')
        const newBucket = supabase.storage.from('expense-documents-new')

        // Helper to list a folder and return public URLs for its direct children
        const listUrlsAt = async (basePath: string, bucketObj = oldBucket): Promise<string[]> => {
          const { data: objects, error } = await bucketObj.list(basePath, { limit: 100 })
          if (error) {
            console.warn('Storage list error at', basePath, error)
            return []
          }
          if (!objects || objects.length === 0) return []
          const urls: string[] = []
          for (const obj of objects) {
            // Skip folder placeholders (they usually have no metadata.size and may not be files)
            const isFolder = !obj.name?.includes('.') && (!obj.metadata || (obj.metadata as any)?.size == null)
            if (isFolder) continue
            const { data: pub } = bucketObj.getPublicUrl(`${basePath}/${obj.name}`)
            if (pub?.publicUrl) urls.push(pub.publicUrl)
          }
          return urls
        }

        // Candidate paths to check
        const candidates = [
          `${expense.user_id}/${expense.id}`, // current convention
          `${expense.id}`,                    // legacy: only expense folder
        ]

        let found: string[] = []
        
        // Check in the old bucket first
        for (const p of candidates) {
          found = await listUrlsAt(p, oldBucket)
          if (found.length > 0) {
            console.log('✅ Found files in old bucket at path:', p);
            break;
          }
        }

        // If not found in old bucket, try in the new bucket
        if (found.length === 0) {
          console.log('🔍 Checking new bucket for files...');
          for (const p of candidates) {
            found = await listUrlsAt(p, newBucket)
            if (found.length > 0) {
              console.log('✅ Found files in new bucket at path:', p);
              break;
            }
          }
        }

        // If still not found, try scanning user folder in both buckets
        if (found.length === 0) {
          const userFolder = `${expense.user_id}`
          
          // Check old bucket
          const { data: userChildrenOld } = await oldBucket.list(userFolder, { limit: 100 })
          const hasExpenseSubdirOld = (userChildrenOld || []).some((o: any) => o.name === expense.id)
          if (hasExpenseSubdirOld) {
            found = await listUrlsAt(`${userFolder}/${expense.id}`, oldBucket)
            if (found.length > 0) {
              console.log('✅ Found files in old bucket user subfolder');
            }
          }
          
          // If still not found, check new bucket
          if (found.length === 0) {
            const { data: userChildrenNew } = await newBucket.list(userFolder, { limit: 100 })
            const hasExpenseSubdirNew = (userChildrenNew || []).some((o: any) => o.name === expense.id)
            if (hasExpenseSubdirNew) {
              found = await listUrlsAt(`${userFolder}/${expense.id}`, newBucket)
              if (found.length > 0) {
                console.log('✅ Found files in new bucket user subfolder');
              }
            }
          }
        }

        if (found.length > 0) {
          setFiles(found)
          // Persist back to expense for future fast loads
          try {
            await ExpenseService.updateExpense(expense.id!, expense.user_id, { file_urls: found } as any)
          } catch (e) {
            console.warn('Failed to persist file URLs to expense:', e)
          }
        }
      } catch (e) {
        console.warn('Fallback attachment load failed:', e)
      }
    })()
  }, [open, expense?.id, expense?.user_id, files.length])

  const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString()}`

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch {
      return dateString
    }
  }

  const calculateTotal = () => {
    const amount = expense.amount || 0
    const tax = expense.tax_amount || 0
    return amount + tax
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Financial Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
                </div>

                {expense.tax_amount && (
                  <div>
                    <p className="text-sm text-gray-500">Tax/GST Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(expense.tax_amount)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <Badge variant="outline" className="mt-1">
                    {expense.category}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(expense.expense_date)}
                  </p>
                </div>

                {expense.payment_method && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      {expense.payment_method}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Billing Status</p>
                  <Badge 
                    variant={expense.billable ? 'default' : 'secondary'}
                    className={expense.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {expense.billable ? 'Billable to Client' : 'Company Overhead'}
                  </Badge>
                </div>
              </div>

              {/* Total Display */}
              {expense.tax_amount && (
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-lg">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}

              {/* Simplified: no explicit billable amount breakdown */}
            </CardContent>
          </Card>

          {/* Description & Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description & Details
              </h4>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{expense.description}</p>
                </div>

                {expense.vendor && (
                  <div>
                    <p className="text-sm text-gray-500">Vendor/Supplier</p>
                    <p className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      {expense.vendor}
                    </p>
                  </div>
                )}

                {(() => { const notes = (expense as any).notes as string | undefined | null; return !!notes })() && (
                  <div>
                    <p className="text-sm text-gray-500">Additional Notes</p>
                    <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{(expense as any).notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project & Timeline */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Project & Timeline
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Linked Project</p>
                  <p className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {projectName ? projectName : expense.project_id ? `Project #${expense.project_id}` : 'No Project'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Linked Client</p>
                  <p className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    {clientName ? clientName : 'No Client'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatDate(expense.created_at || expense.expense_date)}
                  </p>
                </div>

                {expense.updated_at && expense.updated_at !== expense.created_at && (
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(expense.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files & Attachments */}
          <Card>
            <CardContent className="p-4">
              <FileAttachmentHandler
                files={files.map((url, index) => {
                  const fileName = url.split('/').pop() || `file-${index + 1}`;
                  
                  // Try to extract file path from URL for new bucket
                  let filePath: string | undefined;
                  if (url.includes('expense-documents-new')) {
                    const pathMatch = url.match(/expense-documents-new\/(.+)$/);
                    filePath = pathMatch ? pathMatch[1] : undefined;
                  } else if (url.includes('expense-documents')) {
                    const pathMatch = url.match(/expense-documents\/(.+)$/);
                    filePath = pathMatch ? pathMatch[1] : undefined;
                  }
                  
                  return {
                    id: `expense-${expense.id}-file-${index}`,
                    name: fileName,
                    storage_path: filePath,
                    url: url,
                    bucket: url.includes('expense-documents-new') ? 'expense-documents-new' : 'expense-documents'
                  };
                })}
                bucketName="expense-documents-new"
                title="Attachments"
                compact={true}
                showBatchActions={files.length > 1}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}