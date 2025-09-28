// Force Node.js runtime (PDFKit requires Node APIs)
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { fetchComprehensiveReports } from '@/lib/services/supabase/reports'
// pdfkit has no built-in ESM types in this project; use require dynamically
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit')

function docToBuffer(doc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') || 'month') as any
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const data = await fetchComprehensiveReports({ period, from, to })

    const doc = new PDFDocument({ margin: 40 })

    doc.fontSize(18).text('Business Reports', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#555').text(`Period: ${period}${from ? ` (${from} -> ${to})` : ''}`)
    doc.moveDown(1)

    // Profitability Table (summarized)
    doc.fontSize(14).fillColor('#000').text('Project Profitability')
    doc.moveDown(0.5)
    const header = 'Project            Invoiced   Paid   Expenses   Margin%'
    doc.font('Helvetica-Bold').fontSize(9).text(header)
    doc.font('Helvetica').fillColor('#000')
    data.profitability.slice(0, 40).forEach(p => {
      const line = `${(p.project_name || 'Unnamed').padEnd(18).slice(0,18)} ${p.total_invoiced.toFixed(0).padStart(8)} ${p.total_paid.toFixed(0).padStart(7)} ${p.total_expenses.toFixed(0).padStart(10)} ${p.margin_percent.toFixed(1).padStart(7)}`
      doc.fontSize(8).text(line)
    })
    doc.moveDown(1)

    // Pending Payments
    doc.fontSize(14).text('Pending Payments')
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').fontSize(9).text('Client ID        Invoiced   Paid   Balance')
    doc.font('Helvetica')
    data.pendingPayments.slice(0, 50).forEach(r => {
      const bal = (r.total_invoiced - r.total_paid)
      const line = `${r.client_id.slice(0,14).padEnd(16)} ${r.total_invoiced.toFixed(0).padStart(8)} ${r.total_paid.toFixed(0).padStart(7)} ${bal.toFixed(0).padStart(8)}`
      doc.fontSize(8).text(line)
    })
    doc.moveDown(1)

    // Lead Conversion
    const lc = data.leadConversion
    doc.fontSize(14).text('Lead Conversion Summary')
    doc.moveDown(0.5)
    doc.fontSize(10).text(`Total: ${lc.total_leads}  Won: ${lc.won}  Lost: ${lc.lost}  Active: ${lc.active_pipeline}  Conversion: ${lc.conversion_rate_percent}%`)

    const buffer = await docToBuffer(doc)
    const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    // Cast to any to satisfy BodyInit; Node.js Response supports Buffer
    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="reports.pdf"'
      }
    })
  } catch (e: any) {
    return new Response(e.message, { status: 500 })
  }
}
