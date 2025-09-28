# 🚀 Manual Database Setup Required

## Database Tables Need Creation

The portfolio tables need to be created in your Supabase dashboard. Here's the quickest way:

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ywcqtmzqsvcobtetunuf`
3. Navigate to **SQL Editor** in the sidebar
4. Click **New Query**

### Step 2: Execute Table Creation
Copy and paste this minimal SQL to create the tables:

```sql
-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_files table
CREATE TABLE IF NOT EXISTS portfolio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'video')),
  mime_type VARCHAR(100),
  file_size BIGINT,
  storage_bucket VARCHAR(100) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  title VARCHAR(255),
  alt_text VARCHAR(500),
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (for testing)
CREATE POLICY "Enable read access for all users" ON portfolios FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON portfolios FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON portfolios FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON portfolios FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_files FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON portfolio_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON portfolio_files FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON portfolio_files FOR DELETE USING (true);

-- Success message
SELECT 'Portfolio tables created successfully!' as message;
```

### Step 3: Run the Test Data Script
After creating the tables, run:
```bash
node add-test-portfolio-data.js
```

### Step 4: Test Your Portfolio
Visit: http://localhost:3000/portfolio

---

## What's Already Working ✅

- **Mock data removed** - No more fake portfolio cards
- **Real Supabase integration** - Components are connected to live database
- **Storage buckets created** - Ready for file uploads
- **Service layer complete** - Full CRUD operations available
- **Type-safe integration** - All components use proper TypeScript types

## What You'll See After Setup

1. **Empty state** when no portfolios exist (clean, no mock data)
2. **Real portfolios** from Supabase database
3. **Working creation** - Add new portfolios that persist
4. **File upload ready** - Storage infrastructure in place