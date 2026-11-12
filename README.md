# Aaraj Floral Shop

Static site (HTML, CSS, vanilla JS, no build step) with a Supabase backend and a staff admin at `/admin/`.

## Set up Supabase (in this order)

1. Create a project at supabase.com. Authentication > Providers > Email: turn **off** "Allow new users to sign up".
2. Authentication > Users > Add user: create the **owner** login (email and password, tick "Auto confirm user").
3. SQL Editor, run each file below, in order. Each is safe to run again.
   1. `supabase/001_schema.sql` tables, RLS, order logging, photo storage, seed menu
   2. `supabase/002_staff_permissions.sql` owner and staff roles (makes the earliest login the owner)
   3. `supabase/003_user_management.sql` lets the owner create staff logins from the admin
4. Project Settings > API: copy the project URL and the **publishable (anon)** key into `js/config.js`. Never paste a secret or service_role key.
5. Authentication > URL Configuration: add the admin address (for example `https://<user>.github.io/aarajfloral/admin/`) to Redirect URLs so "forgot password" links work.

Without migration 002 every signed-in user has full access. Without 003 the Team section shows a notice and everything else works.

## Run locally
`python3 -m http.server 8123` then open http://localhost:8123/ and /admin/.

## Tests
`node tests/run.js <screenshots-dir>` runs headless Chrome against a mocked Supabase (`tests/mock-supabase.js`). It does not test RLS, triggers or real auth. Needs `puppeteer-core` installed next to the repo.

## Cache busting
Assets are linked with `?v=N`. Bump N in `index.html` and `admin/index.html` on every deploy.

## Placeholders to replace
Prices, delivery terms, the Google Maps link and the feed photos (low-resolution screenshots) are placeholders. Replace them in the admin or in `js/defaults.js` and `supabase/001_schema.sql`.
