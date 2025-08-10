-- Enhanced initial schema with RLS policies and functions
-- This file should be used as a template for creating the initial migration

-- Step 1: Create the migration file
-- Run: ./scripts/supabase-migrate.sh create "initial_schema"
-- Then copy the contents of this file to the generated migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (see initial_schema.sql for full table definitions)
-- Then add all RLS policies and functions below

-- Example RLS policy (add all existing policies)
-- CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);

-- Example function (add all existing functions)
-- CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
-- Returns boolean as defined in current schema

-- Note: Use ./scripts/supabase-migrate.sh convert to automatically
-- convert existing SQL scripts to proper migration format