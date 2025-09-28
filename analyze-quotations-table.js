const { createClient } = require("@supabase/supabase-js");
require('dotenv').config();

// This script will check the quotations table structure and provide recommendations
async function main() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials. Please check your environment variables.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Check if the quotations table exists
  try {
    console.log("🔍 Checking quotations table...");
    const { data: tableExists, error } = await supabase
      .from('quotations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("❌ Error checking table:", error);
      return;
    }
    
    console.log("✅ Quotations table exists");
    
    // 2. Get existing columns
    console.log("🔍 Fetching table structure...");
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error("❌ Error fetching table structure:", fetchError);
      return;
    }
    
    // Print out the actual column names
    const existingColumns = quotation && quotation.length > 0 
      ? Object.keys(quotation[0]) 
      : [];
    
    console.log("📋 Existing columns:", existingColumns);
    
    // 3. Check what columns are needed in the code
    console.log("\n🔍 Analyzing what columns are referenced in the code...");
    
    // We should look at the actual code files to determine what columns are needed
    // This is a simulated list based on what we've seen in our previous work
    const requiredColumns = [
      'id',
      'user_id',
      'client_id',
      'project_id',
      'quotation_number',
      'title',
      'status',
      'issue_date',
      'valid_until',
      'subtotal',
      'gst_type',
      'tax_rate',
      'tax_amount',
      'discount_amount',
      'total_amount',
      'currency',
      'notes',
      'terms_conditions', // This might be called 'terms' in the database
      'template',
      'items',
      'created_at',
      'updated_at'
    ];
    
    console.log("📋 Required columns:", requiredColumns);
    
    // 4. Compare and identify missing columns
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    console.log("\n📊 Missing columns:", missingColumns);
    
    // 5. Identify column name mismatches
    console.log("\n🔍 Checking for potential column name mismatches...");
    const potentialMismatches = [
      { required: 'terms_conditions', actual: 'terms' },
      // Add other potential mismatches here
    ];
    
    for (const match of potentialMismatches) {
      if (existingColumns.includes(match.actual) && missingColumns.includes(match.required)) {
        console.log(`⚠️ Potential mismatch: Your code uses '${match.required}' but the database has '${match.actual}'`);
      }
    }
    
    // 6. Recommendations
    console.log("\n💡 Recommendations:");
    if (missingColumns.length > 0) {
      console.log("1. Add the missing columns to the database table, OR");
      console.log("2. Update your code to use the existing column names");
      console.log("\nTo fix in code, make these changes:");
      for (const match of potentialMismatches) {
        if (existingColumns.includes(match.actual) && missingColumns.includes(match.required)) {
          console.log(`- Update references from '${match.required}' to '${match.actual}'`);
        }
      }
    } else {
      console.log("✅ Your table structure appears complete!");
    }
    
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

main().catch(console.error);