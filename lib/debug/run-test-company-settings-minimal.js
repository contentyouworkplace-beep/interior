/*
  Minimal e2e-like test for the Company Settings UI flow
  - Sends a partial update (profile only) to /api/company-settings
  - Then fetches the saved bundle and prints it
  - Intended to validate that client-side change (omitting empty sections) works with server
*/

async function main() {
  const orgId = process.env.ORG_ID || '00000000-0000-0000-0000-000000000001'
  const base = process.env.BASE_URL || 'http://localhost:3000'
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const testName = `UI-Test Co ${ts}`

  console.log('PATCH-like POST to', `${base}/api/company-settings`)
  console.log('Setting company_name =', testName)

  const postRes = await fetch(`${base}/api/company-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      profile: {
        company_name: testName
      }
    })
  })

  const postJson = await postRes.json()
  console.log('POST status:', postRes.status)
  console.log('POST response:', JSON.stringify(postJson, null, 2))

  console.log('\nGET saved bundle')
  const getRes = await fetch(`${base}/api/company-settings?orgId=${orgId}`)
  const getJson = await getRes.json()
  console.log('GET status:', getRes.status)
  console.log('GET response:', JSON.stringify(getJson, null, 2))

  const savedName = getJson?.data?.profile?.company_name
  if (savedName === testName) {
    console.log('\nResult: PASS — persisted company_name matches the update.')
  } else {
    console.log('\nResult: FAIL — expected company_name to equal the update, got:', savedName)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('Test error:', err)
  process.exitCode = 1
})
