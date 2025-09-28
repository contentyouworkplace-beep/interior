/* Seed a comprehensive demo company settings bundle via the public API.
   Run while dev server is running. */

async function main() {
  const orgId = process.env.ORG_ID || '00000000-0000-0000-0000-000000000001'
  const base = process.env.BASE_URL || 'http://localhost:3000'

  const payload = {
    orgId,
    profile: {
      company_name: 'GoPLNR Demo Pvt Ltd',
      company_tagline: 'Plan. Design. Deliver.',
      email: 'contact@goplnr-demo.com',
      phone: '9876543210',
      website: 'https://demo.goplnr.com',
      address: '221B Baker Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      cin: 'U12345MH2025PTC123456'
    },
    banking: {
      bank_name: 'HDFC Bank',
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234'
    },
    branding: {
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'corporate',
      invoice_template: 'premium'
    }
  }

  console.log('POST', `${base}/api/company-settings`)
  const post = await fetch(`${base}/api/company-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const postJson = await post.json()
  console.log('POST status:', post.status)
  console.log(JSON.stringify(postJson, null, 2))

  console.log('\nGET', `${base}/api/company-settings?orgId=${orgId}`)
  const get = await fetch(`${base}/api/company-settings?orgId=${orgId}`)
  const getJson = await get.json()
  console.log('GET status:', get.status)
  console.log(JSON.stringify(getJson, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
