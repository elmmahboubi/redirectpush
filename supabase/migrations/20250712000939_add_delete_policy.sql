/*
  # Add DELETE policy for short_links table

  This migration adds the missing DELETE policy to allow users to delete their short links.
  
  The current RLS policies only allow:
  - SELECT (read access for redirects)
  - INSERT (create new links)
  - UPDATE (update click count)
  
  But DELETE is missing, which prevents link deletion.
*/

-- Allow anyone to delete short links
CREATE POLICY "Public delete access"
  ON short_links
  FOR DELETE
  TO anon
  USING (true); 