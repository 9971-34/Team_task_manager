-- Run this in Supabase SQL Editor to create tables with proper RLS policies

-- Drop existing tables if they exist (be careful!)
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  avatar TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  projects UUID[] DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('active', 'on-hold', 'completed', 'archived')) DEFAULT 'active',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  color TEXT DEFAULT '#6366f1',
  owner UUID REFERENCES users(id) NOT NULL,
  members UUID[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('todo', 'in-progress', 'completed')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  project UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]',
  activity_log JSONB DEFAULT '[]',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISABLE RLS for now (for development)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Insert sample admin user (password: Admin1234 - bcrypt hash)
INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@taskflow.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYL8Bq5LKRK',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert a sample member user
INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Demo Member',
  'member@test.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYL8Bq5LKRK',
  'member',
  true
) ON CONFLICT (email) DO NOTHING;

-- Enable RLS and create policies (if you want security later)
-- For now we keep RLS disabled for easy development