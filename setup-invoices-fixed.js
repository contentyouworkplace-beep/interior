const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupInvoices() {
  console.log('🚀 Setting up invoice database...')
  
  try {
    // Get a user ID for demo data
    const { data: authData } = await supabase.auth.getUser()
    let userId = authData?.user?.id
    
    if (!userId) {
      // Try to get any user from profiles table
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
      userId = profiles?.[0]?.id
    }
    
    if (!userId) {
      console.log('⚠️ No users found, checking clients table for user references...')
      const { data: clients } = await supabase.from('clients').select('user_id').limit(1)
      userId = clients?.[0]?.user_id
    }
    
    if (!userId) {
      console.log('❌ No user ID found. Please ensure you have authenticated or have existing data.')
      return
    }
    
    console.log(`📤 Using user ID: ${userId}`)
    
    // Check if demo invoices already exist
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (existingInvoices && existingInvoices.length > 0) {
      console.log('✅ Demo invoices already exist')
      
      // Show existing invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          invoice_number,
          title,
          status,
          total_amount,
          client:clients(first_name, last_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log(`📋 Found ${invoices?.length || 0} existing invoices:`)
      invoices?.forEach(inv => {
        const clientName = inv.client ? `${inv.client.first_name} ${inv.client.last_name}` : 'No Client'
        console.log(`  📄 ${inv.invoice_number}: ${inv.title} (${inv.status}) - ₹${inv.total_amount} - ${clientName}`)
      })
      return
    }
    
    // Get or create demo clients
    let { data: clients } = await supabase
      .from('clients')
      .select('id, email, first_name, last_name')
      .eq('user_id', userId)
      .limit(3)
    
    if (!clients || clients.length === 0) {
      console.log('📝 Creating demo clients...')
      const { data: newClients, error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            user_id: userId,
            first_name: 'Rajesh',
            last_name: 'Kumar', 
            company: 'Kumar Enterprises',
            email: 'rajesh.kumar@demo.com',
            phone: '+91-9876543210',
            address: '123 Business Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          },
          {
            user_id: userId,
            first_name: 'Priya',
            last_name: 'Sharma',
            company: 'Sharma Interiors', 
            email: 'priya.sharma@demo.com',
            phone: '+91-9876543211',
            address: '456 Design Avenue',
            city: 'Delhi', 
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          },
          {
            user_id: userId,
            first_name: 'Amit',
            last_name: 'Patel',
            company: 'Patel Home Solutions',
            email: 'amit.patel@demo.com', 
            phone: '+91-9876543212',
            address: '789 Home Street',
            city: 'Bangalore',
            state: 'Karnataka', 
            pincode: '560001',
            country: 'India'
          }
        ])
        .select('id, email, first_name, last_name')
      
      if (clientError) {
        console.error('❌ Error creating clients:', clientError)
        return
      }
      
      clients = newClients || []
      console.log(`✅ Created ${clients.length} demo clients`)
    }
    
    if (clients.length === 0) {
      console.log('❌ Could not create or find clients')
      return
    }
    
    // Create demo invoices
    console.log('📝 Creating demo invoices...')
    const today = new Date()
    const pastDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days future
    
    const demoInvoices = [
      {
        user_id: userId,
        client_id: clients[0].id,
        invoice_number: 'INV-2024-001',
        title: 'Living Room Design - Phase 1',
        status: 'paid',
        issue_date: pastDate.toISOString().split('T')[0],
        due_date: today.toISOString().split('T')[0],
        subtotal: 84745.76,
        tax_rate: 18.0,
        tax_amount: 15254.24,
        total_amount: 100000.00,
        currency: 'INR',
        notes: 'Thank you for your business. Payment received on time.',
        payment_terms: 'Payment due within 30 days. Late payments may incur additional charges.'
      },
      {
        user_id: userId,
        client_id: clients[1]?.id || clients[0].id,
        invoice_number: 'INV-2024-002', 
        title: 'Office Interior - Furniture Supply',
        status: 'sent',
        issue_date: pastDate.toISOString().split('T')[0],
        due_date: futureDate.toISOString().split('T')[0],
        subtotal: 59322.03,
        tax_rate: 18.0,
        tax_amount: 10677.97,
        total_amount: 70000.00,
        currency: 'INR',
        notes: 'Invoice for office furniture supply and installation.',
        payment_terms: 'Payment due within 30 days. 5% discount applied for early confirmation.'
      },
      {
        user_id: userId,
        client_id: clients[2]?.id || clients[0].id,
        invoice_number: 'INV-2024-003',
        title: 'Consultation and Design Planning', 
        status: 'sent',
        issue_date: today.toISOString().split('T')[0],
        due_date: futureDate.toISOString().split('T')[0],
        subtotal: 42372.88,
        tax_rate: 18.0,
        tax_amount: 7627.12,
        total_amount: 50000.00,
        currency: 'INR',
        notes: 'Consultation fee for home interior design planning.',
        payment_terms: 'Balance payment due within 30 days.'
      },
      {
        user_id: userId,
        client_id: clients[0].id,
        invoice_number: 'INV-2024-004',
        title: 'Living Room Design - Final Phase',
        status: 'draft', 
        issue_date: today.toISOString().split('T')[0],
        due_date: futureDate.toISOString().split('T')[0],
        subtotal: 127118.64,
        tax_rate: 18.0,
        tax_amount: 22881.36,
        total_amount: 150000.00,
        currency: 'INR',
        notes: 'Final phase invoice for living room design project.',
        payment_terms: 'Payment due within 30 days.'
      },
      {
        user_id: userId,
        client_id: clients[1]?.id || clients[0].id,
        invoice_number: 'INV-2024-005',
        title: 'Additional Design Services',
        status: 'draft',
        issue_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days ago
        due_date: pastDate.toISOString().split('T')[0],
        subtotal: 25423.73,
        tax_rate: 18.0,
        tax_amount: 4576.27,
        total_amount: 30000.00,
        currency: 'INR',
        notes: 'Additional design consultation services.',
        payment_terms: 'Payment required within 30 days.'
      }
    ]
    
    const { data: createdInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(demoInvoices)
      .select('id, invoice_number')
    
    if (invoiceError) {
      console.error('❌ Error creating invoices:', invoiceError)
      return
    }
    
    console.log(`✅ Created ${createdInvoices?.length || 0} demo invoices`)
    
    // Add items to invoices
    console.log('📝 Adding invoice items...')
    if (createdInvoices && createdInvoices.length > 0) {
      const items = [
        // Items for invoice 1 (INV-2024-001) 
        {
          invoice_id: createdInvoices[0].id,
          description: 'Premium Sofa Set - 3+2 seater',
          quantity: 1,
          unit_price: 45000.00,
          amount: 45000.00,
          item_order: 1
        },
        {
          invoice_id: createdInvoices[0].id,
          description: 'Designer Coffee Table - Marble Top',
          quantity: 1,
          unit_price: 18000.00,
          amount: 18000.00,
          item_order: 2
        },
        {
          invoice_id: createdInvoices[0].id,
          description: 'Custom Lighting Setup',
          quantity: 1,
          unit_price: 12000.00,
          amount: 12000.00,
          item_order: 3
        },
        {
          invoice_id: createdInvoices[0].id,
          description: 'Wall Art and Decor Items',
          quantity: 1,
          unit_price: 9745.76,
          amount: 9745.76,
          item_order: 4
        },
        
        // Items for invoice 2 (INV-2024-002)
        {
          invoice_id: createdInvoices[1]?.id || createdInvoices[0].id,
          description: 'Executive Office Desk',
          quantity: 3,
          unit_price: 15000.00,
          amount: 45000.00,
          item_order: 1
        },
        {
          invoice_id: createdInvoices[1]?.id || createdInvoices[0].id,
          description: 'Ergonomic Office Chairs',
          quantity: 6,
          unit_price: 8000.00,
          amount: 48000.00,
          item_order: 2
        },
        
        // Items for invoice 3 (INV-2024-003)
        {
          invoice_id: createdInvoices[2]?.id || createdInvoices[0].id,
          description: 'Design Consultation - 8 hours',
          quantity: 8,
          unit_price: 2500.00,
          amount: 20000.00,
          item_order: 1
        },
        {
          invoice_id: createdInvoices[2]?.id || createdInvoices[0].id,
          description: '3D Design Visualization',
          quantity: 1,
          unit_price: 15000.00,
          amount: 15000.00,
          item_order: 2
        },
        
        // Items for invoice 4 (INV-2024-004)
        {
          invoice_id: createdInvoices[3]?.id || createdInvoices[0].id,
          description: 'Premium Bedroom Set',
          quantity: 1,
          unit_price: 65000.00,
          amount: 65000.00,
          item_order: 1
        },
        {
          invoice_id: createdInvoices[3]?.id || createdInvoices[0].id,
          description: 'Custom Wardrobe Installation',
          quantity: 1,
          unit_price: 35000.00,
          amount: 35000.00,
          item_order: 2
        },
        
        // Items for invoice 5 (INV-2024-005)
        {
          invoice_id: createdInvoices[4]?.id || createdInvoices[0].id,
          description: 'Additional Design Consultation',
          quantity: 4,
          unit_price: 3000.00,
          amount: 12000.00,
          item_order: 1
        },
        {
          invoice_id: createdInvoices[4]?.id || createdInvoices[0].id,
          description: 'Site Visits and Measurements',
          quantity: 2,
          unit_price: 1500.00,
          amount: 3000.00,
          item_order: 2
        }
      ]
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items)
      
      if (itemsError) {
        console.warn('⚠️ Error adding items:', itemsError.message)
      } else {
        console.log(`✅ Added ${items.length} invoice items`)
      }
    }
    
    // Verify the final data
    const { data: finalInvoices } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        title, 
        status,
        total_amount,
        client:clients(first_name, last_name),
        items:invoice_items(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    console.log('\n📋 Demo invoices created successfully:')
    finalInvoices?.forEach(inv => {
      const clientName = inv.client ? `${inv.client.first_name} ${inv.client.last_name}` : 'No Client'
      const itemCount = inv.items?.length || 0
      console.log(`  📄 ${inv.invoice_number}: ${inv.title} (${inv.status}) - ₹${inv.total_amount} - ${clientName} - ${itemCount} items`)
    })
    
    console.log('\n🎉 Invoice setup completed successfully!')
    console.log('💡 You can now view your invoices in the app at /invoices')
    
  } catch (error) {
    console.error('❌ Setup error:', error)
  }
}

setupInvoices()