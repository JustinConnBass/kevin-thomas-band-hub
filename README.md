# Kevin Thomas Band Hub

Mobile-first installable band operations PWA with fictional demo users. It includes repertoire, drag-and-drop setlists, gigs and itineraries, availability, Nashville Number charts, private musician notes, stage mode, production files, PDF output, offline caching, audit visibility, and administrator-only finance UI.

## Run locally

Requires Node 20+. No credentials are needed for demo mode.

```bash
npm install
npm run dev
```

Choose any fictional role on the sign-in screen. The demo password field is deliberately non-functional and contains no real secret.

## Production architecture

- React + TypeScript + Vite PWA on Cloudflare Pages, Vercel, or Netlify.
- Supabase free tier for hosted Postgres, Auth, private Storage, and backups.
- PostgreSQL RLS in `supabase/schema.sql` is the security boundary; UI checks are only convenience.
- Workbox precaches the shell and uses network-first caching for Supabase. Current gig and chart data stay readable offline. For production mutations, queue writes in IndexedDB with idempotency keys and replay on `online`; show both copies when version conflicts occur.
- Client-side PDF generation avoids server cost and keeps data on-device.

## Detailed deployment guide

1. Create a Supabase project in the nearest region. Run `supabase/schema.sql` in SQL Editor.
2. In Authentication URL Configuration, set the production site and exact password-reset redirect URL. Disable public sign-ups; invite the fewer-than-15 users. Require 12-character passwords and MFA for administrators.
3. Create each invited user's `profiles` row with their Auth UUID and assigned role. Never create sample passwords or commit service-role keys.
4. Copy `.env.example` to `.env.local` and add the project URL and public anon key. The anon key is browser-safe only because RLS is enabled. Never expose the service-role key.
5. Replace the demo adapter with Supabase queries via `@supabase/supabase-js`; use `auth.resetPasswordForEmail()` and signed URLs for private files.
6. Run `npm test`, `npm run lint`, `npm run security`, and `npm run build`.
7. Push to a private repository. Connect Cloudflare Pages (build `npm run build`, output `dist`) or Vercel. Add both `VITE_` variables to hosting settings.
8. Add host headers: CSP (`default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
9. Test install from Safari Share → Add to Home Screen and Chrome Install app. Test airplane mode after opening the current gig once online.

## Backups and recovery

- Use platform backups appropriate to the Supabase plan. Additionally schedule a weekly encrypted `pg_dump` with 30-day retention: `pg_dump "$DATABASE_URL" --format=custom --file="ktb-YYYY-MM-DD.dump"`.
- Export the private Storage bucket separately with the Supabase CLI. Encrypt archives and restrict access to two administrators.
- Quarterly restore with `pg_restore` into a temporary project; verify counts, every role, and private file download, then remove it.
- Record owner, recovery email, billing, DNS, and restore date in the band's password manager—not this repository.

## Security checklist

- Keep RLS enabled; add policies before exposing new tables.
- Finance uses revoked column grants plus an admin-only function. Notes use owner-only policies. Storage is private with expiring signed URLs.
- Use verified emails, secure reset links, admin MFA, short shared-device sessions, and individual accounts.
- Write audit rows in database triggers/service functions, never from browser input. Add update triggers for gigs and setlists before the production migration.
- Validate upload MIME/size and sanitize filenames. Run dependency audit in CI, automate updates, protect main, and review Auth logs monthly.

## Low-cost hosting

Normal use by fewer than 15 members should fit free static hosting and Supabase's free tier. Upgrade only when guaranteed daily backups, higher storage, or non-pausing service is needed. A custom domain is the likely annual cost.
Deployment configured for Cloudflare Workers.
