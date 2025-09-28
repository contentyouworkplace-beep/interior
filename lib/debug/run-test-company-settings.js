(async () => {
  try {
    const url = 'http://localhost:3000/api/company-settings'
    const payload = {
      orgId: '00000000-0000-0000-0000-000000000001',
      profile: {
        company_name: 'Test Company Node',
        company_tagline: 'Node test tagline',
        email: 'node-test@example.com',
        phone: '9876543210',
        address: '123 Node St',
        city: 'NodeCity',
        state: 'NodeState',
        pin_code: '400001',
        website: 'https://node.example.com',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F'
      },
      banking: {
        bank_name: 'Node Bank',
        account_number: '123456789012',
        ifsc_code: 'NODE0001234'
      },
      branding: {
        primary_color: '#00AAFF',
        secondary_color: '#FFAA00',
        quotation_template: 'corporate',
        invoice_template: 'premium'
      }
    }

    console.log('Posting payload to', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const body = await res.text()
    let parsed = null
    try { parsed = JSON.parse(body) } catch (e) { parsed = body }

    console.log('Status:', res.status)
    console.log('Response:', parsed)

    // Also GET the saved bundle
    const getUrl = `http://localhost:3000/api/company-settings?orgId=${payload.orgId}`
    console.log('\nFetching saved bundle from', getUrl)
    const getRes = await fetch(getUrl)
    const getBody = await getRes.json()
    console.log('GET status:', getRes.status)
    console.log('GET response:', getBody)

    process.exit(0)
  } catch (err) {
    console.error('Test script failed:', err)
    process.exit(2)
  }
})()
