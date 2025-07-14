/*
  # Add soft delete columns to short_links table

  This migration adds the missing soft delete columns that are needed for the soft delete functionality.
  
  The error "column short_links.deleted does not exist" indicates these columns are missing.
*/

-- Add soft delete columns if they don't exist
ALTER TABLE short_links 
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_short_links_deleted ON short_links(deleted);
CREATE INDEX IF NOT EXISTS idx_short_links_deleted_at ON short_links(deleted_at);

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'short_links' 
  AND column_name IN ('deleted', 'deleted_at')
ORDER BY column_name; 