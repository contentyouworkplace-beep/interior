-- Additional RLS policies to allow INSERT operations under RLS
-- Run after quick-portfolio-setup.sql

-- portfolio_media: allow inserting media for owned projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_media' AND policyname = 'Users can insert their project media'
  ) THEN
    CREATE POLICY "Users can insert their project media" ON portfolio_media
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM portfolio_projects p
          WHERE p.id = portfolio_media.project_id
          AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- portfolio_categories: authenticated users can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_categories' AND policyname = 'Authenticated users can insert categories'
  ) THEN
    CREATE POLICY "Authenticated users can insert categories" ON portfolio_categories
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- portfolio_shares: allow inserting shares for owned projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_shares' AND policyname = 'Users can insert their project shares'
  ) THEN
    CREATE POLICY "Users can insert their project shares" ON portfolio_shares
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM portfolio_projects p
          WHERE p.id = portfolio_shares.project_id
          AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;
