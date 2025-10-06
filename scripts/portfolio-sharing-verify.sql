-- ========================================
-- PORTFOLIO SHARING VERIFICATION
-- ========================================
-- PURPOSE:
--   Provides a consolidated diagnostic view after running sharing or rollback scripts.
-- WHAT IT SHOWS:
--   • RLS status per table
--   • Policies grouped by table
--   • Counts of total vs shareable projects
--   • Expired vs active shares
--   • Sample of active share tokens
--   • Media counts per shared project (first 10)
--   • Potential anomalies (projects with shares but zero media)
-- USAGE:
--   Run in Supabase SQL Editor any time to audit state.
-- ========================================
SET search_path TO public;

-- RLS status
SELECT 'RLS_STATUS' AS section, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('portfolio_projects','portfolio_media','portfolio_shares')
ORDER BY tablename;

-- Policies detail
SELECT 'POLICIES' AS section, tablename, policyname, cmd, roles::text[] AS roles, permissive
FROM pg_policies
WHERE tablename IN ('portfolio_projects','portfolio_media','portfolio_shares')
ORDER BY tablename, policyname;

-- Share summary
SELECT 'SHARE_SUMMARY' AS section,
  COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > NOW()) AS active_shares,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW()) AS expired_shares,
  COUNT(*) AS total_shares
FROM portfolio_shares;

-- Project sharing coverage
SELECT 'PROJECT_COVERAGE' AS section,
  (SELECT COUNT(*) FROM portfolio_projects) AS total_projects,
  (SELECT COUNT(DISTINCT project_id) FROM portfolio_shares WHERE expires_at IS NULL OR expires_at > NOW()) AS projects_with_active_shares,
  (SELECT COUNT(*) FROM portfolio_projects p WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_shares s WHERE s.project_id = p.id AND (s.expires_at IS NULL OR s.expires_at > NOW())
  )) AS projects_without_active_shares;

-- Sample active shares
SELECT 'ACTIVE_SHARE_SAMPLES' AS section, project_id, share_token, expires_at, created_at
FROM portfolio_shares
WHERE expires_at IS NULL OR expires_at > NOW()
ORDER BY created_at DESC
LIMIT 10;

-- Media counts for shared projects
SELECT 'MEDIA_PER_SHARED_PROJECT' AS section, p.id AS project_id, p.title,
  COUNT(m.id) AS media_count
FROM portfolio_projects p
JOIN portfolio_shares s ON s.project_id = p.id AND (s.expires_at IS NULL OR s.expires_at > NOW())
LEFT JOIN portfolio_media m ON m.project_id = p.id
GROUP BY p.id, p.title
ORDER BY media_count DESC, p.id
LIMIT 10;

-- Projects that have active share but zero media (potential anomaly)
SELECT 'ANOMALY_EMPTY_SHARED_PROJECTS' AS section, p.id, p.title
FROM portfolio_projects p
WHERE EXISTS (
  SELECT 1 FROM portfolio_shares s
  WHERE s.project_id = p.id AND (s.expires_at IS NULL OR s.expires_at > NOW())
) AND NOT EXISTS (
  SELECT 1 FROM portfolio_media m WHERE m.project_id = p.id
);

-- Expiring soon (next 48h)
SELECT 'EXPIRING_SOON' AS section, project_id, share_token, expires_at
FROM portfolio_shares
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
ORDER BY expires_at ASC;

-- ========================================
-- END
-- ========================================
