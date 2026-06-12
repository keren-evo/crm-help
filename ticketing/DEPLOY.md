# Deploy EVO Ticketing for testing

## Live URLs (pick one)

| Platform | URL after deploy | Best for |
|----------|------------------|----------|
| **GitHub Pages** | `https://keren-evo.github.io/crm-help/` | Free, auto-deploy on push to `main` |
| **Netlify** | Custom `*.netlify.app` URL | Fast manual deploy, env vars UI |
| **Surge** | `https://evo-ticketing-demo.surge.sh` | Quick throwaway demo |

Demo mode runs automatically when Supabase keys are not set (placeholder anon key counts as demo).

## Sample data

**10 tickets** seeded (1–3 per category). Demo mode loads them on first visit.

**Staff login:** `crmhelp@evohcg.com` / `crmhelp@evohcg.com`

**Ticket lookup try:**
- Email: `sarah.chen@evohcg.com`
- ID: `demo-seed-data-001`

## GitHub Pages (recommended)

1. Commit and push to `main`:
   ```bash
   git checkout main
   git add ticketing/ .github/workflows/deploy-ticketing.yml
   git commit -m "Add ticketing demo seed data and GitHub Pages deploy"
   git push origin main
   ```

2. In GitHub repo **Settings → Pages → Build and deployment**, set source to **GitHub Actions**.

3. The workflow `.github/workflows/deploy-ticketing.yml` builds `ticketing/` and publishes to Pages (base path `/crm-help/` for this repo).

4. Live site: **https://keren-evo.github.io/crm-help/** (or `https://klacadin.github.io/evo-help/` if using the `klacadin/evo-help` repo)

> **Do not use** the default “Deploy Jekyll with GitHub Pages” template. Replace it with the Vite workflow in `.github/workflows/deploy-ticketing.yml`.

### If you see “404 — There isn't a GitHub Pages site here”

1. Open repo **Settings → Pages → Build and deployment**.
2. Set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Open **Actions** → **Deploy ticketing to GitHub Pages** → **Run workflow** → Run.
4. Wait for both jobs (**build** and **deploy**) to finish green.
5. Use the URL for **your** repo name:
   - `klacadin/evo-help` → `https://klacadin.github.io/evo-help/`
   - `keren-evo/crm-help` → `https://keren-evo.github.io/crm-help/`

## Netlify (one-click manual deploy)

```bash
cd ticketing
npm ci --legacy-peer-deps
npm run build
npx netlify-cli deploy --prod --dir=dist --site-name evo-ticketing-demo
```

Or connect the repo in [Netlify](https://app.netlify.com) with:
- Base directory: `ticketing`
- Build command: `npm run build`
- Publish directory: `ticketing/dist`
- Env: `VITE_BASE_PATH=/` (for Netlify root deploy)

## Supabase production (optional, shared data)

1. Create a Supabase project at https://supabase.com
2. Run migrations in `supabase/migrations/` **in order** (SQL Editor — **one file per run**):

| Order | File |
|-------|------|
| 1 | `20250612100000_initial_ticketing_schema.sql` |
| 2 | `20250612130000_add_superadmin_enum_value.sql` |
| 3 | `20250612130001_superadmin_rls_and_seed.sql` |
| 4 | `20250612120000_seed_dummy_tickets.sql` |

> **Skip** `20250612110000_add_superadmin_crmhelp.sql` — it fails because PostgreSQL cannot add an enum value and use it in the same transaction.

> If you see `unsafe use of new value "superadmin"`, run step 2 alone first, then step 3.
3. Set Netlify/Pages env vars:
   ```
   VITE_SUPABASE_URL=https://wzeazwfsbkadgnzytwos.supabase.co
   VITE_SUPABASE_ANON_KEY=<real jwt anon key>
   VITE_STORAGE_BUCKET=tickets
   VITE_EDGE_URL=https://wzeazwfsbkadgnzytwos.supabase.co/functions/v1/send-confirmation
   ```
4. Redeploy frontend

## Local preview

```bash
cd ticketing
npm run dev
# http://127.0.0.1:5173
```
