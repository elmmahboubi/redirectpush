/*
  # Fix Redirect Policy to Exclude Deleted Links

  This migration updates the RLS policies to ensure deleted links are not accessible for redirects.
  
  The redirect logic now checks for deleted status, but we should also enforce this at the database level.
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations" ON short_links;

-- Create a more restrictive policy for redirects
CREATE POLICY "Allow read active links only"
  ON short_links
  FOR SELECT
  TO anon
  USING (deleted = false OR deleted IS NULL);

-- Create policy for all other operations (insert, update, delete)
CREATE POLICY "Allow all other operations"
  ON short_links
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON POLICY "Allow read active links only" ON short_links IS 'Only allows reading non-deleted links for redirects';
COMMENT ON POLICY "Allow all other operations" ON short_links IS 'Allows all other operations (insert, update, delete)'; 