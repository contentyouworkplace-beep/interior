import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient()

async function seedDemoData() {
  // Demo clients
  const clients = [
    {
      id: uuidv4(),
      user_id: 'demo-user',
      first_name: 'Amit',
      last_name: 'Sharma',
      email: 'amit.sharma@example.com',
      phone: '+919876543210',
      alt_phone: '+919812345678',
      company: 'Sharma Interiors',
      city: 'Mumbai',
      country: 'India',
      client_type: 'residential',
      status: 'active',
      budget_range: '10L-20L',
      preferred_style: 'Modern',
      notes: 'Prefers eco-friendly materials.',
      website: 'sharmainteriors.in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      user_id: 'demo-user',
      first_name: 'Priya',
      last_name: 'Menon',
      email: 'priya.menon@example.com',
      phone: '+919812345678',
      alt_phone: null,
      company: 'Menon Designs',
      city: 'Bangalore',
      country: 'India',
      client_type: 'commercial',
      status: 'active',
      budget_range: '20L-50L',
      preferred_style: 'Minimalist',
      notes: 'Wants open office layout.',
      website: 'menondesigns.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      user_id: 'demo-user',
      first_name: 'Rahul',
      last_name: 'Patel',
      email: 'rahul.patel@example.com',
      phone: '+919900112233',
      alt_phone: null,
      company: null,
      city: 'Ahmedabad',
      country: 'India',
      client_type: 'residential',
      status: 'inactive',
      budget_range: '5L-10L',
      preferred_style: 'Traditional',
      notes: 'Needs Vastu compliance.',
      website: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  // Insert clients
  await supabase.from('clients').insert(clients)

  // You can add similar demo data for projects, team, vendors, expenses, etc.
  // Example for projects:
  // const projects = [...]
  // await supabase.from('projects').insert(projects)

  console.log('Demo data seeded!')
}

seedDemoData().catch(console.error)
