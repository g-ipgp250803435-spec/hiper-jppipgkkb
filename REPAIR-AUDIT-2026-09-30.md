# HiPER Codebase Repair Audit — 30 September 2026

## Outcome

This pass focused on production-blocking defects, security, deployment reliability, and avoiding misleading UI behavior. The canonical application is the `src/` tree; older root-level compatibility files were intentionally left in place because they are not included by `tsconfig.app.json` and removing them could break external workflows or documentation that still references them.

## Repair timeline used

1. **Inventory & architecture** — confirmed Vite + React + TypeScript + Supabase + Vercel, identified `src/` as the production source and reviewed routing, auth, storage, CMS, notifications, SQL migrations and CI.
2. **Security & access control** — checked auth routing, RLS assumptions, user-controlled/CMS URLs, upload MIME/size rules, and response headers.
3. **Functional reliability** — inspected booking RPC handling, CMS notifications, admin notifications, Supabase configuration behavior, and storage consistency.
4. **Static verification** — parsed every TS/TSX source file (frontend and Supabase Edge Function), validated JSON configs, checked relative imports, and reviewed new SQL migration transaction structure.
5. **Packaging** — excluded transient `node_modules`, `dist`, and TypeScript build-info files; included this audit and deployment checklist.

## Important fixes applied

### 1. Protected routes no longer fail open

Previously, `/portal` and `/admin` rendered their protected content when Supabase environment variables were missing. That behavior was convenient for demos but unsafe/misleading for production. Protected routes now require a real authenticated user; admin additionally requires `profile.role === 'admin'`.

### 2. Supabase configuration validation hardened

`isSupabaseConfigured` no longer treats arbitrary non-empty strings as a valid Supabase setup. It now rejects invalid URLs, obvious placeholder/example values, and implausibly short keys. This prevents accidental deployment against `.env.example`-style values.

### 3. Login screen handles missing backend configuration clearly

The Google sign-in button is disabled when Supabase is not configured, and the page shows a clear setup notice naming the required Vercel variables instead of allowing a user to click into a guaranteed failure.

### 4. CMS/external URL sanitization strengthened

The URL sanitizer now uses an allow-list approach. It accepts app-local links plus HTTP/HTTPS, `mailto:` and `tel:` where appropriate, while rejecting JavaScript/data/VBScript, protocol-relative URLs, file URLs, and unknown schemes.

CMS button/link URLs and external booking links now pass through this sanitizer. CMS/booking image URLs use an image-specific sanitizer that only accepts app-local or HTTP/HTTPS image locations.

### 5. Upload limits aligned with Supabase Storage

The private-file helper previously allowed 10 MB by default while the Supabase bucket is configured for 5 MB. That caused users to pass client validation and then fail at upload time. The client default is now 5 MB, matching Storage.

### 6. SVG uploads removed from user-managed public media

Editable SVG is powerful enough to create avoidable content/security complications. Browser/admin file inputs now restrict uploads to raster/icon formats, the helper rejects SVG, and a new migration aligns the `public-media` bucket MIME allow-list.

New migration:

- `supabase/migrations/20260930000000_media_upload_hardening.sql`

### 7. Admin in-app notifications repaired

Application pages called `notifyAdmins`, but RLS only allowed administrators to insert into `notifications`, so ordinary users' admin notifications were silently rejected. `notifyAdmins` now uses a constrained `SECURITY DEFINER` RPC which verifies that the caller is an allowed authenticated user or admin, validates notification type/content, and creates an admin-only notification.

### 8. CMS "notify subscribers" repaired

The previous CMS publishing path called `notifyUser('all', ...)`. The `recipient_id` column is UUID, so `'all'` could never be stored. It also attempted to place a page slug into UUID `reference_id`, which was invalid. The frontend now resolves profile IDs and creates one notification per user, with a null reference ID for CMS notices.

The database notification-type constraint is also extended to include `cms_page`.

New migration:

- `supabase/migrations/20260930010000_notification_reliability.sql`

### 9. Security response headers improved

Vercel headers were tightened:

- removed unnecessary `unsafe-eval` from `script-src`
- removed browser-side Resend connectivity that the frontend does not require
- explicitly allowed Supabase WebSocket connections
- added `base-uri 'self'`, `form-action 'self'`, and `object-src 'none'`
- set deprecated `X-XSS-Protection` to `0`
- added HSTS and Cross-Origin-Opener-Policy

Inline styles remain allowed because the current React UI uses many `style={...}` attributes.

### 10. Type quality improved in booking RPC helper

Obvious `any` values in the room-booking response helper were replaced with `unknown` / `Record<string, unknown>`, preserving behavior while reducing accidental unsafe assumptions.

### 11. URL tests expanded

