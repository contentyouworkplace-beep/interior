#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== Step 1: Find demo@admin.com user ===\n');
  
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return;
  }
  
  console.log(`Found ${usersData.users.length} total users\n`);
  
  const demoUser = usersData.users.find(u => u.email === 'demo@admin.com');
  
  if (!demoUser) {
    console.log('❌ demo@admin.com not found\n');
    console.log('Available users:');
    usersData.users.forEach(u => {
      console.log(`  - ${u.email} | ${u.id}`);
    });
    return;
  }
  
  console.log('✅ Found demo@admin.com');
  console.log(`   User ID: ${demoUser.id}\n`);
  
  console.log('=== Step 2: Check quotations ===\n');
  
  // Check quotations for demo user
  const { data: demoQuotes, count: demoCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', demoUser.id);
  
  console.log(`Quotations owned by demo@admin.com: ${demoCount}`);
  
  // Check all quotations
  const { data: allQuotes, count: totalCount } = await supabase
    .from('quotations')
    .select('user_id, quotation_number, title', { count: 'exact' });
  
  console.log(`Total quotations in database: ${totalCount}\n`);
  
  if (demoCount === 0 && totalCount > 0) {
    console.log('⚠️  Problem identified: All quotations belong to OTHER users!\n');
    
    // Show who owns them
    const ownerMap = {};
    allQuotes.forEach(q => {
      ownerMap[q.user_id] = (ownerMap[q.user_id] || 0) + 1;
    });
    
    console.log('Current ownership:');
    for (const [userId, count] of Object.entries(ownerMap)) {
      const user = usersData.users.find(u => u.id === userId);
      console.log(`  - ${user?.email || 'Unknown'}: ${count} quotations`);
    }
    
    console.log('\n=== Step 3: Fix - Transfer quotations to demo@admin.com ===\n');
    
    // Update all quotations to demo user
    const { data: updated, error: updateError } = await supabase
      .from('quotations')
      .update({ user_id: demoUser.id })
      .neq('user_id', demoUser.id)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating quotations:', updateError.message);
    } else {
      console.log(`✅ Successfully transferred ${updated.length} quotations to demo@admin.com`);
      
      // Also update quotation_items if they have user_id
      console.log('\n=== Step 4: Fix quotation_items (if needed) ===\n');
      
      const { error: itemsError } = await supabase
        .from('quotation_items')
        .update({ user_id: demoUser.id })
        .in('quotation_id', updated.map(q => q.id));
      
      if (itemsError && !itemsError.message.includes('column')) {
        console.error('⚠️  Error updating items:', itemsError.message);
      } else {
        console.log('✅ Quotation items updated (if applicable)');
      }
    }
    
    console.log('\n=== Step 5: Verify fix ===\n');
    
    const { count: newCount } = await supabase
      .from('quotations')
      .select('*', { count: 'exact' })
      .eq('user_id', demoUser.id);
    
    console.log(`Quotations now owned by demo@admin.com: ${newCount}`);
    console.log('\n✅ Done! Refresh your browser to see the quotations.');
    
  } else if (demoCount > 0) {
    console.log(`✅ Good! demo@admin.com already has ${demoCount} quotations.`);
    demoQuotes.forEach(q => {
      console.log(`  - ${q.quotation_number}: ${q.title}`);
    });
  } else {
    console.log('ℹ️  No quotations exist in the database yet.');
  }
}

main().catch(console.error);
