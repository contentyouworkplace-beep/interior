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

async function seedProfiles() {
  console.log('👤 Seeding user profiles...');
  
  const profiles = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@interiorcrm.com',
      full_name: 'Sarah Johnson',
      role: 'admin',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222', 
      email: 'designer@interiorcrm.com',
      full_name: 'Michael Chen',
      role: 'designer',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('profiles').upsert(profiles);
  if (error) {
    console.error('Error seeding profiles:', error);
  } else {
    console.log('✅ Profiles seeded successfully');
  }
}

async function seedBusinessSettings() {
  console.log('🏢 Seeding business settings...');
  
  const businessSettings = {
    business_name: 'Elite Interior Design Studio',
    business_address: '123 Design Avenue, Creative District, NY 10001',
    business_phone: '+1 (555) 123-4567',
    business_email: 'contact@eliteinteriors.com',
    business_website: 'www.eliteinteriors.com',
    logo_url: null,
    tax_number: 'TX123456789',
    default_currency: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('business_settings').upsert([businessSettings]);
  if (error) {
    console.error('Error seeding business settings:', error);
  } else {
    console.log('✅ Business settings seeded successfully');
  }
}

async function seedClients() {
  console.log('👥 Seeding clients...');
  
  const clients = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Emma Thompson',
      email: 'emma.thompson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Luxury Lane, Uptown, NY 10002',
      client_type: 'individual',
      status: 'active',
      notes: 'High-end residential client interested in modern minimalist design',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Tech Innovations Corp',
      email: 'facilities@techinnovations.com',
      phone: '+1 (555) 345-6789',
      address: '789 Business Plaza, Corporate Center, NY 10003',
      client_type: 'corporate',
      status: 'active',
      notes: 'Corporate office redesign project - 50,000 sq ft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Robert & Lisa Martinez',
      email: 'martinez.family@email.com',
      phone: '+1 (555) 456-7890',
      address: '321 Family Street, Suburbs, NY 10004',
      client_type: 'individual',
      status: 'active',
      notes: 'Family home renovation - kitchen and living areas',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Golden Years Retirement Center',
      email: 'admin@goldenyears.com',
      phone: '+1 (555) 567-8901',
      address: '654 Serenity Boulevard, Peaceful Valley, NY 10005',
      client_type: 'corporate',
      status: 'potential',
      notes: 'Potential client for senior living facility design',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('clients').upsert(clients);
  if (error) {
    console.error('Error seeding clients:', error);
  } else {
    console.log('✅ Clients seeded successfully');
  }
}

async function seedProjects() {
  console.log('🏗️ Seeding projects...');
  
  const projects = [
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Thompson Penthouse Renovation',
      description: 'Complete luxury penthouse renovation with modern minimalist design theme',
      client_id: '33333333-3333-3333-3333-333333333333',
      project_type: 'residential',
      status: 'in_progress',
      start_date: new Date('2024-01-15').toISOString().split('T')[0],
      end_date: new Date('2024-06-15').toISOString().split('T')[0],
      budget: 150000.00,
      actual_cost: 95000.00,
      progress: 65,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Tech Corp Office Redesign',
      description: 'Modern corporate office space design for technology company',
      client_id: '44444444-4444-4444-4444-444444444444',
      project_type: 'commercial',
      status: 'planning',
      start_date: new Date('2024-03-01').toISOString().split('T')[0],
      end_date: new Date('2024-08-31').toISOString().split('T')[0],
      budget: 300000.00,
      actual_cost: 25000.00,
      progress: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      name: 'Martinez Family Kitchen Remodel',
      description: 'Kitchen and dining area renovation with open concept design',
      client_id: '55555555-5555-5555-5555-555555555555',
      project_type: 'residential',
      status: 'completed',
      start_date: new Date('2023-10-01').toISOString().split('T')[0],
      end_date: new Date('2023-12-15').toISOString().split('T')[0],
      budget: 75000.00,
      actual_cost: 78500.00,
      progress: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('projects').upsert(projects);
  if (error) {
    console.error('Error seeding projects:', error);
  } else {
    console.log('✅ Projects seeded successfully');
  }
}

async function seedTasks() {
  console.log('📋 Seeding tasks...');
  
  const tasks = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Initial Design Consultation',
      description: 'Meet with client to discuss design preferences and requirements',
      project_id: '77777777-7777-7777-7777-777777777777',
      assigned_to: '11111111-1111-1111-1111-111111111111',
      status: 'completed',
      priority: 'high',
      due_date: new Date('2024-01-20').toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'Space Planning & Layout',
      description: 'Create detailed floor plans and space allocation drawings',
      project_id: '77777777-7777-7777-7777-777777777777',
      assigned_to: '22222222-2222-2222-2222-222222222222',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date('2024-02-15').toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      title: 'Material Selection',
      description: 'Select and source all materials, fixtures, and furnishings',
      project_id: '77777777-7777-7777-7777-777777777777',
      assigned_to: '11111111-1111-1111-1111-111111111111',
      status: 'pending',
      priority: 'medium',
      due_date: new Date('2024-03-01').toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      title: 'Site Survey & Measurements',
      description: 'Conduct detailed site survey for corporate office space',
      project_id: '88888888-8888-8888-8888-888888888888',
      assigned_to: '22222222-2222-2222-2222-222222222222',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date('2024-03-10').toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('tasks').upsert(tasks);
  if (error) {
    console.error('Error seeding tasks:', error);
  } else {
    console.log('✅ Tasks seeded successfully');
  }
}

async function seedQuotations() {
  console.log('💰 Seeding quotations...');
  
  const quotations = [
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      quotation_number: 'QUO-2024-001',
      client_id: '33333333-3333-3333-3333-333333333333',
      project_id: '77777777-7777-7777-7777-777777777777',
      status: 'accepted',
      total_amount: 150000.00,
      tax_amount: 12000.00,
      discount_amount: 5000.00,
      valid_until: new Date('2024-02-15').toISOString().split('T')[0],
      notes: 'Complete penthouse renovation package including all materials and labor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      quotation_number: 'QUO-2024-002',
      client_id: '44444444-4444-4444-4444-444444444444',
      project_id: '88888888-8888-8888-8888-888888888888',
      status: 'pending',
      total_amount: 300000.00,
      tax_amount: 24000.00,
      discount_amount: 10000.00,
      valid_until: new Date('2024-04-01').toISOString().split('T')[0],
      notes: 'Corporate office redesign - Phase 1 of 3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('quotations').upsert(quotations);
  if (error) {
    console.error('Error seeding quotations:', error);
  } else {
    console.log('✅ Quotations seeded successfully');
  }
}

async function seedInvoices() {
  console.log('🧾 Seeding invoices...');
  
  const invoices = [
    {
      id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
      invoice_number: 'INV-2024-001',
      client_id: '33333333-3333-3333-3333-333333333333',
      project_id: '77777777-7777-7777-7777-777777777777',
      quotation_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      status: 'partial_paid',
      subtotal: 50000.00,
      tax_amount: 4000.00,
      total_amount: 54000.00,
      amount_paid: 25000.00,
      due_date: new Date('2024-02-28').toISOString().split('T')[0],
      notes: 'First installment - Design and planning phase',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
      invoice_number: 'INV-2024-002',
      client_id: '55555555-5555-5555-5555-555555555555',
      project_id: '99999999-9999-9999-9999-999999999999',
      status: 'paid',
      subtotal: 78500.00,
      tax_amount: 6280.00,
      total_amount: 84780.00,
      amount_paid: 84780.00,
      due_date: new Date('2023-12-31').toISOString().split('T')[0],
      notes: 'Final invoice - Kitchen remodel completion',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('invoices').upsert(invoices);
  if (error) {
    console.error('Error seeding invoices:', error);
  } else {
    console.log('✅ Invoices seeded successfully');
  }
}

async function seedExpenses() {
  console.log('💸 Seeding expenses...');
  
  const expenses = [
    {
      id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
      description: 'Designer Lighting Fixtures',
      amount: 3500.00,
      category: 'materials',
      expense_date: new Date('2024-01-25').toISOString().split('T')[0],
      project_id: '77777777-7777-7777-7777-777777777777',
      vendor: 'Luxury Lighting Co.',
      receipt_url: null,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
      description: 'Professional Photography',
      amount: 1200.00,
      category: 'services',
      expense_date: new Date('2024-01-30').toISOString().split('T')[0],
      project_id: '77777777-7777-7777-7777-777777777777',
      vendor: 'Design Photo Studio',
      receipt_url: null,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk',
      description: 'Custom Cabinetry',
      amount: 15000.00,
      category: 'materials',
      expense_date: new Date('2023-11-15').toISOString().split('T')[0],
      project_id: '99999999-9999-9999-9999-999999999999',
      vendor: 'Premium Woodworks',
      receipt_url: null,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('expenses').upsert(expenses);
  if (error) {
    console.error('Error seeding expenses:', error);
  } else {
    console.log('✅ Expenses seeded successfully');
  }
}

async function seedTeamMembers() {
  console.log('👥 Seeding team members...');
  
  const teamMembers = [
    {
      id: 'llllllll-llll-llll-llll-llllllllllll',
      name: 'Alex Rodriguez',
      email: 'alex.rodriguez@eliteinteriors.com',
      role: 'senior_designer',
      permissions: ['view_projects', 'edit_projects', 'view_clients', 'view_finances'],
      phone: '+1 (555) 678-9012',
      avatar_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
      name: 'Jennifer Kim',
      email: 'jennifer.kim@eliteinteriors.com',
      role: 'project_manager',
      permissions: ['view_projects', 'edit_projects', 'view_clients', 'edit_clients', 'view_finances'],
      phone: '+1 (555) 789-0123',
      avatar_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('team_members').upsert(teamMembers);
  if (error) {
    console.error('Error seeding team members:', error);
  } else {
    console.log('✅ Team members seeded successfully');
  }
}

async function seedVendors() {
  console.log('🏪 Seeding vendors...');
  
  const vendors = [
    {
      id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn',
      name: 'Luxury Lighting Co.',
      contact_person: 'David Miller',
      email: 'sales@luxurylighting.com',
      phone: '+1 (555) 890-1234',
      address: '789 Light Street, Fixture District, NY 10006',
      category: 'lighting',
      status: 'active',
      notes: 'Premium lighting supplier with excellent customer service',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'oooooooo-oooo-oooo-oooo-oooooooooooo',
      name: 'Premium Woodworks',
      contact_person: 'Maria Santos',
      email: 'orders@premiumwood.com',
      phone: '+1 (555) 901-2345',
      address: '456 Craft Avenue, Artisan Quarter, NY 10007',
      category: 'furniture',
      status: 'active',
      notes: 'Custom furniture and cabinetry specialist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
      name: 'Elegant Fabrics Ltd.',
      contact_person: 'James Wilson',
      email: 'info@elegantfabrics.com',
      phone: '+1 (555) 012-3456',
      address: '321 Textile Row, Fashion District, NY 10008',
      category: 'textiles',
      status: 'active',
      notes: 'High-end fabric supplier for upholstery and window treatments',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('vendors').upsert(vendors);
  if (error) {
    console.error('Error seeding vendors:', error);
  } else {
    console.log('✅ Vendors seeded successfully');
  }
}

async function seedPayments() {
  console.log('💳 Seeding payments...');
  
  const payments = [
    {
      id: 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq',
      invoice_id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
      amount: 25000.00,
      payment_method: 'bank_transfer',
      payment_date: new Date('2024-02-10').toISOString().split('T')[0],
      reference: 'TXN-20240210-001',
      notes: 'First installment payment via wire transfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',
      invoice_id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
      amount: 84780.00,
      payment_method: 'check',
      payment_date: new Date('2023-12-28').toISOString().split('T')[0],
      reference: 'CHK-2023-12-001',
      notes: 'Final payment for kitchen remodel project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('payments').upsert(payments);
  if (error) {
    console.error('Error seeding payments:', error);
  } else {
    console.log('✅ Payments seeded successfully');
  }
}

async function main() {
  console.log('🚀 Starting comprehensive CRM demo data setup...\n');
  
  try {
    await setupStorageBuckets();
    await seedProfiles();
    await seedBusinessSettings();
    await seedClients();
    await seedProjects();
    await seedTasks();
    await seedQuotations();
    await seedInvoices();
    await seedExpenses();
    await seedTeamMembers();
    await seedVendors();
    await seedPayments();
    
    console.log('\n🎉 CRM demo data setup completed successfully!');
    console.log('\n📊 Data Summary:');
    console.log('• 4 Storage buckets created');
    console.log('• 2 User profiles');
    console.log('• 1 Business settings');
    console.log('• 4 Clients (individual & corporate)');
    console.log('• 3 Projects (various statuses)');
    console.log('• 4 Tasks (different priorities)');
    console.log('• 2 Quotations');
    console.log('• 2 Invoices'); 
    console.log('• 3 Expenses');
    console.log('• 2 Team members');
    console.log('• 3 Vendors');
    console.log('• 2 Payments');
    console.log('\n✨ Your CRM is now fully populated and ready to use!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

main();