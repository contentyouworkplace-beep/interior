-- 🎨 Portfolio System - Quick Database Setup (Aligned with PortfolioService)
-- Copy/paste this entire script into Supabase SQL Editor and run it

-- 0) Optional: ensure gen_random_uuid is available
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Portfolio Projects (table used by the app: "portfolio_projects")
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    project_date DATE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',        -- 'draft' | 'published' | 'archived'
    featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Public sharing
    public_id VARCHAR(50) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    public_access_expires_at TIMESTAMP WITH TIME ZONE
);

-- 2) Portfolio Media (table used by the app: "portfolio_media")
CREATE TABLE IF NOT EXISTS portfolio_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,

    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,            -- 'image' | 'video'
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT,

    -- Storage paths (Supabase Storage)
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'portfolio-media',
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),

    -- Video-specific (nullable for images)
    video_duration INTEGER,
    video_status VARCHAR(50) DEFAULT 'uploading',
    hls_path VARCHAR(500),
    mp4_path VARCHAR(500),
    processing_job_id VARCHAR(255),

    -- Display
    title VARCHAR(255),
    description TEXT,
    alt_text VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Technical metadata
    width INTEGER,
    height INTEGER,
    aspect_ratio DECIMAL(10,4),

    -- Metadata
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Portfolio Categories (used by filters/labels)
CREATE TABLE IF NOT EXISTS portfolio_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, slug)
);

-- 4) Portfolio Shares (public/private share links)
CREATE TABLE IF NOT EXISTS portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    share_token VARCHAR(100) NOT NULL UNIQUE,
    share_type VARCHAR(50) NOT NULL DEFAULT 'public',  -- 'public' | 'password' | 'expires'
    password_hash VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_download BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT FALSE,
    watermark_enabled BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5) Video Processing Jobs (optional, for background processing)
CREATE TABLE IF NOT EXISTS video_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES portfolio_media(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL DEFAULT 'convert',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    input_path VARCHAR(500) NOT NULL,
    output_paths JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_user_id ON portfolio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_organization_id ON portfolio_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_client_id ON portfolio_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_status ON portfolio_projects(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_public_id ON portfolio_projects(public_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_featured ON portfolio_projects(featured);

CREATE INDEX IF NOT EXISTS idx_portfolio_media_project_id ON portfolio_media(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_file_type ON portfolio_media(file_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_video_status ON portfolio_media(video_status);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_sort_order ON portfolio_media(sort_order);

CREATE INDEX IF NOT EXISTS idx_portfolio_categories_org ON portfolio_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_categories_slug ON portfolio_categories(slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_shares_project_id ON portfolio_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_token ON portfolio_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_expires_at ON portfolio_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_video_jobs_media_id ON video_processing_jobs(media_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_processing_jobs(status);

-- 7) Row Level Security (RLS)
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies aligned with the app
DO $$
BEGIN
    -- Projects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_projects' AND policyname = 'Users can view their own projects'
    ) THEN
        CREATE POLICY "Users can view their own projects" ON portfolio_projects
            FOR SELECT USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_projects' AND policyname = 'Users can insert their own projects'
    ) THEN
        CREATE POLICY "Users can insert their own projects" ON portfolio_projects
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_projects' AND policyname = 'Users can update their own projects'
    ) THEN
        CREATE POLICY "Users can update their own projects" ON portfolio_projects
            FOR UPDATE USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_projects' AND policyname = 'Users can delete their own projects'
    ) THEN
        CREATE POLICY "Users can delete their own projects" ON portfolio_projects
            FOR DELETE USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_projects' AND policyname = 'Public access for shared projects'
    ) THEN
        CREATE POLICY "Public access for shared projects" ON portfolio_projects
            FOR SELECT USING (is_public = true AND (public_access_expires_at IS NULL OR public_access_expires_at > NOW()));
    END IF;

    -- Media (users can manage media of their projects)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_media' AND policyname = 'Users can manage their project media'
    ) THEN
        CREATE POLICY "Users can manage their project media" ON portfolio_media
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM portfolio_projects p
                    WHERE p.id = portfolio_media.project_id
                    AND p.user_id = auth.uid()
                )
            );
    END IF;

        -- Categories (simple, allow authenticated users)
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_categories' AND policyname = 'Authenticated users can view categories'
        ) THEN
            CREATE POLICY "Authenticated users can view categories" ON portfolio_categories
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_categories' AND policyname = 'Authenticated users can modify categories'
        ) THEN
            CREATE POLICY "Authenticated users can modify categories" ON portfolio_categories
                FOR ALL USING (auth.role() = 'authenticated');
        END IF;

    -- Shares
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_shares' AND policyname = 'Users can manage their project shares'
    ) THEN
        CREATE POLICY "Users can manage their project shares" ON portfolio_shares
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM portfolio_projects p
                    WHERE p.id = portfolio_shares.project_id
                    AND p.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 8) updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9) Triggers
DROP TRIGGER IF EXISTS trg_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER trg_portfolio_projects_updated_at
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_portfolio_media_updated_at ON portfolio_media;
CREATE TRIGGER trg_portfolio_media_updated_at
    BEFORE UPDATE ON portfolio_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Done
SELECT 'Created tables: portfolio_projects, portfolio_media, portfolio_categories, portfolio_shares, video_processing_jobs' AS message;