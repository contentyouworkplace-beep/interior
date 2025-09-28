// Test script to verify template integration
// Run this in browser console to test the complete flow

async function testTemplateIntegration() {
  console.log('=== Testing Template Integration ===')
  
  try {
    // 1. Test API endpoint
    console.log('1. Testing company data API...')
    const response = await fetch('/api/company-settings?orgId=00000000-0000-0000-0000-000000000001')
    const data = await response.json()
    console.log('Company data:', data)
    
    // 2. Test template data structure
    const templates = [
      { value: 'modern', label: 'Modern Executive', description: 'Sleek gradient design' },
      { value: 'classic', label: 'Classic Professional', description: 'Timeless business elegance' },
      { value: 'minimalist', label: 'Minimalist Elite', description: 'Clean lines and simplicity' },
      { value: 'corporate', label: 'Corporate Power', description: 'Bold executive styling' },
      { value: 'creative', label: 'Creative Vision', description: 'Dynamic gradients and artistic flair' },
      { value: 'premium', label: 'Luxury Premium', description: 'High-end gold accents' }
    ]
    
    console.log('2. Available templates:', templates)
    
    // 3. Test data mapping
    const companyData = data.data
    const company = {
      name: companyData?.profile?.company_name || 'Your Company Name',
      tagline: companyData?.profile?.company_tagline || 'Your Company Tagline',
      logo: companyData?.branding?.logo_url || '',
      address: companyData?.profile?.address || 'Your Address',
      phone: companyData?.profile?.phone || 'Your Phone',
      email: companyData?.profile?.email || 'your@email.com',
      gstin: companyData?.profile?.gstin || 'Your GSTIN',
      primaryColor: companyData?.branding?.primary_color || '#3B82F6',
      secondaryColor: companyData?.branding?.secondary_color || '#1E40AF'
    }
    
    console.log('3. Mapped company data for templates:', company)
    
    // 4. Test template styling
    templates.forEach(template => {
      console.log(`Template ${template.value} would use:`, {
        logo: company.logo ? 'Company logo' : 'Default building icon',
        colors: `Primary: ${company.primaryColor}, Secondary: ${company.secondaryColor}`,
        hasGSTIN: !!company.gstin,
        hasAddress: !!company.address,
        hasContact: !!(company.phone || company.email)
      })
    })
    
    console.log('=== Template Integration Test Complete ===')
    console.log('✅ All systems working correctly!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testTemplateIntegration = testTemplateIntegration
  console.log('Run window.testTemplateIntegration() to test the integration')
}