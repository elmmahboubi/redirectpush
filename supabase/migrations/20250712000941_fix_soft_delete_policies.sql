/*
  # Fix soft delete RLS policies

  This migration fixes the conflicting RLS policies that prevent soft delete operations.
  
  The issue is that the "Public update click count" policy only allows updates to non-deleted links,
  but we need to be able to update links to mark them as deleted.
  
  Solution: Remove the restrictive policy and let the general "Soft delete access" policy handle all updates.
*/

-- Drop the restrictive update policy that prevents soft deletes
DROP POLICY IF EXISTS "Public update click count" ON short_links;

-- The "Soft delete access" policy already exists and allows all updates
-- This policy handles both click count updates and soft delete operations
-- No need to create a new policy since "Soft delete access" already covers this

-- Verify the current policies allow soft delete operations
-- The remaining policies should be:
-- 1. "Public read access" - allows reading non-deleted links (for redirects)
-- 2. "Public insert access" - allows inserting new links
-- 3. "Soft delete access" - allows all updates (including soft deletes)
-- 4. "Public delete access" - allows hard deletes (if needed) 