-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM (
  'teacher',
  'student',
  'school_admin',
  'super_admin'
);

CREATE TYPE public.profile_status AS ENUM (
  'active',
  'pending_review'
);

CREATE TYPE public.theme_preference AS ENUM (
  'light',
  'dark',
  'system'
);

CREATE TYPE public.lab_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE public.student_work_status AS ENUM (
  'on_track',
  'need_help',
  'stuck',
  'waiting_for_check',
  'finished_step'
);