Automated helper tests now cover protocol-relative URLs, unknown schemes, safe mail/telephone links, and image URL restrictions.

## Verification completed here

- All relative imports under `src/` resolve to existing local files.
- 56 TypeScript/TSX files across `src/` and the Supabase Edge Function were parsed successfully with TypeScript 5.8.3; no syntax-error files were found.
- `package.json`, `vercel.json`, and TypeScript JSON configuration files parse successfully.
- New SQL migrations have balanced explicit `BEGIN;` / `COMMIT;` transaction wrappers.
- No `node_modules`, `dist`, or generated `.tsbuildinfo` files are included in the repaired package.

## What could not be fully verified inside this sandbox

A clean dependency installation repeatedly timed out in the execution environment. Because `npm ci` was interrupted, its half-created `node_modules` produced false "missing type definition" errors. For that reason I am **not** claiming that I completed a clean local `npm run typecheck`, `npm test`, and `npm run build` after repair.

Your GitHub workflow already runs exactly those quality gates on a normal runner. The final deployment checklist below tells you how to confirm them without coding knowledge.

I also cannot inspect your live Supabase project, Vercel environment variables, Google OAuth configuration, Resend secrets, DNS, or production database state from the ZIP alone. These external systems determine whether authentication, database migrations, email notifications, and the deployed domain work end-to-end.

## A-to-Z publish checklist (no coding knowledge assumed)

### A. Upload this repaired project to GitHub

Replace the repository files with the contents of the repaired folder/ZIP. Do **not** upload a `.env` file or `node_modules`.

### B. Wait for GitHub Actions

Open your GitHub repository → **Actions** → open **HiPER Quality Gate & Continuous Integration**. The run should be green for:

1. Install Dependencies
2. TypeScript Type Checking
3. Execute Automated Test Suite
4. Build Production Bundle

If any step is red, copy the complete red error text into ChatGPT. Do not paraphrase it.

### C. Apply Supabase migrations

The two new migrations in this repair must reach your production Supabase database. If your repository/Vercel process does not automatically run Supabase migrations, use the Supabase CLI from a trusted development machine or Supabase-supported migration workflow. Do not paste the legacy root `schema.sql` over production; that file is explicitly a legacy snapshot.

At minimum production must include:

- `20260930000000_media_upload_hardening.sql`
- `20260930010000_notification_reliability.sql`

### D. Confirm Vercel environment variables

In Vercel → Project → Settings → Environment Variables, confirm these exist for Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOWED_EMAIL_DOMAINS` (currently intended default: `moe-dl.edu.my`)
- `VITE_SITE_NAME` (optional)
- `VITE_INSTITUTION_NAME` (optional)

Never place `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_...` variable. Anything prefixed `VITE_` is browser-visible.

### E. Confirm Supabase Google OAuth

In Supabase Authentication provider settings, Google must be enabled. Its authorized callback/redirect configuration must match your current Supabase project and Vercel production domain. The application itself redirects back to `/auth/callback`.

### F. Confirm first admin

A production admin must have `profiles.role = 'admin'`. Do not make every DELIMa account an admin. Test with one appointed admin account and one normal allowed-domain account.

### G. Test these exact user journeys

1. Public visitor: Home, e-Aset catalogue, Tabung Jumaat public summary, announcements, organization, CMS/privacy page.
2. Normal DELIMa user: Google login → portal → create iKES application → create e-Aset request → donation → room booking → cancel a pending request where offered.
3. Admin: login → `/admin` → approve/reject requests → manage assets → announcements → organization → CMS → site settings.
4. Notifications: submit one application as normal user; verify an admin sees the in-app notification. Publish a CMS page with subscriber notification enabled; verify normal users receive it.
5. Uploads: test JPG/PNG/WEBP under 5 MB; verify an SVG and a file over 5 MB are rejected.
6. Mobile: repeat homepage, navigation drawer, login and at least one form on a phone-size screen.

### H. Redeploy Vercel

After GitHub CI is green and Supabase migrations/environment variables are correct, redeploy Production from Vercel. Then test the production URL in a private/incognito browser window so an old login session does not hide authentication problems.

## If something still fails

Send the exact evidence, not a description. The most useful items are:

- GitHub Actions red-step log
- Vercel deployment/build log
- browser console error (Developer Tools → Console)
- browser Network request that is red, including status code and response
- Supabase SQL/migration error
- screenshot of the page and the exact URL where it happened

Do **not** send passwords, private keys, Supabase service-role keys, Resend API keys, Google client secrets, or access tokens.

## Recommended stopping rule

Do not keep changing code once all four conditions are true: GitHub CI is green, production Vercel deployment is green, the user/admin journeys above pass, and there are no high-severity console/network errors. At that point publish and collect real user feedback instead of continuing speculative rewrites.
