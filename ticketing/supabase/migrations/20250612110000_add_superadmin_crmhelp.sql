-- Add superadmin role and seed crmhelp@evohcg.com
DO $$ BEGIN ALTER TYPE staff_role
ADD VALUE IF NOT EXISTS 'superadmin';
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- Treat superadmin like admin in RLS
DROP POLICY IF EXISTS tickets_select_staff ON tickets;
CREATE POLICY tickets_select_staff ON tickets FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND (
          su.role IN ('admin', 'superadmin')
          OR (
            su.role = 'manager'
            AND su.department IS NOT NULL
            AND su.department = tickets.department
          )
          OR tickets.assigned_to = su.id
        )
    )
  );
DROP POLICY IF EXISTS tickets_update_staff ON tickets;
CREATE POLICY tickets_update_staff ON tickets FOR
UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'superadmin', 'manager', 'agent')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'superadmin', 'manager', 'agent')
    )
  );
DROP POLICY IF EXISTS staff_users_select_self ON staff_users;
CREATE POLICY staff_users_select_self ON staff_users FOR
SELECT TO authenticated USING (
    auth_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'superadmin')
    )
  );
DROP POLICY IF EXISTS staff_users_update_admin ON staff_users;
CREATE POLICY staff_users_update_admin ON staff_users FOR
UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM staff_users su
      WHERE su.auth_id = auth.uid()
        AND su.role IN ('admin', 'superadmin')
    )
  );
-- Seed Supabase Auth user + staff profile (password: crmhelp@evohcg.com)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE v_user_id uuid;
v_email text := 'crmhelp@evohcg.com';
v_password text := 'crmhelp@evohcg.com';
BEGIN
SELECT id INTO v_user_id
FROM auth.users
WHERE lower(email) = lower(v_email);
IF v_user_id IS NULL THEN v_user_id := gen_random_uuid();
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"CRM Help"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );
ELSE
UPDATE auth.users
SET encrypted_password = crypt(v_password, gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE id = v_user_id;
END IF;
INSERT INTO staff_users (auth_id, name, email, department, company, role)
VALUES (
    v_user_id,
    'CRM Help',
    v_email,
    'IT',
    'Evo',
    'superadmin'
  ) ON CONFLICT (email) DO
UPDATE
SET auth_id = EXCLUDED.auth_id,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  company = EXCLUDED.company,
  role = 'superadmin';
END $$;