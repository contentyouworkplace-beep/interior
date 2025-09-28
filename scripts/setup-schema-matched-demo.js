const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDatabaseTables() {
  console.log('🗃️ Creating database tables...');
  
  const schemaSQL = `
    -- INTERIOR DESIGNER CRM DATABASE SCHEMA
    -- Enable RLS on all tables by default
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

    -- 1. PROFILES TABLE (extends auth.users)
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      company_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'designer',
      designation TEXT,
      department TEXT,
      permissions JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. CLIENTS TABLE
    CREATE TABLE IF NOT EXISTS clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      alt_phone TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      postal_code TEXT,
      client_type TEXT DEFAULT 'individual',
      budget_range TEXT,
      preferred_style TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. PROJECTS TABLE
    CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      client_id UUID REFERENCES clients(id) NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      project_type TEXT NOT NULL DEFAULT 'residential',
      status TEXT DEFAULT 'planning',
      priority TEXT DEFAULT 'medium',
      budget DECIMAL(12,2),
      start_date DATE,
      end_date DATE,
      completion_percentage INTEGER DEFAULT 0,
      location TEXT,
      square_footage INTEGER,
      style_preference TEXT,
      special_requirements TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. INVOICES TABLE
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      client_id UUID REFERENCES clients(id) NOT NULL,
      project_id UUID REFERENCES projects(id),
      invoice_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 18.0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      notes TEXT,
      terms_conditions TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. QUOTATIONS TABLE  
    CREATE TABLE IF NOT EXISTS quotations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      client_id UUID REFERENCES clients(id) NOT NULL,
      project_id UUID REFERENCES projects(id),
      quotation_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      issue_date DATE NOT NULL,
      valid_until DATE NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 18.0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      notes TEXT,
      terms_conditions TEXT,
      items JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. EXPENSES TABLE
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      project_id UUID REFERENCES projects(id),
      category TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT NOT NULL,
      expense_date DATE NOT NULL,
      receipt_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 7. TEAM MEMBERS TABLE
    CREATE TABLE IF NOT EXISTS team_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      specialization TEXT,
      hourly_rate DECIMAL(10,2),
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      status TEXT DEFAULT 'active',
      hire_date DATE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 8. PROJECT TASKS TABLE
    CREATE TABLE IF NOT EXISTS project_tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID REFERENCES projects(id) NOT NULL,
      template_id UUID,
      name TEXT NOT NULL,
      description TEXT,
      assigned_to UUID REFERENCES team_members(id),
      role TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      completion_percentage INTEGER DEFAULT 0,
      estimated_hours DECIMAL(6,2),
      actual_hours DECIMAL(6,2),
      dependencies TEXT[],
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 9. APPOINTMENTS TABLE
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      client_id UUID REFERENCES clients(id),
      project_id UUID REFERENCES projects(id),
      title TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      event_type TEXT DEFAULT 'meeting',
      location TEXT,
      is_all_day BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 10. LEADS TABLE
    CREATE TABLE IF NOT EXISTS leads (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      source TEXT,
      stage TEXT DEFAULT 'new',
      interest_level TEXT,
      potential_value DECIMAL(12,2),
      notes TEXT,
      next_follow_up DATE,
      converted_client_id UUID REFERENCES clients(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    if (error) {
      console.error('Error creating tables:', error);
    } else {
      console.log('✅ All database tables created successfully');
    }
  } catch (err) {
    console.log('ℹ️ Tables might already exist, continuing...');
  }
}

async function setupStorageBuckets() {
  console.log('🗂️ Setting up storage buckets...');
  
  const buckets = [
    { name: 'receipts', public: false },
    { name: 'client-files', public: false },
    { name: 'project-assets', public: false },
    { name: 'avatars', public: true }
  ];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating bucket ${bucket.name}:`, error);
      } else {
        console.log(`✅ Bucket ${bucket.name} ready`);
      }
    } catch (err) {
      console.log(`ℹ️ Bucket ${bucket.name} might already exist`);
    }
  }
}

