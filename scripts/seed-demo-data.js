import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Use service role key to bypass RLS for demo data seeding
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const DEMO_CLIENTS = [
  {
    first_name: 'Raj',
    last_name: 'Mehta',
    email: 'raj@tajpalace.com',
    phone: '+91-9876543210',
    company: 'Taj Palace Mumbai',
    address: '1 Apollo Bunder, Colaba',
    city: 'Mumbai',
    country: 'India'
  },
  {
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya@marinepenthouse.com',
    phone: '+91-9876543211',
    company: 'Marine Drive Penthouse',
    address: '15 Marine Drive',
    city: 'Mumbai',
    country: 'India'
  },
  {
    first_name: 'Ahmed',
    last_name: 'Al Maktoum',
    email: 'ahmed@burjalarab.ae',
    phone: '+971-50-1234567',
    company: 'Burj Al Arab',
    address: 'Jumeirah Beach',
    city: 'Dubai',
    country: 'UAE'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah@palmjumeirah.ae',
    phone: '+971-50-1234568',
    company: 'Palm Jumeirah Villa',
    address: 'Palm Jumeirah Frond A',
    city: 'Dubai',
    country: 'UAE'
  }
]

const DEMO_PROJECTS = [
  {
    name: 'Presidential Suite Renovation',
    description: 'Complete luxury renovation of the presidential suite with modern amenities',
    status: 'active',
    start_date: '2025-01-15',
    end_date: '2025-06-30',
    budget: 5000000,
    client_index: 0
  },
  {
    name: 'Penthouse Interior Design',
    description: 'Contemporary interior design for 4BHK penthouse with sea view',
    status: 'active',
    start_date: '2025-02-01',
    end_date: '2025-07-15',
    budget: 3500000,
    client_index: 1
  },
  {
    name: 'Royal Suite Upgrade',
    description: 'Luxury upgrade of royal suite with gold accents and premium materials',
    status: 'planning',
    start_date: '2025-03-01',
    end_date: '2025-08-30',
    budget: 8000000,
    client_index: 2
  },
  {
    name: 'Complete Home Makeover',
    description: 'Full interior design makeover of luxury villa',
    status: 'active',
    start_date: '2025-01-20',
    end_date: '2025-09-15',
    budget: 4500000,
    client_index: 3
  }
]

const DEMO_QUOTATIONS = [
  {
    quotation_number: 'QUO-2025-001',
    title: 'Presidential Suite Furniture & Decor',
    status: 'sent',
    issue_date: '2025-09-01',
    valid_until: '2025-10-01',
    subtotal: 850000,
    tax_rate: 18,
    tax_amount: 153000,
    total_amount: 1003000,
    currency: 'INR',
    notes: 'Premium quality furniture and luxury decor items for presidential suite',
    terms: 'Payment: 50% advance, 50% on completion. GST as applicable.',
    client_index: 0,
    project_index: 0
  },
  {
    quotation_number: 'QUO-2025-002',
    title: 'Penthouse Lighting & Electrical',
    status: 'draft',
    issue_date: '2025-09-05',
    valid_until: '2025-10-05',
    subtotal: 425000,
    tax_rate: 18,
    tax_amount: 76500,
    total_amount: 501500,
    currency: 'INR',
    notes: 'Smart home automation and designer lighting solutions',
    terms: 'Payment: 30% advance, 40% on material delivery, 30% on completion.',
    client_index: 1,
    project_index: 1
  },
  {
    quotation_number: 'QUO-2025-003',
    title: 'Royal Suite Gold Fixtures',
    status: 'approved',
    issue_date: '2025-09-10',
    valid_until: '2025-10-10',
    subtotal: 1200000,
    tax_rate: 18,
    tax_amount: 216000,
    total_amount: 1416000,
    currency: 'INR',
    notes: '24k gold plated fixtures and premium marble work',
    terms: 'Payment: 60% advance, 40% on completion. Custom import items non-refundable.',
    client_index: 2,
    project_index: 2
  }
]

const DEMO_INVOICES = [
  {
    invoice_number: 'INV-2025-001',
    title: 'Presidential Suite Phase 1 Completion',
    status: 'paid',
    issue_date: '2025-08-15',
    due_date: '2025-09-15',
    payment_date: '2025-09-10',
    subtotal: 425000,
    tax_rate: 18,
    tax_amount: 76500,
    total_amount: 501500,
    currency: 'INR',
    notes: 'Phase 1 completion - Furniture installation and basic decor',
    terms: 'Payment due within 30 days of invoice date.',
    client_index: 0,
    project_index: 0
  },
  {
    invoice_number: 'INV-2025-002',
    title: 'Penthouse Electrical Work',
    status: 'sent',
    issue_date: '2025-09-01',
    due_date: '2025-10-01',
    subtotal: 280000,
    tax_rate: 18,
    tax_amount: 50400,
    total_amount: 330400,
    currency: 'INR',
    notes: 'Complete electrical work and smart home setup',
    terms: 'Payment due within 30 days of invoice date.',
    client_index: 1,
    project_index: 1
  }
]

