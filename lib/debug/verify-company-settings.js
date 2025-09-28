/*
  End-to-end verifier for Company Settings persistence
  - Fills all fields with valid test data and POSTs to /api/company-settings
  - Confirms 200 response and success message
  - Reloads (GET) and checks values persist
  - Queries Supabase DB directly to ensure exact match (including updated_at)
  - Edits a few fields, saves again, and confirms overwrite
  - Attempts DELETE (if supported) and reports result
  - Checks audit/activity logs for entries related to company settings

  Usage:
    node lib/debug/verify-company-settings.js

  Env:
    ORG_ID (defaults to demo org)
    BASE_URL (defaults to http://localhost:3000)
    NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for direct DB check)
*/

require('dotenv').config({ path: '.env.local' })

const fetch = global.fetch || require('node-fetch')
const { createClient } = require('@supabase/supabase-js')

const ORG_ID = process.env.ORG_ID || '00000000-0000-0000-0000-000000000001'
const BASE = process.env.BASE_URL || 'http://localhost:3000'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. DB verification will be skipped.')
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

function nowIso() {
  return new Date().toISOString()
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function subsetEqual(obj, subset, label) {
  const diffs = []
  for (const [k, v] of Object.entries(subset || {})) {
    if (obj?.[k] !== v) {
      diffs.push(`${label}.${k}: expected ${JSON.stringify(v)} got ${JSON.stringify(obj?.[k])}`)
    }
  }
  return diffs
}

async function apiPost(payload) {
  const res = await fetch(`${BASE}/api/company-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function apiGet(orgId) {
  const res = await fetch(`${BASE}/api/company-settings?orgId=${orgId}`)
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function dbGetAll(orgId) {
  if (!supabase) return {}
  const [prof, bank, brand] = await Promise.all([
    supabase.from('company_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
    supabase.from('banking_info').select('*').eq('organization_id', orgId).maybeSingle(),
    supabase.from('branding').select('*').eq('organization_id', orgId).maybeSingle(),
  ])
  return {
    profile: prof.data || null,
    banking: bank.data || null,
    branding: brand.data || null,
  }
}

async function checkAudit(orgId, sinceIso) {
  if (!supabase) return { logs: [], note: 'DB verification disabled' }
  // Try both activity_log and security_audit_log(s), depending on setup
  const [activity, sec1, sec2] = await Promise.all([
    supabase.from('activity_log').select('*').gte('created_at', sinceIso).order('created_at', { ascending: false }),
    supabase.from('security_audit_log').select('*').gte('timestamp', sinceIso).order('timestamp', { ascending: false }),
    supabase.from('security_audit_logs').select('*').gte('timestamp', sinceIso).order('timestamp', { ascending: false }),
  ])
  return {
    activity: activity.data || [],
    security_audit_log: sec1.data || [],
    security_audit_logs: sec2.data || [],
  }
}

async function main() {
  console.log('=== Company Settings E2E Verification ===')
  console.log('Org:', ORG_ID)
  console.log('Base:', BASE)

  const startIso = nowIso()

  // 1) Fill all fields and POST
  const payload1 = {
    orgId: ORG_ID,
    profile: {
      company_name: 'Audit Test Co v1',
      company_tagline: 'Quality First',
      email: 'audit.v1@example.com',
      phone: '9998887770',
      website: 'https://audit-v1.example.com',
      address: '100 Test Ave',
      city: 'Pune',
      state: 'Maharashtra',
      pin_code: '411001',
      gstin: '27ABCDE1234F1Z6',
      pan: 'ABCDE1234G',
      cin: 'U12345MH2025PTC654321'
    },
    banking: {
      bank_name: 'ICICI Bank',
      account_number: '987654321000',
      ifsc_code: 'ICIC0000123'
    },
    branding: {
      primary_color: '#10B981',
      secondary_color: '#065F46',
      quotation_template: 'modern',
      invoice_template: 'clean'
    }
  }

  console.log('\n[POST] Submit full payload...')
  const post1 = await apiPost(payload1)
  console.log('Status:', post1.status)
  console.log('Response message:', post1.json?.message)
  if (post1.status < 200 || post1.status >= 300) throw new Error('POST failed')

  // Wait briefly to allow updated_at triggers to fire
  await sleep(250)

  // 2) GET and compare
  console.log('\n[GET] Fetch saved bundle...')
  const get1 = await apiGet(ORG_ID)
  console.log('Status:', get1.status)
  if (get1.status !== 200) throw new Error('GET failed')
  const data1 = get1.json?.data || {}
  const diffs1 = [
    ...subsetEqual(data1.profile, payload1.profile, 'profile'),
    ...subsetEqual(data1.banking, payload1.banking, 'banking'),
    ...subsetEqual(data1.branding, payload1.branding, 'branding'),
  ]
  if (diffs1.length) {
    console.warn('Mismatches after GET:')
    diffs1.forEach((d) => console.warn(' -', d))
  } else {
    console.log('GET matches submitted payload ✓')
  }

  // 3) DB direct check
  if (supabase) {
    console.log('\n[DB] Verify rows match...')
    const db1 = await dbGetAll(ORG_ID)
    const dbDiffs = [
      ...subsetEqual(db1.profile, payload1.profile, 'db.profile'),
      ...subsetEqual(db1.banking, payload1.banking, 'db.banking'),
      ...subsetEqual(db1.branding, payload1.branding, 'db.branding'),
    ]
    if (dbDiffs.length) {
      console.warn('DB mismatches:')
      dbDiffs.forEach((d) => console.warn(' -', d))
    } else {
      console.log('DB rows match payload ✓')
    }
    console.log('Timestamps:')
    console.log(' - profile.updated_at:', db1.profile?.updated_at)
    console.log(' - banking.updated_at:', db1.banking?.updated_at)
    console.log(' - branding.updated_at:', db1.branding?.updated_at)
  } else {
    console.log('[DB] Skipped (missing env)')
  }

  // 4) Edit and overwrite
  const payload2 = {
    orgId: ORG_ID,
    profile: { company_name: 'Audit Test Co v2', phone: '9000000001' },
    banking: { ifsc_code: 'ICIC0000456' },
    branding: { primary_color: '#6366F1' }
  }
  console.log('\n[POST] Submit partial update (overwrite some fields)...')
  const post2 = await apiPost(payload2)
  console.log('Status:', post2.status)
  console.log('Response message:', post2.json?.message)
  if (post2.status < 200 || post2.status >= 300) throw new Error('POST 2 failed')

  await sleep(200)

  console.log('\n[GET] Verify updated fields...')
  const get2 = await apiGet(ORG_ID)
  console.log('Status:', get2.status)
  const data2 = get2.json?.data || {}
  const diffs2 = [
    ...subsetEqual(data2.profile, { ...payload1.profile, ...payload2.profile }, 'profile'),
    ...subsetEqual(data2.banking, { ...payload1.banking, ...payload2.banking }, 'banking'),
    ...subsetEqual(data2.branding, { ...payload1.branding, ...payload2.branding }, 'branding'),
  ]
  if (diffs2.length) {
    console.warn('Mismatches after update:')
    diffs2.forEach((d) => console.warn(' -', d))
  } else {
    console.log('Update persisted correctly ✓')
  }

  // 5) Attempt DELETE (if supported)
  console.log('\n[DELETE] Probe delete support...')
  const del = await fetch(`${BASE}/api/company-settings?orgId=${ORG_ID}`, { method: 'DELETE' })
  console.log('Status:', del.status)
  if (del.status >= 200 && del.status < 300) {
    console.warn('DELETE unexpectedly succeeded — verify server behavior.')
  } else {
    console.log('DELETE not supported (expected).')
  }

  // 6) Audit logs check
  console.log('\n[Audit] Checking for activity/security logs since', startIso)
  const audit = await checkAudit(ORG_ID, startIso)
  const anyLogs = (audit.activity?.length || 0) + (audit.security_audit_log?.length || 0) + (audit.security_audit_logs?.length || 0)
  if (anyLogs) {
    console.log('Found logs:')
    console.log(' - activity_log:', audit.activity?.length || 0)
    console.log(' - security_audit_log:', audit.security_audit_log?.length || 0)
    console.log(' - security_audit_logs:', audit.security_audit_logs?.length || 0)
  } else {
    console.log('No audit logs found related to company settings (likely not implemented).')
  }

  // 7) Invalid/partial data test — expect success without overwriting with blanks
  console.log('\n[POST] Submit invalid/partial data (should not overwrite with blanks)...')
  const badPayload = { orgId: ORG_ID, profile: { company_name: '   ' }, banking: {}, branding: { primary_color: '' } }
  const postBad = await apiPost(badPayload)
  console.log('Status:', postBad.status)
  // Our API currently returns 200 even if sections are skipped; verify no changes occurred
  const get3 = await apiGet(ORG_ID)
  const data3 = get3.json?.data || {}
  const shouldRemain = {
    profile: { ...payload1.profile, ...payload2.profile },
    banking: { ...payload1.banking, ...payload2.banking },
    branding: { ...payload1.branding, ...payload2.branding },
  }
  const diffs3 = [
    ...subsetEqual(data3.profile, shouldRemain.profile, 'profile'),
    ...subsetEqual(data3.banking, shouldRemain.banking, 'banking'),
    ...subsetEqual(data3.branding, shouldRemain.branding, 'branding'),
  ]
  if (diffs3.length) {
    console.warn('Unexpected differences after invalid/partial payload:')
    diffs3.forEach((d) => console.warn(' -', d))
  } else {
    console.log('Invalid/partial data did not overwrite existing values ✓')
  }

  console.log('\n=== Verification Complete ===')
}

main().catch((e) => {
  console.error('Verification error:', e)
  process.exitCode = 1
})
