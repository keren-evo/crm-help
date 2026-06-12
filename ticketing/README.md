# Evo Ticketing

Standalone support ticketing for EVO — user submission, triage dashboard, status lifecycle, email notifications, and leadership reporting.

## Features

- **Public submission** — five categories, priority selector, attachments, ticket lookup by email + ID
- **Triage dashboard** (`#/admin`) — filter, assign dev team, update status, internal/resolution notes
- **Reporting** (`#/reporting`) — volume by category/status/priority, SLA breach count, avg resolution time
- **Notifications** — submission confirmation + status update emails (SendGrid)
- **Escalation** — high-priority tickets with no movement for 48h trigger alerts

## Quick start

```bash
cd ticketing
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev
```

Routes (hash-based):

| Route | Purpose |
|-------|---------|
| `#/` | Submit a ticket |
| `#/admin` | Staff triage dashboard |
| `#/reporting` | Leadership metrics |

Without Supabase env vars the app runs in **demo mode** (localStorage).

## Supabase setup

1. Apply migration:

```bash
supabase db push
# or run supabase/migrations/20250612100000_initial_ticketing_schema.sql in the SQL editor
```

2. Create storage bucket `tickets` (public read for demo, or use signed URLs in production).

3. Create staff users — link Supabase Auth users to `staff_users`:

```sql
INSERT INTO staff_users (auth_id, name, email, department, company, role)
VALUES (
  '<auth.users uuid>',
  'Hillel Adelman',
  'hillel@evohcg.com',
  'IT',
  'Evo',
  'admin'
);
```

Roles: `agent` (assigned tickets), `manager` (department tickets + reporting), `admin` (full access), `superadmin` (full access + staff management).

Default superadmin (seeded by migration `20250612110000_add_superadmin_crmhelp.sql`):

- Email: `crmhelp@evohcg.com`
- Password: `crmhelp@evohcg.com`

Or run: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/create-superadmin.mjs`

4. Deploy edge functions:

```bash
supabase functions deploy send-confirmation
supabase functions deploy send-status-update
supabase functions deploy check-escalation
```

Set secrets: `SENDGRID_API_KEY`, `SENDER_EMAIL`, `TRIAGE_ALERT_EMAIL` (optional, defaults to sender).

5. Schedule escalation (Supabase Dashboard → Database → Cron, or pg_cron):

```sql
SELECT cron.schedule('check-ticket-escalation', '0 */6 * * *', $$
  SELECT net.http_post(
    url := '<project-url>/functions/v1/check-escalation',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  );
$$);
```

## Environment

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STORAGE_BUCKET=tickets
VITE_EDGE_URL=https://<project>.supabase.co/functions/v1/send-confirmation
```

## Ticket statuses

Submitted → Under Review → In Progress → Resolved / Closed (plus Need More Information, Escalated to IT, Pending Leadership Decision, Duplicate, Not in Scope).

## Dev team assignment

Build Team, Troubleshooting team, Leadership, Reporting team, Data Team — auto-suggested from category on submit.

## Data model

See `supabase/migrations/20250612100000_initial_ticketing_schema.sql` for `tickets`, `staff_users`, `ticket_categories`, RLS policies, and `lookup_ticket()` RPC.
