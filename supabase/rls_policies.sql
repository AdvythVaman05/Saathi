-- ==============================================================================
-- Saathi Survey Companion - Row Level Security (RLS) SQL Script
-- ==============================================================================
-- Instructions: Run this script in the Supabase SQL Editor to secure your database
-- tables for production. Ensure tables have been created via Django migrations first.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS users_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users_accessibilitypreferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_sessionanswer ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_auditlog ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Policy Definitions
-- ------------------------------------------------------------------------------

-- Users Table Policies
DROP POLICY IF EXISTS "Allow users to access own record" ON users_user;
CREATE POLICY "Allow users to access own record" ON users_user
    FOR ALL
    USING (
        id::text = current_setting('request.headers', true)::json->>'x-user-id'
    );

-- Accessibility Preferences Table Policies
DROP POLICY IF EXISTS "Allow users to access own preferences" ON users_accessibilitypreferences;
CREATE POLICY "Allow users to access own preferences" ON users_accessibilitypreferences
    FOR ALL
    USING (
        user_id::text = current_setting('request.headers', true)::json->>'x-user-id'
    );

-- Surveys Table Policies (Read-only public access to active surveys)
DROP POLICY IF EXISTS "Allow public read of active surveys" ON surveys_survey;
CREATE POLICY "Allow public read of active surveys" ON surveys_survey
    FOR SELECT
    USING (is_active = true);

-- Questions Table Policies (Read-only public access to questions of active surveys)
DROP POLICY IF EXISTS "Allow public read of questions" ON surveys_question;
CREATE POLICY "Allow public read of questions" ON surveys_question
    FOR SELECT
    USING (
        survey_id IN (SELECT id FROM surveys_survey WHERE is_active = true)
    );

-- Sessions Table Policies
DROP POLICY IF EXISTS "Allow session owner access" ON responses_session;
CREATE POLICY "Allow session owner access" ON responses_session
    FOR ALL
    USING (
        id::text = current_setting('request.headers', true)::json->>'x-session-id'
    );

-- Session Answers Table Policies (Insert/Update allowed to session owner)
DROP POLICY IF EXISTS "Allow session owner to manage answers" ON responses_sessionanswer;
CREATE POLICY "Allow session owner to manage answers" ON responses_sessionanswer
    FOR ALL
    USING (
        session_id::text = current_setting('request.headers', true)::json->>'x-session-id'
    );

-- Audit Log Table Policies (Session owner insert only)
DROP POLICY IF EXISTS "Allow session owner to append logs" ON responses_auditlog;
CREATE POLICY "Allow session owner to append logs" ON responses_auditlog
    FOR ALL
    USING (
        session_id::text = current_setting('request.headers', true)::json->>'x-session-id'
    );

-- ------------------------------------------------------------------------------
-- 3. Verification Queries
-- ------------------------------------------------------------------------------
-- Run these queries to check the RLS status and verify that policies are active.

-- A. Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- B. List current policies:
-- SELECT * FROM pg_policies;

-- ------------------------------------------------------------------------------
-- 4. Rollback Scripts
-- ------------------------------------------------------------------------------
-- Run this script to disable RLS and drop all policies.
/*
ALTER TABLE IF EXISTS users_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users_accessibilitypreferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys_survey DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys_question DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_session DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_sessionanswer DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses_auditlog DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to access own record" ON users_user;
DROP POLICY IF EXISTS "Allow users to access own preferences" ON users_accessibilitypreferences;
DROP POLICY IF EXISTS "Allow public read of active surveys" ON surveys_survey;
DROP POLICY IF EXISTS "Allow public read of questions" ON surveys_question;
DROP POLICY IF EXISTS "Allow session owner access" ON responses_session;
DROP POLICY IF EXISTS "Allow session owner to manage answers" ON responses_sessionanswer;
DROP POLICY IF EXISTS "Allow session owner to append logs" ON responses_auditlog;
*/
