const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.log('Please ensure you have:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  }
});

// Demo data
const demoData = {
  // Demo users (these will be created via Supabase Auth)
  users: [
    {
      email: 'demo@interiorcrm.com',
      password: 'demo123456',
      profile: {
        first_name: 'Design',
        last_name: 'Studio',
        company_name: 'Elite Interior Design Studio',
        phone: '+1-555-0123',
        role: 'designer',
        designation: 'Lead Designer',
        department: 'Design'
      },
      business_settings: {
        business_name: 'Elite Interior Design Studio',
        business_address: '123 Design Street, Creative District, NY 10001',
        business_phone: '+1-555-0123',
        business_email: 'hello@eliteinteriors.com',
        business_website: 'www.eliteinteriors.com',
        tax_number: 'TAX123456789',
        default_currency: 'USD',
        gst_rate: 18.0
      }
    }
  ],

  // Demo clients
  clients: [
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-1001',
      company: 'Johnson Enterprises',
      address: '456 Luxury Ave, Manhattan, NY 10002',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10002',
      client_type: 'corporate',
      budget_range: '$100,000 - $200,000',
      preferred_style: 'Modern Contemporary',
      notes: 'High-end corporate office redesign project. Prefers minimalist aesthetic with premium materials.',
      status: 'active'
    },
    {
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@email.com',
      phone: '+1-555-1002',
      alt_phone: '+1-555-1003',
      address: '789 Residential Blvd, Brooklyn, NY 11201',
      city: 'Brooklyn',
      state: 'NY',
      country: 'USA',
      postal_code: '11201',
      client_type: 'individual',
      budget_range: '$50,000 - $75,000',
      preferred_style: 'Scandinavian',
      notes: 'Young professional looking for modern apartment renovation. Values functionality and clean lines.',
      status: 'active'
    },
    {
      first_name: 'Emily',
      last_name: 'Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1-555-1004',
      address: '321 Family Lane, Queens, NY 11375',
      city: 'Queens',
      state: 'NY',
      country: 'USA',
      postal_code: '11375',
      client_type: 'individual',
      budget_range: '$75,000 - $100,000',
      preferred_style: 'Traditional',
      notes: 'Family home renovation with focus on child-friendly spaces and entertainment areas.',
      status: 'active'
    }
  ],

  // Demo leads
  leads: [
    {
      first_name: 'David',
      last_name: 'Williams',
      email: 'david.williams@email.com',
      phone: '+1-555-2001',
      source: 'Website Contact Form',
      stage: 'qualified',
      interest_level: 'high',
      potential_value: 85000.00,
      notes: 'Interested in complete home renovation. Has timeline of 6 months.',
      next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      first_name: 'Lisa',
      last_name: 'Thompson',
      email: 'lisa.thompson@email.com',
      phone: '+1-555-2002',
      source: 'Referral',
      stage: 'contacted',
      interest_level: 'medium',
      potential_value: 45000.00,
      notes: 'Referred by Sarah Johnson. Looking for kitchen remodel.',
      next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ],

  // Demo team members
  team_members: [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@eliteinteriors.com',
      phone: '+1-555-3001',
      role: 'Senior Designer',
      specialization: 'Residential Design',
      hourly_rate: 85.00,
      experience_years: 8,
      bio: 'Specialized in luxury residential projects with expertise in space planning and color theory.',
      salary: 75000.00,
      address: '567 Designer St, Manhattan, NY',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      status: 'active',
      join_date: '2022-03-15'
    },
    {
      name: 'Jessica Park',
      email: 'jessica.park@eliteinteriors.com',
      phone: '+1-555-3002',
      role: 'Project Manager',
      specialization: 'Project Coordination',
      hourly_rate: 75.00,
      experience_years: 6,
      bio: 'Expert in project timeline management and client communication.',
      salary: 65000.00,
      address: '890 Manager Ave, Brooklyn, NY',
      city: 'Brooklyn',
      state: 'NY',
      country: 'USA',
      status: 'active',
      join_date: '2022-06-01'
    },
    {
      name: 'Carlos Martinez',
      email: 'carlos.martinez@eliteinteriors.com',
      phone: '+1-555-3003',
      role: '3D Visualizer',
      specialization: '3D Rendering',
      hourly_rate: 70.00,
      experience_years: 5,
      bio: 'Creates stunning 3D visualizations and renderings for client presentations.',
      salary: 60000.00,
      address: '234 Artist Blvd, Queens, NY',
      city: 'Queens',
      state: 'NY',
      country: 'USA',
      status: 'active',
      join_date: '2023-01-10'
    }
  ],

  // Demo vendors
  vendors: [
    {
      name: 'Premium Furniture Co.',
      contact_person: 'Robert Kim',
      phone: '+1-555-4001',
      email: 'sales@premiumfurniture.com',
      address: '100 Furniture District, NY 10013',
      category: 'Furniture',
      rating: 4.8,
      status: 'active',
      notes: 'High-quality custom furniture manufacturer. Excellent delivery times.'
    },
    {
      name: 'Elite Lighting Solutions',
      contact_person: 'Maria Gonzalez',
      phone: '+1-555-4002',
      email: 'info@elitelighting.com',
      address: '200 Light Ave, NY 10014',
      category: 'Lighting',
      rating: 4.6,
      status: 'active',
      notes: 'Specializes in modern lighting fixtures and smart home lighting systems.'
    },
    {
      name: 'Quality Contractors Inc.',
      contact_person: 'James Wilson',
      phone: '+1-555-4003',
      email: 'contracts@qualitycontractors.com',
      address: '300 Construction St, NY 10015',
      category: 'Construction',
      rating: 4.7,
      status: 'active',
      notes: 'Reliable construction partner for renovation and remodeling projects.'
    }
  ],

  // Demo projects will be created after clients and team members
  projects: [
    {
      name: 'Johnson Corporate Office Redesign',
      description: 'Complete redesign of corporate headquarters including reception, conference rooms, and executive offices.',
      project_type: 'commercial',
      status: 'in_progress',
      priority: 'high',
      budget: 150000.00,
      start_date: '2024-01-15',
      end_date: '2024-04-15',
      completion_percentage: 35,
      location: '456 Luxury Ave, Manhattan, NY 10002',
      square_footage: 5000,
      style_preference: 'Modern Contemporary',
      special_requirements: 'Sound-proofing for conference rooms, premium materials only'
    },
    {
      name: 'Chen Apartment Renovation',
      description: 'Modern apartment renovation including kitchen, living room, and master bedroom.',
      project_type: 'residential',
      status: 'planning',
      priority: 'medium',
      budget: 65000.00,
      start_date: '2024-02-01',
      end_date: '2024-05-01',
      completion_percentage: 15,
      location: '789 Residential Blvd, Brooklyn, NY 11201',
      square_footage: 1200,
      style_preference: 'Scandinavian',
      special_requirements: 'Pet-friendly materials, maximized storage solutions'
    },
    {
      name: 'Rodriguez Family Home',
      description: 'Traditional family home renovation with focus on entertainment and children areas.',
      project_type: 'residential',
      status: 'planning',
      priority: 'medium',
      budget: 85000.00,
      start_date: '2024-03-01',
      end_date: '2024-07-01',
      completion_percentage: 10,
      location: '321 Family Lane, Queens, NY 11375',
      square_footage: 2200,
      style_preference: 'Traditional',
      special_requirements: 'Child-safe materials, entertainment room setup'
    }
  ]
};

