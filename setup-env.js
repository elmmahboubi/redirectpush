#!/usr/bin/env node

console.log('🔧 HappyDeel Links - Environment Setup');
console.log('=====================================\n');

// Your Supabase project URL
const supabaseUrl = 'https://lphgdlnzbvxqpfryorbk.supabase.co';

console.log('📋 Environment Variables to Set in Vercel:');
console.log('==========================================');
console.log(`VITE_SUPABASE_URL=${supabaseUrl}`);
console.log('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
console.log('VITE_BASE_URL=https://your-domain.vercel.app\n');

console.log('📋 Steps to Complete:');
console.log('====================');
console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/lphgdlnzbvxqpfryorbk');
console.log('2. Navigate to Settings → API');
console.log('3. Copy the "anon public" key');
console.log('4. Go to your Vercel dashboard');
console.log('5. Add the environment variables above');
console.log('6. Replace "your_anon_key_here" with your actual anon key');
console.log('7. Replace "your-domain.vercel.app" with your actual Vercel domain\n');

console.log('📋 Database Migration SQL:');
console.log('========================');
console.log('Run this in your Supabase SQL Editor:');
console.log('=====================================');

const migrationSQL = `CREATE TABLE IF NOT EXISTS short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  original_url text NOT NULL,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

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

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_short_links_slug ON short_links(slug);`;

console.log(migrationSQL);

console.log('\n✅ After completing these steps, redeploy your Vercel project!'); 