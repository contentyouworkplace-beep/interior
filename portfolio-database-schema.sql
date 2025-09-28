-- Portfolio System Database Schema
-- Execute this SQL in your Supabase SQL Editor if tables don't exist

-- 1. Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    
    -- Basic project info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints (adjust as needed for your organization structure)
    CONSTRAINT fk_portfolios_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE
);

-- 2. Create portfolio_files table (media files)
CREATE TABLE IF NOT EXISTS portfolio_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) CHECK (file_type IN ('image', 'video')),
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Storage paths
    storage_bucket VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    
    -- Display metadata
    title VARCHAR(255),
    alt_text VARCHAR(500),
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Video-specific fields
    video_duration INTEGER, -- in seconds
    video_status VARCHAR(20) DEFAULT 'ready' CHECK (video_status IN ('uploading', 'processing', 'ready', 'error')),
    hls_path VARCHAR(500),
    mp4_path VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_portfolio_files_project 
        FOREIGN KEY (project_id) 
        REFERENCES portfolios(id) 
        ON DELETE CASCADE
);

-- 3. Create portfolio_views table (analytics)
CREATE TABLE IF NOT EXISTS portfolio_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    
    -- View metadata
    viewer_ip INET,
    viewer_user_agent TEXT,
    referrer TEXT,
    
    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_portfolio_views_project 
        FOREIGN KEY (project_id) 
        REFERENCES portfolios(id) 
        ON DELETE CASCADE
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_organization ON portfolios(organization_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios(featured);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_files_project ON portfolio_files(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_type ON portfolio_files(file_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_sort_order ON portfolio_files(project_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_portfolio_views_project ON portfolio_views(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_date ON portfolio_views(viewed_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_views ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (adjust based on your auth setup)

-- Portfolio policies
DROP POLICY IF EXISTS "Users can view published portfolios" ON portfolios;
CREATE POLICY "Users can view published portfolios" ON portfolios
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Organization members can manage portfolios" ON portfolios;
CREATE POLICY "Organization members can manage portfolios" ON portfolios
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Portfolio files policies
DROP POLICY IF EXISTS "Users can view published portfolio files" ON portfolio_files;
CREATE POLICY "Users can view published portfolio files" ON portfolio_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM portfolios WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Organization members can manage portfolio files" ON portfolio_files;
CREATE POLICY "Organization members can manage portfolio files" ON portfolio_files
    FOR ALL USING (
        project_id IN (
            SELECT id FROM portfolios 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Portfolio views policies (insert only for tracking)
DROP POLICY IF EXISTS "Anyone can log portfolio views" ON portfolio_views;
CREATE POLICY "Anyone can log portfolio views" ON portfolio_views
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Organization members can view analytics" ON portfolio_views;
CREATE POLICY "Organization members can view analytics" ON portfolio_views
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM portfolios 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Add updated_at triggers
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_files_updated_at ON portfolio_files;
CREATE TRIGGER update_portfolio_files_updated_at
    BEFORE UPDATE ON portfolio_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Portfolio database schema created successfully!' as message;