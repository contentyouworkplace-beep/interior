#!/usr/bin/env node

/**
 * Transfer ALL quotations to demo@admin.com user
 * This ensures the demo user can see quotations immediately
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function transferQuotations() {
  console.log('=== Transferring all quotations to demo@admin.com ===\n');
  
  // 1. Find demo@admin.com user
  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUser = users.users.find(u => u.email === 'demo@admin.com');
  
  if (!demoUser) {
    console.error('❌ demo@admin.com user not found');
    return;
  }
  
  console.log('✅ Found demo@admin.com');
  console.log('   User ID:', demoUser.id);
  
  // 2. Check current quotations
  const { data: allQuotes, count: totalCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' });
  
  console.log(`\n📊 Total quotations in database: ${totalCount}`);
  
  const { count: demoCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', demoUser.id);
  
  console.log(`📊 Quotations owned by demo@admin.com: ${demoCount}`);
  
  if (demoCount === totalCount) {
    console.log('\n✅ All quotations already belong to demo@admin.com!');
    return;
  }
  
  // 3. Transfer all quotations to demo user
  console.log(`\n🔄 Transferring ${totalCount - demoCount} quotations...`);
  
  const { data: updated, error: updateError } = await supabase
    .from('quotations')
    .update({ user_id: demoUser.id })
    .neq('user_id', demoUser.id)
    .select();
  
  if (updateError) {
    console.error('❌ Error:', updateError.message);
    return;
  }
  
  console.log(`✅ Successfully transferred ${updated.length} quotations`);
  
  // 4. Update related tables if they have user_id
  console.log('\n🔄 Updating related quotation_items...');
  
  const quotationIds = allQuotes.map(q => q.id);
  
  const { error: itemsError } = await supabase
    .from('quotation_items')
    .update({ user_id: demoUser.id })
    .in('quotation_id', quotationIds);
  
  if (itemsError && !itemsError.message.includes('column "user_id" of relation "quotation_items" does not exist')) {
    console.log('⚠️ ', itemsError.message);
  } else {
    console.log('✅ Quotation items updated (or no user_id column)');
  }
  
  // 5. Verify
  const { count: finalCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', demoUser.id);
  
  console.log(`\n✅ Final count: ${finalCount} quotations owned by demo@admin.com`);
  console.log('\n🎉 Done! Now refresh your browser to see all quotations.');
}

transferQuotations().catch(console.error);
