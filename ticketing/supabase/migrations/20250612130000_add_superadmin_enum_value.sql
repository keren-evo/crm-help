-- Step 1 of 2: add enum value (must run in its own migration/transaction)
-- Run this FIRST, then run 20250612130001_superadmin_rls_and_seed.sql
-- Do NOT re-run 20250612110000_add_superadmin_crmhelp.sql (combines both and fails).
ALTER TYPE staff_role
ADD VALUE IF NOT EXISTS 'superadmin';