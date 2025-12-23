# Production actions — 2025-11-19

Summary
-------
- Date: 2025-11-19
- Environment: production server `ost-linux`, repo `wtt1616/isar` (branch `main`)
- Outcome: production build succeeded and site is serving; missing DB columns were added and build-time dynamic-route errors were resolved.

What I changed / ran
---------------------
1. Database migration
   - Created and executed an idempotent migration script: `scripts/add_schedules_columns.sh`.
   - This script checks for and adds `created_by` and `modified_by` columns to the `schedules` table, adds indexes, and attempts to add FK constraints to `users(id)` (prints a warning if FK creation fails).
   - Backup created before schema changes: `~/isar/isar_backup_before_migration_2025-11-19.sql` (if performed by operator).

2. Code fixes to build runtime
   - Marked the profile API route as dynamic to avoid static rendering error:
     - File: `app/api/profile/route.ts`
     - Change: added `export const dynamic = 'force-dynamic';` at top of file.
   - Fixed path alias resolution issues in production builds by ensuring `tsconfig.json` contains `baseUrl` and adding `jsconfig.json`.

3. Line-ending normalization
   - Normalized line endings and committed; Windows working copy showed an LF→CRLF message during commit which was resolved by renormalizing and committing.

Commands run (server)
---------------------
The key server commands executed during the incident were (run on `ost-linux` inside `~/isar`):

```bash
# fetch latest code
git pull origin main

# backup (recommended)
mysqldump -u myopensoft-isar -p isar > ~/isar_backup_before_migration_2025-11-19.sql

# migration script (idempotent)
chmod +x scripts/add_schedules_columns.sh
./scripts/add_schedules_columns.sh

# install + build + restart
npm ci --production
npm run build
pm2 restart ecosystem.config.js --env production
pm2 logs --lines 200
```

Observations / errors
---------------------
- Initial production build failed with: "Dynamic server usage: Route /api/profile couldn't be rendered statically because it used `headers`." — fixed by marking the route dynamic.
- Runtime SQL errors (ER_BAD_FIELD_ERROR) complaining about `schedules.created_by`/`modified_by` were resolved after the migration script was applied; subsequent ALTER attempts reported duplicate columns/constraints, indicating the migration had already been applied.

Follow-ups / recommendations
----------------------------
- Monitor `pm2 logs` for several hours to catch any remaining or intermittent errors.
- Verify critical user flows (login, schedule creation/editing, profile update) from the UI.
- Keep the DB backup until production has been stable for at least one day.
- (Optional) Add explicit tests to CI that exercise API endpoints which require server-side headers/cookies so dynamic routes are known at build-time.

PR / commit guidance
--------------------
I added this file to `docs/PRODUCTION_ACTIONS_2025-11-19.md` in the working tree. To create a PR documenting these actions, run the following locally:

```bash
git checkout -b docs/production-actions-2025-11-19
git add docs/PRODUCTION_ACTIONS_2025-11-19.md
git commit -m "Document production actions: 2025-11-19"
git push origin docs/production-actions-2025-11-19

# Open PR with GitHub CLI (if installed)
gh pr create --fill --title "Document production actions: 2025-11-19" --body-file docs/PRODUCTION_ACTIONS_2025-11-19.md --base main

# Or open via web:
# https://github.com/wtt1616/isar/compare/main...docs/production-actions-2025-11-19?expand=1
```

Author
------
Notes prepared by the on-call engineer and repository operator.
