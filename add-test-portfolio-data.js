#!/usr/bin/env node
/**
 * Add Real Test Portfolio Data to Supabase
 * This script creates realistic portfolio projects for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test portfolio data - realistic interior design projects
const testPortfolios = [
  {
    title: 'Modern Minimalist Living Room',
    description: 'A contemporary living space featuring clean lines, neutral colors, and carefully curated furniture pieces that create a serene and sophisticated atmosphere.',
    category: 'living-room',
    status: 'published',
    featured: true,
    sort_order: 1
  },
  {
    title: 'Luxury Master Bedroom Suite', 
    description: 'An elegant bedroom design with premium finishes, custom built-ins, and a spa-like en-suite bathroom that offers the ultimate in comfort and style.',
    category: 'bedroom',
    status: 'published',
    featured: true,
    sort_order: 2
  },
  {
    title: 'Gourmet Kitchen Renovation',
    description: 'A complete kitchen transformation featuring marble countertops, custom cabinetry, and professional-grade appliances perfect for entertaining.',
    category: 'kitchen',
    status: 'published', 
    featured: false,
    sort_order: 3
  },
  {
    title: 'Executive Home Office',
    description: 'A productive workspace designed for the modern professional, featuring ergonomic furniture, built-in storage, and inspiring design elements.',
    category: 'office',
    status: 'published',
    featured: false,
    sort_order: 4
  },
  {
    title: 'Spa-Inspired Bathroom Retreat',
    description: 'Transform your daily routine with this luxurious bathroom featuring natural stone, rainfall shower, and carefully designed lighting for ultimate relaxation.',
    category: 'bathroom',
    status: 'published',
    featured: true,
    sort_order: 5
  },
  {
    title: 'Elegant Dining Room Design',
    description: 'A sophisticated dining space that combines modern aesthetics with classic elegance, perfect for intimate dinners and large gatherings alike.',
    category: 'dining-room',
    status: 'published',
    featured: false,
    sort_order: 6
  },
  {
    title: 'Industrial Loft Conversion',
    description: 'Converting raw industrial space into a stunning residential loft with exposed brick, steel beams, and contemporary furnishings.',
    category: 'loft',
    status: 'draft',
    featured: false,
    sort_order: 7
  },
  {
    title: 'Cozy Reading Nook & Library',
    description: 'A warm and inviting space designed for book lovers, featuring custom built-in shelving, comfortable seating, and optimal reading lighting.',
    category: 'library',
    status: 'published',
    featured: false,
    sort_order: 8
  }
];

async function addTestPortfolios() {
  console.log('🎨 Adding Real Test Portfolio Data to Supabase\n');
  
  try {
    // First, check if we have an organization ID to use
    console.log('1. 🔍 Checking for existing organization...');
    
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
      
    if (orgError) {
      console.log('   ⚠️  Organizations table not accessible, using default org ID');
      console.log('   📝 You may need to update organization_id manually in the database');
    }
    
    const organizationId = organizations && organizations.length > 0 
      ? organizations[0].id 
      : '00000000-0000-0000-0000-000000000001'; // Default from your existing data
    
    console.log(`   ✅ Using organization ID: ${organizationId}`);

    // Check if portfolio_projects table exists and is accessible
    console.log('\n2. 🗄️  Testing portfolio_projects table access...');
    
    const { count: existingCount, error: checkError } = await supabase
      .from('portfolio_projects')
      .select('*', { count: 'exact', head: true });
      
    if (checkError) {
      console.log(`   ❌ Error accessing portfolios table: ${checkError.message}`);
      console.log('   💡 Make sure you\'ve run the portfolio-database-schema.sql file in Supabase SQL Editor');
      return;
    }
    
  console.log(`   ✅ portfolio_projects table accessible (${existingCount || 0} existing records)`);

    // Add organization_id to each portfolio
    const portfoliosWithOrg = testPortfolios.map(portfolio => ({
      ...portfolio,
      organization_id: organizationId
    }));

    // Clear existing test data (optional)
    console.log('\n3. 🧹 Clearing existing test portfolios...');
    
    const { error: deleteError } = await supabase
      .from('portfolio_projects')
      .delete()
      .in('title', testPortfolios.map(p => p.title));
      
    if (deleteError && !deleteError.message.includes('No rows')) {
      console.log(`   ⚠️  Warning during cleanup: ${deleteError.message}`);
    } else {
      console.log('   ✅ Existing test data cleared');
    }

    // Insert test portfolios
    console.log('\n4. 📝 Creating test portfolios...');
    
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id || '00000000-0000-0000-0000-000000000000';
    const rows = portfoliosWithOrg.map(p => ({ ...p, user_id }))

    const { data: newPortfolios, error: insertError } = await supabase
      .from('portfolio_projects')
      .insert(rows)
      .select();

    if (insertError) {
      console.error(`   ❌ Error creating portfolios: ${insertError.message}`);
      
      // Try inserting one by one to identify specific issues
      console.log('   🔍 Attempting individual inserts for debugging...');
      
      for (const portfolio of portfoliosWithOrg) {
        try {
          const { data, error } = await supabase
            .from('portfolio_projects')
            .insert([{ ...portfolio, user_id }])
            .select();
            
          if (error) {
            console.log(`   ❌ Failed to insert "${portfolio.title}": ${error.message}`);
          } else {
            console.log(`   ✅ Successfully created: "${portfolio.title}"`);
          }
        } catch (err) {
          console.log(`   ❌ Exception inserting "${portfolio.title}": ${err.message}`);
        }
      }
      
      return;
    }

    console.log(`   ✅ Successfully created ${newPortfolios.length} portfolios`);

    // Display created portfolios
    console.log('\n📋 Created Portfolios:');
    newPortfolios.forEach((portfolio, index) => {
      const status = portfolio.featured ? '⭐ Featured' : '📄 Regular';
      const visibility = portfolio.status === 'published' ? '🌐 Published' : '✏️  Draft';
      console.log(`   ${index + 1}. "${portfolio.title}"`);
      console.log(`      Category: ${portfolio.category} | ${status} | ${visibility}`);
    });

    // Verify the data
    console.log('\n5. ✅ Verifying created data...');
    
    const { data: verifyPortfolios, error: verifyError } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order');

    if (verifyError) {
      console.log(`   ⚠️  Verification error: ${verifyError.message}`);
    } else {
      console.log(`   ✅ Verified ${verifyPortfolios.length} portfolios in database`);
      
      const published = verifyPortfolios.filter(p => p.status === 'published').length;
      const featured = verifyPortfolios.filter(p => p.featured).length;
      
      console.log(`   📊 Stats: ${published} published, ${featured} featured`);
    }

    console.log('\n🎉 Test Data Creation Complete!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Visit http://localhost:3000/portfolio to see your portfolios');
    console.log('   2. Test creating new portfolios through the UI');
    console.log('   3. Test portfolio viewing and editing functionality');
    console.log('   4. Upload sample images to test media functionality');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('   🔧 Check your Supabase configuration and database setup');
  }
}

// Run the script
addTestPortfolios();