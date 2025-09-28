-- Portfolio System Database Schema
-- Run this in Supabase SQL Editor

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organization_profiles(organization_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('residential', 'commercial', 'individual', 'corporate', 'hospitality', 'other')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    tags TEXT[], -- Array of tags for filtering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_files table to store file metadata
CREATE TABLE IF NOT EXISTS portfolio_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- image/jpeg, video/mp4, application/pdf, etc.
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL, -- Path in Supabase Storage
    thumbnail_path VARCHAR(500), -- Path to generated thumbnail
    display_order INTEGER DEFAULT 0,
    alt_text TEXT,
    caption TEXT,
    is_cover BOOLEAN DEFAULT FALSE, -- Mark as portfolio cover image
    upload_status VARCHAR(50) DEFAULT 'completed' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
    metadata JSONB, -- Additional metadata like dimensions, duration, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_views table for analytics (optional)
CREATE TABLE IF NOT EXISTS portfolio_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_organization_id ON portfolios(organization_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_portfolios_public ON portfolios(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_files_portfolio_id ON portfolio_files(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_display_order ON portfolio_files(portfolio_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_cover ON portfolio_files(portfolio_id, is_cover) WHERE is_cover = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_files_type ON portfolio_files(file_type);

CREATE INDEX IF NOT EXISTS idx_portfolio_views_portfolio_id ON portfolio_views(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewed_at ON portfolio_views(viewed_at DESC);

-- Add updated_at trigger for portfolios
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_views ENABLE ROW LEVEL SECURITY;

-- Policies for portfolios table
CREATE POLICY "Users can view their own portfolios" ON portfolios
    FOR SELECT USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        ) OR
        is_public = true
    );

CREATE POLICY "Users can create portfolios for their organization" ON portfolios
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization's portfolios" ON portfolios
    FOR UPDATE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their organization's portfolios" ON portfolios
    FOR DELETE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policies for portfolio_files table
CREATE POLICY "Users can view files from accessible portfolios" ON portfolio_files
    FOR SELECT USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            ) OR
            is_public = true
        )
    );

CREATE POLICY "Users can create files for accessible portfolios" ON portfolio_files
    FOR INSERT WITH CHECK (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update files from accessible portfolios" ON portfolio_files
    FOR UPDATE USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    ) WITH CHECK (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete files from accessible portfolios" ON portfolio_files
    FOR DELETE USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policies for portfolio_views table (more permissive for analytics)
CREATE POLICY "Anyone can create portfolio views" ON portfolio_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view analytics for their portfolios" ON portfolio_views
    FOR SELECT USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE 
            user_id = auth.uid() OR 
            organization_id IN (
                SELECT organization_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create a function to get portfolio with file counts
CREATE OR REPLACE FUNCTION get_portfolio_with_stats(portfolio_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    is_featured BOOLEAN,
    is_public BOOLEAN,
    status VARCHAR,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    file_count BIGINT,
    image_count BIGINT,
    video_count BIGINT,
    document_count BIGINT,
    total_size BIGINT,
    cover_image_path VARCHAR
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.is_featured,
        p.is_public,
        p.status,
        p.tags,
        p.created_at,
        p.updated_at,
        COUNT(pf.id) as file_count,
        COUNT(pf.id) FILTER (WHERE pf.file_type LIKE 'image/%') as image_count,
        COUNT(pf.id) FILTER (WHERE pf.file_type LIKE 'video/%') as video_count,
        COUNT(pf.id) FILTER (WHERE pf.file_type LIKE 'application/%') as document_count,
        COALESCE(SUM(pf.file_size), 0) as total_size,
        (SELECT storage_path FROM portfolio_files WHERE portfolio_id = p.id AND is_cover = true LIMIT 1) as cover_image_path
    FROM portfolios p
    LEFT JOIN portfolio_files pf ON p.id = pf.portfolio_id
    WHERE p.id = portfolio_uuid
    GROUP BY p.id, p.name, p.description, p.category, p.is_featured, p.is_public, p.status, p.tags, p.created_at, p.updated_at;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON portfolios TO authenticated;
GRANT ALL ON portfolio_files TO authenticated;
GRANT ALL ON portfolio_views TO authenticated;
GRANT EXECUTE ON FUNCTION get_portfolio_with_stats(UUID) TO authenticated;