/*
  # Add referrer tracking to existing short_links table

  This migration adds referrer tracking functionality to track where clicks come from.
  
  1. New Table: `referrer_clicks`
    - `id` (uuid, primary key)
    - `short_link_id` (uuid, foreign key to short_links)
    - `referrer` (text) - The website where the click came from
    - `user_agent` (text) - Browser/device info
    - `ip_address` (inet) - IP address (optional, for analytics)
    - `country` (text) - Country where the click originated
    - `country_code` (text) - ISO country code (e.g., US, GB, FR)
    - `city` (text) - City where the click originated (optional)
    - `clicked_at` (timestamp, default now())

  2. Security
    - Enable RLS on `referrer_clicks` table
    - Add policies for public read/insert access
*/

-- Create referrer clicks table to track where clicks come from
CREATE TABLE IF NOT EXISTS referrer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid REFERENCES short_links(id) ON DELETE CASCADE,
  referrer text, -- The website where the click came from
  user_agent text, -- Browser/device info
  ip_address inet, -- IP address (optional, for analytics)
  country text, -- Country where the click originated
  country_code text, -- ISO country code (e.g., US, GB, FR)
  city text, -- City where the click originated (optional)
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE referrer_clicks ENABLE ROW LEVEL SECURITY;

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

-- Create index for referrer clicks lookups
CREATE INDEX IF NOT EXISTS idx_referrer_clicks_short_link_id ON referrer_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_referrer_clicks_clicked_at ON referrer_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_referrer_clicks_country ON referrer_clicks(country); 