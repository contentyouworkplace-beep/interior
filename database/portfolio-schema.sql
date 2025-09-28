-- Portfolio Module Database Schema
-- Lightweight design for minimal CRM load

-- Portfolio Projects Table
CREATE TABLE portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Residential', 'Commercial', 'Hospitality'
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255), -- Denormalized for performance
    project_date DATE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Public sharing
    public_id VARCHAR(50) UNIQUE, -- Short public identifier for sharing
    is_public BOOLEAN DEFAULT FALSE,
    public_access_expires_at TIMESTAMP WITH TIME ZONE
);

-- Portfolio Media Table (Images & Videos)
-- CRM only stores metadata, actual files in Supabase Storage
CREATE TABLE portfolio_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video'
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    
    -- Storage paths (Supabase Storage)
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'portfolio-media',
    storage_path VARCHAR(500) NOT NULL, -- Path in Supabase bucket
    thumbnail_path VARCHAR(500), -- Thumbnail for videos/large images
    
    -- Video-specific fields (null for images)
    video_duration INTEGER, -- Duration in seconds
    video_status VARCHAR(50) DEFAULT 'uploading', -- 'uploading', 'processing', 'ready', 'error'
    hls_path VARCHAR(500), -- Path to .m3u8 file after conversion
    mp4_path VARCHAR(500), -- Path to MP4 file after conversion
    processing_job_id VARCHAR(255), -- Background job reference
    
    -- Display properties
    title VARCHAR(255),
    description TEXT,
    alt_text VARCHAR(500), -- For accessibility
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Technical metadata
    width INTEGER,
    height INTEGER,
    aspect_ratio DECIMAL(10,4), -- Calculated: width/height
    
    -- Metadata
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Categories (for organization)
CREATE TABLE portfolio_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Icon identifier
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, slug)
);

-- Portfolio Sharing Settings
CREATE TABLE portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    
    -- Sharing configuration
    share_token VARCHAR(100) NOT NULL UNIQUE,
    share_type VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'password', 'expires'
    password_hash VARCHAR(255), -- For password-protected shares
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Access control
    allow_download BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT FALSE,
    watermark_enabled BOOLEAN DEFAULT FALSE,
    
    -- Analytics (lightweight)
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Processing Jobs (for tracking background work)
CREATE TABLE video_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES portfolio_media(id) ON DELETE CASCADE,
    
    -- Job details
    job_type VARCHAR(50) NOT NULL DEFAULT 'convert', -- 'convert', 'thumbnail', 'optimize'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Input/Output
    input_path VARCHAR(500) NOT NULL,
    output_paths JSONB, -- Array of output file paths
    
    -- Processing details
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_metadata JSONB, -- FFmpeg details, etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_portfolio_projects_user_id ON portfolio_projects(user_id);
CREATE INDEX idx_portfolio_projects_organization_id ON portfolio_projects(organization_id);
CREATE INDEX idx_portfolio_projects_client_id ON portfolio_projects(client_id);
CREATE INDEX idx_portfolio_projects_status ON portfolio_projects(status);
CREATE INDEX idx_portfolio_projects_public_id ON portfolio_projects(public_id);
CREATE INDEX idx_portfolio_projects_featured ON portfolio_projects(featured);

CREATE INDEX idx_portfolio_media_project_id ON portfolio_media(project_id);
CREATE INDEX idx_portfolio_media_file_type ON portfolio_media(file_type);
CREATE INDEX idx_portfolio_media_video_status ON portfolio_media(video_status);
CREATE INDEX idx_portfolio_media_sort_order ON portfolio_media(sort_order);

CREATE INDEX idx_portfolio_categories_organization_id ON portfolio_categories(organization_id);
CREATE INDEX idx_portfolio_categories_slug ON portfolio_categories(slug);

CREATE INDEX idx_portfolio_shares_project_id ON portfolio_shares(project_id);
CREATE INDEX idx_portfolio_shares_token ON portfolio_shares(share_token);
CREATE INDEX idx_portfolio_shares_expires_at ON portfolio_shares(expires_at);

CREATE INDEX idx_video_jobs_media_id ON video_processing_jobs(media_id);
CREATE INDEX idx_video_jobs_status ON video_processing_jobs(status);

-- Row Level Security (RLS) Policies
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_projects
CREATE POLICY "Users can view their own projects" ON portfolio_projects
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON portfolio_projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON portfolio_projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON portfolio_projects
    FOR DELETE USING (user_id = auth.uid());

-- Public access for shared projects
CREATE POLICY "Public access for shared projects" ON portfolio_projects
    FOR SELECT USING (is_public = true AND (public_access_expires_at IS NULL OR public_access_expires_at > NOW()));

-- Similar RLS policies for other tables...
CREATE POLICY "Users can manage their project media" ON portfolio_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            WHERE id = portfolio_media.project_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization categories" ON portfolio_categories
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their project shares" ON portfolio_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            WHERE id = portfolio_shares.project_id 
            AND user_id = auth.uid()
        )
    );

-- Public access for valid shares
CREATE POLICY "Public access for valid shares" ON portfolio_shares
    FOR SELECT USING (
        expires_at IS NULL OR expires_at > NOW()
    );

CREATE POLICY "Users can manage their video jobs" ON video_processing_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM portfolio_media pm
            JOIN portfolio_projects pp ON pm.project_id = pp.id
            WHERE pm.id = video_processing_jobs.media_id 
            AND pp.user_id = auth.uid()
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_portfolio_projects_updated_at
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_updated_at();

CREATE TRIGGER update_portfolio_media_updated_at
    BEFORE UPDATE ON portfolio_media
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_updated_at();

-- Function to generate public ID for projects
CREATE OR REPLACE FUNCTION generate_public_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_public = true AND NEW.public_id IS NULL THEN
        NEW.public_id = lower(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM portfolio_projects WHERE public_id = NEW.public_id) LOOP
            NEW.public_id = lower(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_portfolio_public_id
    BEFORE INSERT OR UPDATE ON portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_public_id();