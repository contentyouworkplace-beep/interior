#!/usr/bin/env node

/**
 * Apply RLS SELECT policy fix directly to Supabase
 * This script executes SQL statements one by one using Supabase Admin API
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Extract REST API URL
const restUrl = supabaseUrl.replace('https://', '').replace('http://', '');

const sqlStatements = [
  // Drop conflicting policies
  `DROP POLICY IF EXISTS "Allow all operations on quotations" ON quotations`,
  `DROP POLICY IF EXISTS "quotations_user_isolation" ON quotations`,
  `DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations`,
  
  // Drop individual policies to recreate
  `DROP POLICY IF EXISTS "Users can view own quotations" ON quotations`,
  `DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations`,
  `DROP POLICY IF EXISTS "Users can update own quotations" ON quotations`,
  `DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations`,
  
  // Create SELECT policy (THE CRITICAL ONE)
  `CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT USING (auth.uid() = user_id)`,
  
  // Create INSERT policy
  `CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  
  // Create UPDATE policy
  `CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  
  // Create DELETE policy
  `CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE USING (auth.uid() = user_id)`,
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: restUrl,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyPolicies() {
  console.log('🔧 Applying RLS policies for quotations table...\n');

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const shortSql = sql.length > 70 ? sql.substring(0, 70) + '...' : sql;
    
    console.log(`[${i + 1}/${sqlStatements.length}] ${shortSql}`);
    
    try {
      const result = await executeSQL(sql);
      
      if (result.success) {
        console.log('     ✅ Success\n');
      } else {
        console.log(`     ⚠️  Status ${result.statusCode}: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ All statements executed!\n');
}

applyPolicies().catch(console.error);
