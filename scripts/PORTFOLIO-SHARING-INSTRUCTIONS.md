# Portfolio Sharing Scripts – Guide

This folder contains everything you need to enable, verify, and (if necessary) roll back public portfolio sharing.

## Files

| File | Purpose |
|------|---------|
| `fix-public-sharing-complete.sql` | Main script to enable public + anon read-only access to shared portfolios (transactional & idempotent). |
| `portfolio-sharing-rollback.sql` | Reverts sharing so only authenticated owners retain access (disables public / anon). |
| `portfolio-sharing-verify.sql` | Non-destructive diagnostics: lists policies, RLS status, share coverage, anomalies. |

## 1. Enabling Public Sharing

1. Open Supabase Dashboard → SQL Editor.
2. Paste contents of `fix-public-sharing-complete.sql`.
3. Run it. You should see a success banner and policy listings.
4. Copy a share link token and test:
   - Logged in tab (should work)
   - Incognito / private window (should also load project + media)

### Expected After Success
- Authenticated: Full CRUD on own portfolios.
- Public / Anonymous: Can only SELECT shared project rows + associated media + share metadata.
- Expired shares (expires_at < now) are excluded.

## 2. Verifying State Anytime

Run `portfolio-sharing-verify.sql` to inspect:
- RLS enabled flags
- Policies per table
- Active vs expired shares
- Media counts for top shared projects
- Anomalies (shared but no media)
- Shares expiring in next 48h

## 3. Rolling Back (Disable Public Access)
If you need to immediately revoke all public/anon access:
1. Run `portfolio-sharing-rollback.sql`.
2. Only authenticated policies remain.
3. Public share links stop functioning (should 404 / empty response via RLS).

## 4. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Portfolio list empty for logged-in user | Auth policies missing or RLS disabled | Re-run `fix-public-sharing-complete.sql` or rollback then enable script. |
| Public link returns 404 / empty | Share token row missing or expired | Check `portfolio_shares` row & `expires_at`. |
| Public can still see expired link | Clock skew or old cached policy (rare) | Confirm DB time: `SELECT NOW();` Update or delete the share row. |
| Performance slow on share lookup | Missing indexes | Ensure script created `idx_portfolio_shares_token` & `idx_portfolio_shares_project`. |
| Want to temporarily pause sharing | Need quick disable | Run rollback script, later re-enable main script. |

## 5. Security Notes
- Public / anon roles ONLY have SELECT on qualifying share rows; no mutation policies granted.
- Owners are determined strictly by `user_id = auth.uid()`.
- Policy logic isolates by project ID membership in active share set.
- No reliance on `NOW()` in indexes (immutability constraint avoided).

## 6. Operational Best Practices
- Keep these scripts versioned; bump filename suffix if logic changes.
- After major schema changes to portfolio tables, re-run verify script.
- Periodically prune or expire old shares if policy requires it.
- Consider adding an audit trigger if public access requires logging.

## 7. Extending Functionality (Optional Ideas)
- Add password-protected shares (additional column + policy check with hash).
- Add max view count column and decrement on access via RPC + security definer function.
- Add soft-delete flag and exclude in policies (avoid volatile expressions in predicates).

## 8. Manual Share Creation Checklist
If inserting a share manually:
```sql
INSERT INTO portfolio_shares (project_id, share_token, expires_at)
VALUES ('<project-uuid>', '<random-token>', NOW() + INTERVAL '7 days');
```
Then verify via:
```sql
SELECT * FROM portfolio_shares WHERE share_token = '<random-token>';
```

## 9. Validation Flow After Fresh Enable
1. Run enable script.
2. Run verify script — confirm policies & active shares.
3. Visit share link (authenticated) → should load.
4. Visit same link incognito → should load same data (no edit controls).
5. Expire share manually:
```sql
UPDATE portfolio_shares SET expires_at = NOW() - INTERVAL '1 minute' WHERE share_token = '<token>';
```
6. Reload incognito page → should now fail or return empty.

## 10. Emergency Checklist
| Goal | Action |
|------|--------|
| Stop all public viewing | Run rollback script |
| Restore sharing | Run enable script |
| Inspect state | Run verify script |
| Diagnose missing data | Check RLS enabled + authenticated policies |

---
Maintainer Tip: Keep policy names stable; tooling & rollback rely on exact string matches.

For questions or enhancements, document rationale alongside any new SQL.
