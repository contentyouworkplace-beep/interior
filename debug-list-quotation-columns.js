const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// load env
['.env.local','.env'].forEach(f=>{const p=path.join(__dirname,f);if(fs.existsSync(p)){const c=fs.readFileSync(p,'utf8');c.split('\n').forEach(l=>{const m=l.match(/^([^#=]+)=(.*)$/);if(m){process.env[m[1].trim()]=m[2].trim().replace(/^["']|["']$/g,'');}})}});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔍 Listing quotations table columns (first row)');
  const { data, error } = await supabase.from('quotations').select('*').limit(1);
  if (error) { console.error('Error selecting quotations:', error); process.exit(1);}  
  if (!data || data.length===0) { console.log('No rows yet. Will insert a dummy select of table structure via rpc not available.'); }
  else {
    const row = data[0];
    console.log('Columns present:', Object.keys(row));
    console.log('Row sample:', row);
  }
})();