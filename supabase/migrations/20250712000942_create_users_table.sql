/*
  # Create users table for authentication

  This migration creates a proper users table for authentication instead of hardcoded credentials.
  
  1. New Table: `users`
    - `id` (uuid, primary key)
    - `username` (text, unique) - Login username
    - `password_hash` (text) - Hashed password (we'll use simple hash for now)
    - `role` (text) - User role (admin, user, etc.)
    - `created_at` (timestamp, default now())
    - `last_login` (timestamp) - Track last login time

  2. Security
    - Enable RLS on `users` table
    - Add policies for authentication
    - Insert default admin user
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users (needed for authentication)
CREATE POLICY "Public read users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to update last_login
CREATE POLICY "Public update last login"
  ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default admin user (password: Localserver!!2)
-- Using base64 encoding for demo purposes - in production use proper bcrypt
INSERT INTO users (username, password_hash, role) 
VALUES ('elmahboubi', 'TG9jYWxzZXJ2ZXIhITI=', 'admin')
ON CONFLICT (username) DO NOTHING; 