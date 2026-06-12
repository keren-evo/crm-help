-- Seed dummy tickets for testing (skipped if seed rows already exist)
-- Lookup examples: sarah.chen@evohcg.com + cd37ccfb-9c8a-44cf-b1f5-f6688a189cce

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tickets WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid
  ) THEN
    RETURN;
  END IF;

  INSERT INTO tickets (
    id, name, email, phone, department, company, category, priority,
    title, description, status, dev_team, internal_notes, resolution_notes,
    resolved_at, created_at, updated_at, last_movement_at, escalation_alert_sent
  ) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001', 'Sarah Chen', 'sarah.chen@evohcg.com', '555-0101',
    'Clinical Operations', 'Evo HCG', 'Data issues', 'High',
    'Patient roster missing overnight sync',
    'Expected all active patients from yesterday to appear in the morning roster. About 12 records are missing after the nightly sync job.',
    'In Progress', 'Data Team', 'Checking ETL logs from 2am job.', NULL, NULL,
    now() - interval '3 days', now() - interval '1 day', now() - interval '1 day', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002', 'Marcus Webb', 'marcus.webb@evohcg.com', NULL,
    'Billing', 'Evo HCG', 'Data issues', 'Medium',
    'Duplicate insurance records on import',
    'CSV import created duplicate payer rows for three clients.',
    'Under Review', 'Data Team', NULL, NULL, NULL,
    now() - interval '5 days', now() - interval '4 days', now() - interval '4 days', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003', 'Priya Nair', 'priya.nair@evohcg.com', NULL,
    'Compliance', 'Evo HCG', 'Data issues', 'Low',
    'Export column order differs from legacy CRM',
    'Monthly compliance export column order changed.',
    'Submitted', 'Data Team', NULL, NULL, NULL,
    now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004', 'James Ortiz', 'james.ortiz@evohcg.com', NULL,
    'Field Services', 'Evo HCG', 'Core functionality', 'High',
    'Cannot save visit notes on mobile',
    'On iOS Safari, tapping Save on visit notes spins indefinitely.',
    'Escalated to IT', 'Build Team', NULL, NULL, NULL,
    now() - interval '4 days', now() - interval '2 days', now() - interval '2 days', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005', 'Emily Torres', 'emily.torres@evohcg.com', NULL,
    'Scheduling', 'Evo HCG', 'Core functionality', 'Medium',
    'Recurring appointment template not copying duration',
    'When duplicating a weekly template, duration resets to 30 minutes.',
    'Need More Information', 'Build Team', NULL, NULL, NULL,
    now() - interval '6 days', now() - interval '5 days', now() - interval '5 days', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006', 'David Kim', 'david.kim@evohcg.com', NULL,
    'Intake', 'Evo HCG', 'Glitch & error messaging', 'Medium',
    'Generic error when uploading PDF intake forms',
    'Upload fails with Something went wrong — no error code.',
    'In Progress', 'Troubleshooting team', NULL, NULL, NULL,
    now() - interval '2 days', now() - interval '1 day', now() - interval '1 day', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440007', 'Lisa Park', 'lisa.park@evohcg.com', NULL,
    'HR', 'Evo HCG', 'Glitch & error messaging', 'Low',
    'Toast notification overlaps submit button',
    'Success toast covers the primary button on smaller laptop screens.',
    'Resolved', 'Troubleshooting team', NULL, 'CSS z-index fix deployed in v0.1.2.', now() - interval '1 day',
    now() - interval '8 days', now() - interval '1 day', now() - interval '1 day', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440008', 'Robert Hayes', 'robert.hayes@evohcg.com', NULL,
    'Operations', 'Evo HCG', 'Feature requests', 'Low',
    'Bulk reassign caseload between coordinators',
    'Need ability to select multiple clients and reassign in one action.',
    'Pending Leadership Decision', 'Build Team', NULL, NULL, NULL,
    now() - interval '7 days', now() - interval '3 days', now() - interval '3 days', false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440009', 'Angela Brooks', 'angela.brooks@evohcg.com', NULL,
    'Finance', 'Evo HCG', 'Reporting & dashboard', 'High',
    'Weekly utilization report totals do not match detail drill-down',
    'Summary card shows 847 visits; exported detail CSV sums to 812.',
    'Under Review', 'Reporting team', NULL, NULL, NULL,
    now() - interval '3 days', now() - interval '2 days', now() - interval '2 days', false
  ),
  (
    '550e8400-e29b-41d4-a716-44665544000a', 'Chris Nguyen', 'chris.nguyen@evohcg.com', NULL,
    'Executive', 'Evo HCG', 'Reporting & dashboard', 'Medium',
    'Add filter by region to leadership dashboard',
    'Leadership review requires filtering KPI tiles by geographic region.',
    'Submitted', 'Reporting team', NULL, NULL, NULL,
    now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', false
  );
END $$;
