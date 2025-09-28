const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBuckets() {
  try {
    console.log('Creating storage buckets for quotes and invoices...');

    // Create quotation-attachments bucket
    const { data: quotationBucket, error: quotationError } = await supabase.storage
      .createBucket('quotation-attachments', {
        public: true,
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

    if (quotationError && !quotationError.message.includes('already exists')) {
      console.error('Error creating quotation-attachments bucket:', quotationError);
    } else {
      console.log('✅ Quotation attachments bucket created/verified');
    }

    // Create invoice-attachments bucket
    const { data: invoiceBucket, error: invoiceError } = await supabase.storage
      .createBucket('invoice-attachments', {
        public: true,
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

    if (invoiceError && !invoiceError.message.includes('already exists')) {
      console.error('Error creating invoice-attachments bucket:', invoiceError);
    } else {
      console.log('✅ Invoice attachments bucket created/verified');
    }

    // Set up bucket policies for quotation-attachments
    console.log('Setting up bucket policies...');
    
    const quotationPolicies = [
      {
        name: 'Allow authenticated users to upload quotation attachments',
        definition: `
          ((bucket_id = 'quotation-attachments'::text) AND (auth.role() = 'authenticated'::text))
        `,
        action: 'INSERT'
      },
      {
        name: 'Allow users to view quotation attachments',
        definition: `
          ((bucket_id = 'quotation-attachments'::text))
        `,
        action: 'SELECT'
      },
      {
        name: 'Allow authenticated users to delete own quotation attachments',
        definition: `
          ((bucket_id = 'quotation-attachments'::text) AND (auth.role() = 'authenticated'::text))
        `,
        action: 'DELETE'
      }
    ];

    const invoicePolicies = [
      {
        name: 'Allow authenticated users to upload invoice attachments',
        definition: `
          ((bucket_id = 'invoice-attachments'::text) AND (auth.role() = 'authenticated'::text))
        `,
        action: 'INSERT'
      },
      {
        name: 'Allow users to view invoice attachments',
        definition: `
          ((bucket_id = 'invoice-attachments'::text))
        `,
        action: 'SELECT'
      },
      {
        name: 'Allow authenticated users to delete own invoice attachments',
        definition: `
          ((bucket_id = 'invoice-attachments'::text) AND (auth.role() = 'authenticated'::text))
        `,
        action: 'DELETE'
      }
    ];

    // Note: Bucket policies are typically set up through the Supabase dashboard
    // or using the SQL editor. The storage.createPolicy() method might not be available
    // in the JavaScript client. You would typically run these in the SQL editor:

    console.log('📝 Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
-- Storage policies for quotation-attachments
CREATE POLICY "Allow authenticated users to upload quotation attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quotation-attachments');

CREATE POLICY "Allow users to view quotation attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'quotation-attachments');

CREATE POLICY "Allow authenticated users to delete own quotation attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quotation-attachments');

-- Storage policies for invoice-attachments  
CREATE POLICY "Allow authenticated users to upload invoice attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoice-attachments');

CREATE POLICY "Allow users to view invoice attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'invoice-attachments');

CREATE POLICY "Allow authenticated users to delete own invoice attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'invoice-attachments');
    `);

    console.log('✅ Storage setup completed!');
    console.log('Next steps:');
    console.log('1. Run the SQL policies above in your Supabase SQL Editor');
    console.log('2. Run the enhanced schema script: node scripts/run-enhanced-schema.js');

  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

createStorageBuckets();