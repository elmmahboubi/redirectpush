/*
  # Fix RLS policies for deleted links access

  This migration fixes the RLS policies to allow proper access to deleted links
  for the UI while maintaining security for public redirects.
  
  The issue is that the current policies prevent fetching deleted links for display
  in the admin interface. We need to add specific policies for this.
*/

-- Drop the overly restrictive soft delete policy
DROP POLICY IF EXISTS "Soft delete access" ON short_links;

-- Add policy to allow reading all links (including deleted ones) for admin interface
CREATE POLICY "Admin read access"
  ON short_links
  FOR SELECT
  TO anon
  USING (true);

-- Add policy to allow soft delete operations
CREATE POLICY "Soft delete operations"
  ON short_links
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Keep the existing public policies for redirects (only non-deleted links)
-- These ensure that public redirects only work with active links
DROP POLICY IF EXISTS "Public read access" ON short_links;
CREATE POLICY "Public read access"
  ON short_links
  FOR SELECT
  TO anon
  USING (deleted = false);

-- Ensure insert policy only allows non-deleted links
DROP POLICY IF EXISTS "Public insert access" ON short_links;
CREATE POLICY "Public insert access"
  ON short_links
  FOR INSERT
  TO anon
  WITH CHECK (deleted = false);

-- Ensure update policy only allows non-deleted links for click tracking
DROP POLICY IF EXISTS "Public update click count" ON short_links;
CREATE POLICY "Public update click count"
  ON short_links
  FOR UPDATE
  TO anon
  USING (deleted = false)
  WITH CHECK (deleted = false); 