const QUOTATION_ITEMS = [
  // Items for QUO-2025-001
  [
    { description: 'Italian Leather Sofa Set (3+2+1)', quantity: 1, unit_price: 350000, total: 350000 },
    { description: 'Crystal Chandelier (Swarovski)', quantity: 2, unit_price: 150000, total: 300000 },
    { description: 'Marble Coffee Table', quantity: 1, unit_price: 80000, total: 80000 },
    { description: 'Persian Carpet (Handwoven)', quantity: 1, unit_price: 120000, total: 120000 }
  ],
  // Items for QUO-2025-002
  [
    { description: 'Smart Home Automation System', quantity: 1, unit_price: 180000, total: 180000 },
    { description: 'Designer LED Strip Lighting', quantity: 25, unit_price: 3500, total: 87500 },
    { description: 'Automated Curtain System', quantity: 8, unit_price: 12000, total: 96000 },
    { description: 'Premium Switches & Sockets', quantity: 35, unit_price: 1750, total: 61250 }
  ],
  // Items for QUO-2025-003
  [
    { description: '24K Gold Plated Door Handles', quantity: 12, unit_price: 25000, total: 300000 },
    { description: 'Italian Marble Flooring (sq ft)', quantity: 800, unit_price: 850, total: 680000 },
    { description: 'Crystal Bathroom Fixtures', quantity: 1, unit_price: 220000, total: 220000 }
  ]
]

const INVOICE_ITEMS = [
  // Items for INV-2025-001
  [
    { description: 'Italian Leather Sofa Set (3+2+1)', quantity: 1, unit_price: 350000, total: 350000 },
    { description: 'Marble Coffee Table', quantity: 1, unit_price: 75000, total: 75000 }
  ],
  // Items for INV-2025-002
  [
    { description: 'Smart Home Automation System', quantity: 1, unit_price: 180000, total: 180000 },
    { description: 'Designer LED Strip Lighting', quantity: 20, unit_price: 3500, total: 70000 },
    { description: 'Installation & Configuration', quantity: 1, unit_price: 30000, total: 30000 }
  ]
]

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seeding...')

    // First, create a demo user profile (this should match an authenticated user)
    // For demo purposes, let's create a profile entry
    const DEMO_USER_ID = '123e4567-e89b-12d3-a456-426614174000'
    
    console.log('👤 Creating demo user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: DEMO_USER_ID,
        first_name: 'Demo',
        last_name: 'User',
        company_name: 'Interior Design Studio',
        phone: '+91-9999999999',
        role: 'designer',
        designation: 'Lead Designer',
        department: 'Design',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (profileError) {
      console.log('⚠️ Profile creation result:', profileError)
      // Continue anyway as this might be due to auth.users constraint
    } else {
      console.log('✅ Demo user profile created')
    }

    // 1. Insert demo clients
    console.log('👥 Creating demo clients...')
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert(DEMO_CLIENTS.map(client => ({
        ...client,
        user_id: DEMO_USER_ID,
        created_at: new Date().toISOString()
      })))
      .select()

    if (clientError) {
      console.error('Error inserting clients:', clientError)
      return
    }
    console.log(`✅ Created ${clients.length} demo clients`)

    // 2. Insert demo projects
    console.log('📁 Creating demo projects...')
    const projectsWithClientIds = DEMO_PROJECTS.map(project => ({
      ...project,
      client_id: clients[project.client_index].id,
      user_id: DEMO_USER_ID,
      created_at: new Date().toISOString()
    }))

    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .insert(projectsWithClientIds)
      .select()

    if (projectError) {
      console.error('Error inserting projects:', projectError)
      return
    }
    console.log(`✅ Created ${projects.length} demo projects`)

    // 3. Insert demo quotations
    console.log('📋 Creating demo quotations...')
    const quotationsWithIds = DEMO_QUOTATIONS.map(quotation => ({
      ...quotation,
      client_id: clients[quotation.client_index].id,
      project_id: projects[quotation.project_index].id,
      user_id: DEMO_USER_ID,
      created_at: new Date().toISOString()
    }))

    const { data: quotations, error: quotationError } = await supabase
      .from('quotations')
      .insert(quotationsWithIds)
      .select()

    if (quotationError) {
      console.error('Error inserting quotations:', quotationError)
      return
    }
    console.log(`✅ Created ${quotations.length} demo quotations`)

    // 4. Insert demo invoices
    console.log('🧾 Creating demo invoices...')
    const invoicesWithIds = DEMO_INVOICES.map(invoice => ({
      ...invoice,
      client_id: clients[invoice.client_index].id,
      project_id: projects[invoice.project_index].id,
      user_id: DEMO_USER_ID,
      created_at: new Date().toISOString()
    }))

    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicesWithIds)
      .select()

    if (invoiceError) {
      console.error('Error inserting invoices:', invoiceError)
      return
    }
    console.log(`✅ Created ${invoices.length} demo invoices`)

    console.log('🎉 Demo data seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`  • ${clients.length} clients`)
    console.log(`  • ${projects.length} projects`)
    console.log(`  • ${quotations.length} quotations`)
    console.log(`  • ${invoices.length} invoices`)

  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
  }
}

seedDemoData()