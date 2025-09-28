#!/usr/bin/env node

// Demo clients data insertion script

const demoClients = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91-9876543210',
    company: 'Kumar Enterprises',
    clientType: 'business',
    address: '123 MG Road',
    city: 'Mumbai',
    country: 'India',
    budgetRange: '15-25 Lakhs',
    preferredStyle: 'Modern',
    website: 'https://kumarenterprises.com',
    notes: 'Interested in complete home interior for 3BHK apartment'
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-9123456789',
    company: '',
    clientType: 'individual',
    address: '456 Park Street',
    city: 'Delhi',
    country: 'India',
    budgetRange: '10-15 Lakhs',
    preferredStyle: 'Contemporary',
    notes: 'Looking for living room and bedroom design'
  },
  {
    firstName: 'Amit',
    lastName: 'Patel',
    email: 'amit.patel@email.com',
    phone: '+91-9555666777',
    altPhone: '+91-9444555666',
    company: 'Patel Industries',
    clientType: 'corporate',
    address: '789 Commercial Complex',
    city: 'Bangalore',
    country: 'India',
    budgetRange: '50+ Lakhs',
    preferredStyle: 'Industrial',
    website: 'https://patelindustries.com',
    notes: 'Office space interior design for 5000 sq ft area'
  },
  {
    firstName: 'Sneha',
    lastName: 'Gupta',
    email: 'sneha.gupta@email.com',
    phone: '+91-9888777666',
    company: '',
    clientType: 'individual',
    address: '321 Green Avenue',
    city: 'Pune',
    country: 'India',
    budgetRange: '5-10 Lakhs',
    preferredStyle: 'Minimalist',
    notes: 'Small apartment makeover, budget conscious'
  },
  {
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@email.com',
    phone: '+91-9777888999',
    company: 'Singh Hotels',
    clientType: 'business',
    address: '567 Hotel District',
    city: 'Jaipur',
    country: 'India',
    budgetRange: '25-50 Lakhs',
    preferredStyle: 'Traditional',
    website: 'https://singhhotels.com',
    notes: 'Boutique hotel interior design for 20 rooms'
  }
];

async function addDemoClients() {
  console.log('🎯 Adding demo clients to the CRM...')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  for (let i = 0; i < demoClients.length; i++) {
    const client = demoClients[i]
    
    try {
      console.log(`📝 Adding client ${i + 1}/${demoClients.length}: ${client.firstName} ${client.lastName}`)
      
      const response = await fetch(`${baseUrl}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Successfully added ${client.firstName} ${client.lastName}`)
      } else {
        console.log(`❌ Failed to add ${client.firstName} ${client.lastName}: ${result.error}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.log(`❌ Error adding ${client.firstName} ${client.lastName}:`, error)
    }
  }
  
  console.log('🎉 Demo client creation complete!')
  console.log('💡 You can now view them at http://localhost:3000/clients')
}

// Run if called directly
if (require.main === module) {
  addDemoClients().catch(console.error)
}

module.exports = { addDemoClients, demoClients }