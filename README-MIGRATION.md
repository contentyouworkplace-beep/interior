# Invoice items migration & testing

Small instructions to apply the migration that adds missing columns to `invoice_items` and how to test locally.

1) Inspect the migration SQL

  - File: `migrations/2025-09-25-fix-invoice-items-table.sql`
  - It safely adds `tax_rate`, `tax_amount`, `item_order`, and `hsn_sac_code` if they don't exist.

2) Recommended: Run in Supabase SQL Editor

  - Open your Supabase project.
  - Go to SQL Editor and create a new query.
  - Paste contents of `migrations/2025-09-25-fix-invoice-items-table.sql` and run it.

3) Optional: Run locally with service role key

  - Ensure you have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in your environment or in a `.env` file.
  - Install dependencies if necessary:
    - `pnpm install` or `npm install`
  - Run the helper script:
    - `node scripts/run-fix-invoice-items-table.js`

4) Recreate or update an invoice with items

  - Use the app to create a new invoice and add items.
  - Watch the server console for these debug logs (added in service files):
    - `CreateInvoiceDialogMinimal - Adding items to invoice:`
    - `InvoiceService.addInvoiceItem - Adding item:`
    - `InvoiceService.getInvoiceById - Raw data:`
    - `PDF Service - Invoice items:`

5) Re-download the PDF and confirm items appear.

6) If items still don't appear, capture the server console logs for those messages and share them.

Notes
-----
- Running the migration from this repository requires a service role key. It's usually safer and faster to use the Supabase SQL editor directly.