// Utility functions
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function generateInvoiceNumber() {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}${random}`;
}

function generateQuotationNumber() {
  const prefix = 'QUO';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}${random}`;
}

async function createStorageBuckets() {
  console.log('🪣 Creating storage buckets...');
  
  const buckets = [
    { name: 'avatars', public: true },
    { name: 'receipts', public: false },
    { name: 'client-files', public: false },
    { name: 'project-assets', public: false },
    { name: 'expense-documents', public: false }
  ];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 50000000 // 50MB
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket '${bucket.name}' already exists`);
        } else {
          console.error(`❌ Error creating bucket '${bucket.name}':`, error.message);
        }
      } else {
        console.log(`✅ Created bucket: ${bucket.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating bucket '${bucket.name}':`, error.message);
    }
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create storage buckets first
    await createStorageBuckets();

    // 2. Create demo users via auth
    console.log('\n👤 Creating demo users...');
    const createdUsers = [];
    
    for (const userData of demoData.users) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`✅ User ${userData.email} already exists`);
            // Get existing user
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === userData.email);
            if (existingUser) {
              createdUsers.push({
                id: existingUser.id,
                email: existingUser.email,
                ...userData
              });
            }
          } else {
            console.error(`❌ Error creating user ${userData.email}:`, authError.message);
            continue;
          }
        } else {
          console.log(`✅ Created user: ${userData.email}`);
          createdUsers.push({
            id: authData.user.id,
            email: authData.user.email,
            ...userData
          });
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    if (createdUsers.length === 0) {
      console.error('❌ No users were created. Exiting...');
      return;
    }

    const mainUser = createdUsers[0];
    console.log(`\n📋 Using main user: ${mainUser.email} (${mainUser.id})`);

    // 3. Create profiles
    console.log('\n👤 Creating user profiles...');
    for (const user of createdUsers) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...user.profile
        });

      if (error) {
        console.error(`❌ Error creating profile for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created profile for: ${user.email}`);
      }
    }

    // 4. Create business settings
    console.log('\n🏢 Creating business settings...');
    for (const user of createdUsers) {
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          ...user.business_settings
        });

      if (error) {
        console.error(`❌ Error creating business settings:`, error.message);
      } else {
        console.log(`✅ Created business settings for: ${user.email}`);
      }
    }

    // 5. Create clients
    console.log('\n👥 Creating clients...');
    const createdClients = [];
    for (const clientData of demoData.clients) {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: mainUser.id,
          ...clientData
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating client ${clientData.first_name}:`, error.message);
      } else {
        console.log(`✅ Created client: ${clientData.first_name} ${clientData.last_name}`);
        createdClients.push(data);
      }
    }

    // 6. Create leads
    console.log('\n🎯 Creating leads...');
    for (const leadData of demoData.leads) {
      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: mainUser.id,
          ...leadData
        });

      if (error) {
        console.error(`❌ Error creating lead ${leadData.first_name}:`, error.message);
      } else {
        console.log(`✅ Created lead: ${leadData.first_name} ${leadData.last_name}`);
      }
    }

    // 7. Create team members
    console.log('\n👨‍💼 Creating team members...');
    const createdTeamMembers = [];
    for (const teamData of demoData.team_members) {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          user_id: mainUser.id,
          ...teamData
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating team member ${teamData.name}:`, error.message);
      } else {
        console.log(`✅ Created team member: ${teamData.name}`);
        createdTeamMembers.push(data);
      }
    }

    // 8. Create vendors
    console.log('\n🏪 Creating vendors...');
    const createdVendors = [];
    for (const vendorData of demoData.vendors) {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          user_id: mainUser.id,
          ...vendorData
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating vendor ${vendorData.name}:`, error.message);
      } else {
        console.log(`✅ Created vendor: ${vendorData.name}`);
        createdVendors.push(data);
      }
    }

    // 9. Create projects
    console.log('\n🏗️ Creating projects...');
    const createdProjects = [];
    for (let i = 0; i < demoData.projects.length && i < createdClients.length; i++) {
      const projectData = demoData.projects[i];
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: mainUser.id,
          client_id: createdClients[i].id,
          ...projectData
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating project ${projectData.name}:`, error.message);
      } else {
        console.log(`✅ Created project: ${projectData.name}`);
        createdProjects.push(data);
      }
    }

    // 10. Create project tasks
    console.log('\n✅ Creating project tasks...');
    const taskTemplates = [
      { name: 'Initial Consultation', description: 'Meet with client to discuss requirements and vision', role: 'Senior Designer', status: 'completed', estimated_hours: 2 },
      { name: 'Space Planning', description: 'Create detailed floor plans and space layouts', role: 'Senior Designer', status: 'in_progress', estimated_hours: 8 },
      { name: '3D Visualization', description: 'Create 3D renders and virtual walkthroughs', role: '3D Visualizer', status: 'pending', estimated_hours: 12 },
      { name: 'Material Selection', description: 'Source and select materials, furniture, and fixtures', role: 'Senior Designer', status: 'pending', estimated_hours: 6 },
      { name: 'Project Coordination', description: 'Coordinate with contractors and vendors', role: 'Project Manager', status: 'pending', estimated_hours: 15 },
      { name: 'Installation Supervision', description: 'Oversee installation and final touches', role: 'Project Manager', status: 'pending', estimated_hours: 10 }
    ];

    for (const project of createdProjects) {
      for (let i = 0; i < taskTemplates.length; i++) {
        const task = taskTemplates[i];
        const assignedMember = createdTeamMembers.find(tm => tm.role === task.role);
        
        const { error } = await supabase
          .from('project_tasks')
          .insert({
            project_id: project.id,
            name: task.name,
            description: task.description,
            assigned_to: assignedMember?.id,
            role: task.role,
            status: task.status,
            priority: i < 2 ? 'high' : 'medium',
            estimated_hours: task.estimated_hours,
            actual_hours: task.status === 'completed' ? task.estimated_hours : null,
            start_date: formatDate(new Date(project.start_date)),
            end_date: formatDate(new Date(new Date(project.start_date).getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000))
          });

        if (error) {
          console.error(`❌ Error creating task ${task.name}:`, error.message);
        }
      }
      console.log(`✅ Created tasks for project: ${project.name}`);
    }

    // 11. Create quotations
    console.log('\n💰 Creating quotations...');
    const createdQuotations = [];
    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      const quotationItems = [
        { description: 'Design Consultation & Planning', quantity: 1, unit_price: 2500.00 },
        { description: 'Space Planning & 3D Visualization', quantity: 1, unit_price: 3500.00 },
        { description: 'Material Selection & Procurement', quantity: 1, unit_price: 1500.00 },
        { description: 'Project Management & Coordination', quantity: 1, unit_price: 2000.00 }
      ];

      const subtotal = quotationItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * 0.18; // 18% tax
      const totalAmount = subtotal + taxAmount;

      const { data: quotation, error } = await supabase
        .from('quotations')
        .insert({
          user_id: mainUser.id,
          client_id: project.client_id,
          project_id: project.id,
          quotation_number: generateQuotationNumber(),
          title: `Quotation for ${project.name}`,
          status: i === 0 ? 'approved' : 'sent',
          issue_date: formatDate(new Date(project.start_date)),
          valid_until: formatDate(new Date(new Date(project.start_date).getTime() + 30 * 24 * 60 * 60 * 1000)),
          subtotal: subtotal,
          tax_rate: 18.0,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: 'USD',
          notes: 'This quotation is valid for 30 days from the issue date.',
          terms: 'Payment terms: 30% advance, 40% on completion of design phase, 30% on project completion.',
          items: JSON.stringify(quotationItems)
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating quotation for ${project.name}:`, error.message);
      } else {
        console.log(`✅ Created quotation for: ${project.name}`);
        createdQuotations.push(quotation);

        // Create quotation items
        for (let j = 0; j < quotationItems.length; j++) {
          const item = quotationItems[j];
          await supabase
            .from('quotation_items')
            .insert({
              quotation_id: quotation.id,
              item_order: j + 1,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.quantity * item.unit_price
            });
        }
      }
    }

    // 12. Create invoices
    console.log('\n🧾 Creating invoices...');
    const createdInvoices = [];
    for (let i = 0; i < createdProjects.length; i++) {
      if (i < 2) { // Only create invoices for first 2 projects
        const project = createdProjects[i];
        const quotation = createdQuotations[i];
        
        const { data: invoice, error } = await supabase
          .from('invoices')
          .insert({
            user_id: mainUser.id,
            client_id: project.client_id,
            project_id: project.id,
            invoice_number: generateInvoiceNumber(),
            title: `Invoice for ${project.name}`,
            status: i === 0 ? 'paid' : 'sent',
            issue_date: formatDate(new Date()),
            due_date: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            subtotal: quotation.subtotal,
            tax_rate: quotation.tax_rate,
            tax_amount: quotation.tax_amount,
            total_amount: quotation.total_amount,
            currency: 'USD',
            notes: 'Thank you for your business!',
            payment_terms: 'Net 30 days'
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating invoice for ${project.name}:`, error.message);
        } else {
          console.log(`✅ Created invoice for: ${project.name}`);
          createdInvoices.push(invoice);

          // Create invoice items from quotation items
          const quotationItems = JSON.parse(quotation.items);
          for (let j = 0; j < quotationItems.length; j++) {
            const item = quotationItems[j];
            await supabase
              .from('invoice_items')
              .insert({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.quantity * item.unit_price,
                item_order: j + 1
              });
          }
        }
      }
    }

    // 13. Create payments
    console.log('\n💳 Creating payments...');
    for (let i = 0; i < createdInvoices.length; i++) {
      if (i === 0) { // Only create payment for first invoice
        const invoice = createdInvoices[i];
        const { error } = await supabase
          .from('payments')
          .insert({
            user_id: mainUser.id,
            client_id: invoice.client_id,
            project_id: invoice.project_id,
            invoice_id: invoice.id,
            amount: invoice.total_amount,
            payment_date: formatDate(new Date()),
            payment_mode: 'Bank Transfer',
            reference_number: 'TXN' + Date.now().toString().slice(-8),
            notes: 'Full payment received via bank transfer'
          });

        if (error) {
          console.error(`❌ Error creating payment:`, error.message);
        } else {
          console.log(`✅ Created payment for invoice: ${invoice.invoice_number}`);
        }
      }
    }

    // 14. Create expenses
    console.log('\n💸 Creating expenses...');
    const expenseCategories = ['Materials', 'Transportation', 'Tools', 'Subcontractor', 'Office Supplies'];
    const expenseData = [
      { category: 'Materials', amount: 1250.00, description: 'Premium fabric samples and wallpaper', project_idx: 0 },
      { category: 'Transportation', amount: 85.00, description: 'Client site visits and material pickup', project_idx: 0 },
      { category: 'Tools', amount: 320.00, description: 'Professional measurement tools', project_idx: 1 },
      { category: 'Subcontractor', amount: 2500.00, description: 'Electrical work for lighting installation', project_idx: 1 },
      { category: 'Office Supplies', amount: 150.00, description: 'Presentation materials and printing', project_idx: null }
    ];

    for (const expense of expenseData) {
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: mainUser.id,
          project_id: expense.project_idx !== null ? createdProjects[expense.project_idx]?.id : null,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          expense_date: formatDate(new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)),
          status: Math.random() > 0.3 ? 'approved' : 'pending'
        });

      if (error) {
        console.error(`❌ Error creating expense:`, error.message);
      } else {
        console.log(`✅ Created expense: ${expense.description}`);
      }
    }

    // 15. Create notifications
    console.log('\n🔔 Creating notifications...');
    const notifications = [
      { title: 'New Payment Received', message: 'Payment of $9,500 received from Johnson Enterprises', type: 'success' },
      { title: 'Project Deadline Approaching', message: 'Chen Apartment Renovation due in 5 days', type: 'warning' },
      { title: 'New Lead Added', message: 'David Williams showed interest in home renovation', type: 'info' },
      { title: 'Task Completed', message: 'Initial consultation completed for Rodriguez Family Home', type: 'success' },
      { title: 'Expense Approval Needed', message: 'Expense of $2,500 for subcontractor work needs approval', type: 'warning' }
    ];

    for (const notification of notifications) {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: mainUser.id,
          ...notification,
          is_read: Math.random() > 0.6 // Some notifications read, some unread
        });

      if (error) {
        console.error(`❌ Error creating notification:`, error.message);
      }
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    // 16. Create appointments
    console.log('\n📅 Creating appointments...');
    const appointments = [
      {
        title: 'Client Consultation - Johnson Office',
        description: 'Initial consultation for corporate office redesign',
        start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        event_type: 'consultation',
        location: '456 Luxury Ave, Manhattan',
        client_idx: 0,
        project_idx: 0
      },
      {
        title: 'Site Visit - Chen Apartment',
        description: 'Site measurement and assessment',
        start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        event_type: 'site_visit',
        location: '789 Residential Blvd, Brooklyn',
        client_idx: 1,
        project_idx: 1
      }
    ];

    for (const appointment of appointments) {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: mainUser.id,
          client_id: createdClients[appointment.client_idx]?.id,
          project_id: createdProjects[appointment.project_idx]?.id,
          title: appointment.title,
          description: appointment.description,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          event_type: appointment.event_type,
          location: appointment.location
        });

      if (error) {
        console.error(`❌ Error creating appointment:`, error.message);
      } else {
        console.log(`✅ Created appointment: ${appointment.title}`);
      }
    }

    // 17. Create activity log entries
    console.log('\n📊 Creating activity log entries...');
    const activities = [
      { entity_type: 'project', action: 'created', meta: { project_name: 'Johnson Corporate Office Redesign' } },
      { entity_type: 'client', action: 'created', meta: { client_name: 'Sarah Johnson' } },
      { entity_type: 'quotation', action: 'sent', meta: { quotation_number: createdQuotations[0]?.quotation_number } },
      { entity_type: 'payment', action: 'received', meta: { amount: '$9,500' } },
      { entity_type: 'task', action: 'completed', meta: { task_name: 'Initial Consultation' } }
    ];

    for (const activity of activities) {
      const { error } = await supabase
        .from('activity_log')
        .insert({
          user_id: mainUser.id,
          entity_type: activity.entity_type,
          entity_id: createdProjects[0]?.id || 'demo-entity',
          action: activity.action,
          meta: activity.meta
        });

      if (error) {
        console.error(`❌ Error creating activity log:`, error.message);
      }
    }
    console.log(`✅ Created ${activities.length} activity log entries`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Users: ${createdUsers.length}`);
    console.log(`   👥 Clients: ${createdClients.length}`);
    console.log(`   🎯 Leads: ${demoData.leads.length}`);
    console.log(`   👨‍💼 Team Members: ${createdTeamMembers.length}`);
    console.log(`   🏪 Vendors: ${createdVendors.length}`);
    console.log(`   🏗️ Projects: ${createdProjects.length}`);
    console.log(`   💰 Quotations: ${createdQuotations.length}`);
    console.log(`   🧾 Invoices: ${createdInvoices.length}`);
    console.log(`   💳 Payments: 1`);
    console.log(`   💸 Expenses: ${expenseData.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log(`   📅 Appointments: ${appointments.length}`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log(`   Email: ${mainUser.email}`);
    console.log(`   Password: demo123456`);
    
    console.log('\n✅ Your CRM is now fully populated with demo data!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding
seedDatabase().catch(console.error);