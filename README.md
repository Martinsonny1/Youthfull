# Meet GH Introductions (agency website)

Standalone static site. Deploy this folder as its own Vercel/Netlify project (it does not touch the Meet GH app).

1. Run `supabase/agency_schema.sql` once in Supabase > SQL Editor (same project as the app).
2. Edit `js/config.js` (name, WhatsApp number, ages, optional email).
3. Upload the CONTENTS of this folder to your host.
4. Admin dashboard: `/admin/`. Sign in with your existing Meet GH admin account.
5. Before launch: have a lawyer review `privacy.html` and `terms.html`, and fill in the [business name] placeholders.

If the database is unreachable, the form falls back to a pre-filled WhatsApp message so no applicant is lost.
