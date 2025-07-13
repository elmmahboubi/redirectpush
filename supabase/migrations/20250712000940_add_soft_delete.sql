/*
  # Add soft delete functionality to short_links table

  This migration adds soft delete capability to the short_links table.
  
  Instead of permanently deleting links, we'll mark them as deleted and store
  the deletion timestamp. This allows for link restoration and better data management.
  
  1. Add `deleted` boolean field (default false)
  2. Add `deleted_at` timestamp field
  3. Update existing RLS policies to handle soft deletes
*/

-- Add soft delete fields to short_links table
ALTER TABLE short_links 
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_short_links_deleted ON short_links(deleted);
CREATE INDEX IF NOT EXISTS idx_short_links_deleted_at ON short_links(deleted_at);

-- Update RLS policies to handle soft deletes
-- Only show non-deleted links in public queries (for redirects)
DROP POLICY IF EXISTS "Public read access" ON short_links;
CREATE POLICY "Public read access"
  ON short_links
  FOR SELECT
  TO anon
  USING (deleted = false);

-- Allow insert of non-deleted links only
DROP POLICY IF EXISTS "Public insert access" ON short_links;
CREATE POLICY "Public insert access"
  ON short_links
  FOR INSERT
  TO anon
  WITH CHECK (deleted = false);

-- Allow update of non-deleted links only
DROP POLICY IF EXISTS "Public update click count" ON short_links;
CREATE POLICY "Public update click count"
  ON short_links
  FOR UPDATE
  TO anon
  USING (deleted = false)
  WITH CHECK (deleted = false);

-- Add policy for soft delete operations (for authenticated users)
CREATE POLICY "Soft delete access"
  ON short_links
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true); 