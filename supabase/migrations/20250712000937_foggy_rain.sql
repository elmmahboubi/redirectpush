/*
  # Create short_links table for link shortener

  1. New Tables
    - `short_links`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - e.g., p1, p2, p3
      - `original_url` (text) - Full destination URL
      - `click_count` (integer, default 0) - Track visits
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on `short_links` table
    - Add policy for public read access (for redirects)
    - Add policy for public insert (for creating links)
*/

CREATE TABLE IF NOT EXISTS short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  original_url text NOT NULL,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create referrer clicks table to track where clicks come from
CREATE TABLE IF NOT EXISTS referrer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid REFERENCES short_links(id) ON DELETE CASCADE,
  referrer text, -- The website where the click came from
  user_agent text, -- Browser/device info
  ip_address inet, -- IP address (optional, for analytics)
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrer_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read short links (needed for redirects)
CREATE POLICY "Public read access"
  ON short_links
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to create short links
CREATE POLICY "Public insert access"
  ON short_links
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to update click count
CREATE POLICY "Public update click count"
  ON short_links
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anyone to insert referrer clicks
CREATE POLICY "Public insert referrer clicks"
  ON referrer_clicks
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read referrer clicks
CREATE POLICY "Public read referrer clicks"
  ON referrer_clicks
  FOR SELECT
  TO anon
  USING (true);

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_short_links_slug ON short_links(slug);

-- Create index for referrer clicks lookups
CREATE INDEX IF NOT EXISTS idx_referrer_clicks_short_link_id ON referrer_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_referrer_clicks_clicked_at ON referrer_clicks(clicked_at);