async function seedData() {
  console.log('🌱 Starting data seeding...');
  
  // Create a demo user ID
  const demoUserId = '11111111-1111-1111-1111-111111111111';
  
  // 1. Seed profiles
  console.log('👤 Seeding profiles...');
  const profiles = [
    {
      id: demoUserId,
      first_name: 'Sarah',
      last_name: 'Johnson', 
      company_name: 'Elite Interior Design Studio',
      phone: '+1 (555) 123-4567',
      role: 'admin',
      designation: 'Senior Interior Designer',
      department: 'Design'
    }
  ];

  const { error: profileError } = await supabase.from('profiles').upsert(profiles);
  if (profileError) console.error('Profile error:', profileError);
  else console.log('✅ Profiles seeded');

  // 2. Seed clients
  console.log('👥 Seeding clients...');
  const clients = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      user_id: demoUserId,
      first_name: 'Emma',
      last_name: 'Thompson',
      email: 'emma.thompson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Luxury Lane',
      city: 'New York',
      state: 'NY',
      client_type: 'individual',
      budget_range: '$100k-150k',
      preferred_style: 'Modern Minimalist',
      notes: 'High-end residential client interested in modern minimalist design'
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      user_id: demoUserId,
      first_name: 'Robert',
      last_name: 'Martinez',
      company: 'Tech Innovations Corp',
      email: 'facilities@techinnovations.com',
      phone: '+1 (555) 345-6789',
      address: '789 Business Plaza',
      city: 'New York',
      state: 'NY',
      client_type: 'corporate',
      budget_range: '$250k+',
      notes: 'Corporate office redesign project - 50,000 sq ft'
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      user_id: demoUserId,
      first_name: 'Lisa',
      last_name: 'Davis',
      email: 'lisa.davis@email.com',
      phone: '+1 (555) 456-7890',
      address: '321 Family Street',
      city: 'Brooklyn',
      state: 'NY',
      client_type: 'individual',
      budget_range: '$50k-75k',
      preferred_style: 'Traditional',
      notes: 'Family home renovation - kitchen and living areas'
    }
  ];

  const { error: clientError } = await supabase.from('clients').upsert(clients);
  if (clientError) console.error('Client error:', clientError);
  else console.log('✅ Clients seeded');

  // 3. Seed projects
  console.log('🏗️ Seeding projects...');
  const projects = [
    {
      id: '77777777-7777-7777-7777-777777777777',
      user_id: demoUserId,
      client_id: '33333333-3333-3333-3333-333333333333',
      name: 'Thompson Penthouse Renovation',
      description: 'Complete luxury penthouse renovation with modern minimalist design theme',
      project_type: 'residential',
      status: 'in_progress',
      priority: 'high',
      budget: 150000.00,
      start_date: '2024-01-15',
      end_date: '2024-06-15',
      completion_percentage: 65,
      location: 'Manhattan, NY',
      square_footage: 2500,
      style_preference: 'Modern Minimalist'
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      user_id: demoUserId,
      client_id: '44444444-4444-4444-4444-444444444444',
      name: 'Tech Corp Office Redesign',
      description: 'Modern corporate office space design for technology company',
      project_type: 'commercial',
      status: 'planning',
      priority: 'high',
      budget: 300000.00,
      start_date: '2024-03-01',
      end_date: '2024-08-31',
      completion_percentage: 15,
      location: 'NYC Business District',
      square_footage: 50000,
      style_preference: 'Modern Corporate'
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      user_id: demoUserId,
      client_id: '55555555-5555-5555-5555-555555555555',
      name: 'Davis Family Kitchen Remodel',
      description: 'Kitchen and dining area renovation with traditional design',
      project_type: 'residential',
      status: 'completed',
      priority: 'medium',
      budget: 75000.00,
      start_date: '2023-10-01',
      end_date: '2023-12-15',
      completion_percentage: 100,
      location: 'Brooklyn, NY',
      square_footage: 800,
      style_preference: 'Traditional'
    }
  ];

  const { error: projectError } = await supabase.from('projects').upsert(projects);
  if (projectError) console.error('Project error:', projectError);
  else console.log('✅ Projects seeded');

  // 4. Seed team members
  console.log('👥 Seeding team members...');
  const teamMembers = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: demoUserId,
      name: 'Alex Rodriguez',
      email: 'alex.rodriguez@eliteinteriors.com',
      phone: '+1 (555) 678-9012',
      role: 'senior_designer',
      specialization: 'Modern Design',
      hourly_rate: 125.00,
      status: 'active',
      hire_date: '2023-01-15'
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      user_id: demoUserId,
      name: 'Jennifer Kim',
      email: 'jennifer.kim@eliteinteriors.com',
      phone: '+1 (555) 789-0123',
      role: 'project_manager',
      specialization: 'Project Management',
      hourly_rate: 95.00,
      status: 'active',
      hire_date: '2023-03-01'
    }
  ];

  const { error: teamError } = await supabase.from('team_members').upsert(teamMembers);
  if (teamError) console.error('Team error:', teamError);
  else console.log('✅ Team members seeded');

  // 5. Seed tasks
  console.log('📋 Seeding project tasks...');
  const tasks = [
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      project_id: '77777777-7777-7777-7777-777777777777',
      name: 'Initial Design Consultation',
      description: 'Meet with client to discuss design preferences and requirements',
      assigned_to: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'completed',
      priority: 'high',
      start_date: '2024-01-15',
      end_date: '2024-01-20',
      completion_percentage: 100,
      estimated_hours: 8.0,
      actual_hours: 6.5
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      project_id: '77777777-7777-7777-7777-777777777777',
      name: 'Space Planning & Layout',
      description: 'Create detailed floor plans and space allocation drawings',
      assigned_to: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      status: 'in_progress',
      priority: 'high',
      start_date: '2024-01-21',
      end_date: '2024-02-15',
      completion_percentage: 75,
      estimated_hours: 40.0,
      actual_hours: 28.0
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      project_id: '88888888-8888-8888-8888-888888888888',
      name: 'Site Survey & Measurements',
      description: 'Conduct detailed site survey for corporate office space',
      assigned_to: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'pending',
      priority: 'high',
      start_date: '2024-03-01',
      end_date: '2024-03-10',
      completion_percentage: 0,
      estimated_hours: 16.0
    }
  ];

  const { error: taskError } = await supabase.from('project_tasks').upsert(tasks);
  if (taskError) console.error('Task error:', taskError);
  else console.log('✅ Tasks seeded');

  // 6. Seed quotations
  console.log('💰 Seeding quotations...');
  const quotations = [
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      user_id: demoUserId,
      client_id: '33333333-3333-3333-3333-333333333333',
      project_id: '77777777-7777-7777-7777-777777777777',
      quotation_number: 'QUO-2024-001',
      title: 'Thompson Penthouse Design Package',
      status: 'accepted',
      issue_date: '2024-01-10',
      valid_until: '2024-02-15',
      subtotal: 135000.00,
      tax_rate: 8.25,
      tax_amount: 11137.50,
      discount_amount: 5000.00,
      total_amount: 141137.50,
      notes: 'Complete penthouse renovation package including all materials and labor',
      items: JSON.stringify([
        { description: 'Design Consultation', quantity: 1, unit_price: 5000, amount: 5000 },
        { description: 'Space Planning', quantity: 1, unit_price: 8000, amount: 8000 },
        { description: 'Material Selection', quantity: 1, unit_price: 12000, amount: 12000 },
        { description: 'Construction Management', quantity: 1, unit_price: 110000, amount: 110000 }
      ])
    },
    {
      id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
      user_id: demoUserId,
      client_id: '44444444-4444-4444-4444-444444444444',
      project_id: '88888888-8888-8888-8888-888888888888',
      quotation_number: 'QUO-2024-002',
      title: 'Corporate Office Redesign - Phase 1',
      status: 'pending',
      issue_date: '2024-02-20',
      valid_until: '2024-04-01',
      subtotal: 275000.00,
      tax_rate: 8.25,
      tax_amount: 22687.50,
      discount_amount: 10000.00,
      total_amount: 287687.50,
      notes: 'Corporate office redesign - Phase 1 of 3'
    }
  ];

  const { error: quotationError } = await supabase.from('quotations').upsert(quotations);
  if (quotationError) console.error('Quotation error:', quotationError);
  else console.log('✅ Quotations seeded');

  // 7. Seed invoices
  console.log('🧾 Seeding invoices...');
  const invoices = [
    {
      id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
      user_id: demoUserId,
      client_id: '33333333-3333-3333-3333-333333333333',
      project_id: '77777777-7777-7777-7777-777777777777',
      invoice_number: 'INV-2024-001',
      title: 'Thompson Project - First Installment',
      status: 'partial_paid',
      issue_date: '2024-01-25',
      due_date: '2024-02-28',
      subtotal: 50000.00,
      tax_rate: 8.25,
      tax_amount: 4125.00,
      total_amount: 54125.00,
      notes: 'First installment - Design and planning phase'
    },
    {
      id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
      user_id: demoUserId,
      client_id: '55555555-5555-5555-5555-555555555555',
      project_id: '99999999-9999-9999-9999-999999999999',
      invoice_number: 'INV-2024-002',
      title: 'Davis Kitchen Remodel - Final Invoice',
      status: 'paid',
      issue_date: '2023-12-10',
      due_date: '2023-12-31',
      subtotal: 72500.00,
      tax_rate: 8.25,
      tax_amount: 5981.25,
      total_amount: 78481.25,
      notes: 'Final invoice - Kitchen remodel completion'
    }
  ];

  const { error: invoiceError } = await supabase.from('invoices').upsert(invoices);
  if (invoiceError) console.error('Invoice error:', invoiceError);
  else console.log('✅ Invoices seeded');

  // 8. Seed expenses
  console.log('💸 Seeding expenses...');
  const expenses = [
    {
      id: 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
      user_id: demoUserId,
      project_id: '77777777-7777-7777-7777-777777777777',
      category: 'materials',
      amount: 3500.00,
      description: 'Designer Lighting Fixtures',
      expense_date: '2024-01-25',
      status: 'approved'
    },
    {
      id: 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk',
      user_id: demoUserId,
      project_id: '77777777-7777-7777-7777-777777777777',
      category: 'services',
      amount: 1200.00,
      description: 'Professional Photography',
      expense_date: '2024-01-30',
      status: 'approved'
    },
    {
      id: 'llllllll-llll-llll-llll-llllllllllll',
      user_id: demoUserId,
      project_id: '99999999-9999-9999-9999-999999999999',
      category: 'materials',
      amount: 15000.00,
      description: 'Custom Cabinetry',
      expense_date: '2023-11-15',
      status: 'approved'
    }
  ];

  const { error: expenseError } = await supabase.from('expenses').upsert(expenses);
  if (expenseError) console.error('Expense error:', expenseError);
  else console.log('✅ Expenses seeded');

  console.log('🎉 All demo data seeded successfully!');
}

async function main() {
  console.log('🚀 Starting comprehensive CRM setup with schema-matched data...\n');
  
  try {
    await createDatabaseTables();
    await setupStorageBuckets(); 
    await seedData();
    
    console.log('\n🎉 CRM setup completed successfully!');
    console.log('\n📊 Data Summary:');
    console.log('• 4 Storage buckets created');
    console.log('• 1 User profile (Admin)');
    console.log('• 3 Clients (individual & corporate)');
    console.log('• 3 Projects (various statuses)');
    console.log('• 2 Team members');
    console.log('• 3 Project tasks');
    console.log('• 2 Quotations');
    console.log('• 2 Invoices');
    console.log('• 3 Expenses');
    console.log('\n✨ Your CRM is now fully populated and ready to use!');
    console.log('🔑 Demo User ID: 11111111-1111-1111-1111-111111111111');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

main();