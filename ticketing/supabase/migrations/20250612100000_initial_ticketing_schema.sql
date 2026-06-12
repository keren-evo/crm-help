-- EVO Ticketing: full schema (Phases 1–4)
-- Apply via Supabase CLI: supabase db push
-- Or run manually in the SQL editor.
-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM (
  'Submitted',
  'Under Review',
  'Need More Information',
  'In Progress',
  'Escalated to IT',
  'Pending Leadership Decision',
  'Resolved',
  'Closed',
  'Duplicate',
  'Not in Scope'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE TYPE dev_team AS ENUM (
  'Build Team',
  'Troubleshooting team',
  'Leadership',
  'Reporting team',
  'Data Team'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE TYPE staff_role AS ENUM ('agent', 'manager', 'admin');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- ---------------------------------------------------------------------------
-- Staff users (linked to Supabase Auth for admin/triage/reporting)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  department text,
  company text,
  role staff_role NOT NULL DEFAULT 'agent',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ---------------------------------------------------------------------------
-- Extensible categories + per-category notification routing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_categories (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  notification_emails text [] NOT NULL DEFAULT '{}',
  default_dev_team dev_team,
  sort_order int NOT NULL DEFAULT 0
);
INSERT INTO ticket_categories (
    name,
    notification_emails,
    default_dev_team,
    sort_order
  )
VALUES (
    'Data issues',
    ARRAY ['support@evohcg.com'],
    'Data Team',
    1
  ),
  (
    'Core functionality',
    ARRAY ['support@evohcg.com'],
    'Build Team',
    2
  ),
  (
    'Glitch & error messaging',
    ARRAY ['support@evohcg.com'],
    'Troubleshooting team',
    3
  ),
  (
    'Feature requests',
    ARRAY ['support@evohcg.com'],
    'Build Team',
    4
  ),
  (
    'Reporting & dashboard',
    ARRAY ['support@evohcg.com'],
    'Reporting team',
    5
  ) ON CONFLICT (name) DO NOTHING;
-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_movement_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text NOT NULL,
  company text NOT NULL,
  category text NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'Medium',
  title text,
  description text NOT NULL,
  screenshot_path text,
  link text,
  status ticket_status NOT NULL DEFAULT 'Submitted',
  assigned_to uuid REFERENCES staff_users(id) ON DELETE
  SET NULL,
    dev_team dev_team,
    internal_notes text,
    resolution_notes text,
    resolved_at timestamptz,
    escalation_alert_sent boolean NOT NULL DEFAULT false
);
-- Add columns if upgrading from an older tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS last_movement_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES staff_users(id) ON DELETE
SET NULL;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS dev_team dev_team;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS resolution_notes text;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS escalation_alert_sent boolean NOT NULL DEFAULT false;
-- Migrate legacy status values
UPDATE tickets
SET status = 'Submitted'
WHERE status::text = 'open';
-- ---------------------------------------------------------------------------
-- Timestamps & movement tracking
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_ticket_timestamps() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now();
IF TG_OP = 'INSERT' THEN NEW.last_movement_at := now();
IF NEW.status IS NULL THEN NEW.status := 'Submitted';
END IF;
ELSIF TG_OP = 'UPDATE' THEN IF NEW.status IS DISTINCT
FROM OLD.status
  OR NEW.assigned_to IS DISTINCT
FROM OLD.assigned_to
  OR NEW.dev_team IS DISTINCT
FROM OLD.dev_team
  OR NEW.internal_notes IS DISTINCT
FROM OLD.internal_notes
  OR NEW.priority IS DISTINCT
FROM OLD.priority THEN NEW.last_movement_at := now();
END IF;
IF NEW.status IN ('Resolved', 'Closed')
AND OLD.status NOT IN ('Resolved', 'Closed') THEN NEW.resolved_at := COALESCE(NEW.resolved_at, now());
END IF;
IF NEW.status = 'Submitted'
AND OLD.status IN ('Resolved', 'Closed') THEN NEW.resolved_at := NULL;
END IF;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tickets_timestamps ON tickets;
CREATE TRIGGER tickets_timestamps BEFORE
INSERT
  OR
UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION set_ticket_timestamps();
-- ---------------------------------------------------------------------------
-- Staff profile helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_staff() RETURNS staff_users LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT *
FROM staff_users
WHERE auth_id = auth.uid()
LIMIT 1;
$$;
-- ---------------------------------------------------------------------------
-- Public ticket lookup (email + id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION lookup_ticket(ticket_id uuid, ticket_email text) RETURNS SETOF tickets LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT *
FROM tickets
WHERE id = ticket_id
  AND lower(email) = lower(ticket_email);
$$;
GRANT EXECUTE ON FUNCTION lookup_ticket(uuid, text) TO anon,
  authenticated;
-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
-- Anyone can submit a ticket
DROP POLICY IF EXISTS tickets_insert_public ON tickets;
CREATE POLICY tickets_insert_public ON tickets FOR
INSERT TO anon,
  authenticated WITH CHECK (true);
-- Staff read access
DROP POLICY IF EXISTS tickets_select_staff ON tickets;
CREATE POLICY tickets_select_staff ON tickets FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND (
          su.role = 'admin'
          OR (
            su.role = 'manager'
            AND su.department IS NOT NULL
            AND su.department = tickets.department
          )
          OR tickets.assigned_to = su.id
        )
    )
  );
-- Staff update access
DROP POLICY IF EXISTS tickets_update_staff ON tickets;
CREATE POLICY tickets_update_staff ON tickets FOR
UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'manager', 'agent')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'manager', 'agent')
    )
  );
-- Staff can read their own profile; admins read all
DROP POLICY IF EXISTS staff_users_select_self ON staff_users;
CREATE POLICY staff_users_select_self ON staff_users FOR
SELECT TO authenticated USING (
    auth_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role = 'admin'
    )
  );
DROP POLICY IF EXISTS staff_users_update_admin ON staff_users;
CREATE POLICY staff_users_update_admin ON staff_users FOR
UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role = 'admin'
    )
  );
-- Categories readable by authenticated staff
DROP POLICY IF EXISTS categories_select_staff ON ticket_categories;
CREATE POLICY categories_select_staff ON ticket_categories FOR
SELECT TO authenticated USING (true);
-- Storage: allow public upload to tickets bucket (adjust in production)
-- Run in dashboard: create bucket "tickets" with appropriate policies.
-- ---------------------------------------------------------------------------
-- Escalation candidates view (48h high-priority stall)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW escalation_candidates AS
SELECT t.*,
  EXTRACT(
    EPOCH
    FROM (now() - t.last_movement_at)
  ) / 3600 AS hours_stalled
FROM tickets t
WHERE t.priority = 'High'
  AND t.escalation_alert_sent = false
  AND t.status NOT IN (
    'Resolved',
    'Closed',
    'Duplicate',
    'Not in Scope'
  )
  AND t.last_movement_at < now() - interval '48 hours';
GRANT SELECT ON escalation_candidates TO service_role;