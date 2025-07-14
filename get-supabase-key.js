#!/usr/bin/env node

console.log('🔑 Getting Your Supabase Anon Key');
console.log('==================================\n');

const projectId = 'lphgdlnzbvxqpfryorbk';
const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}`;

console.log('📋 Follow these steps to get your anon key:');
console.log('============================================');
console.log(`1. Go to your Supabase dashboard: ${dashboardUrl}`);
console.log('2. Click on "Settings" in the left sidebar');
console.log('3. Click on "API" in the settings menu');
console.log('4. Look for "Project API keys" section');
console.log('5. Copy the "anon public" key (it starts with "eyJ...")');
console.log('6. Replace "your_anon_key_here" in your .env.local file\n');

console.log('📋 Quick Steps:');
console.log('==============');
console.log('1. Open this link in your browser:');
console.log(`   ${dashboardUrl}/settings/api`);
console.log('\n2. Copy the "anon public" key');
console.log('\n3. Update your .env.local file with the real key\n');

console.log('🔧 To update your .env.local file automatically:');
console.log('==============================================');
console.log('1. Copy your anon key from Supabase');
console.log('2. Run this command (replace YOUR_ANON_KEY with the actual key):');
console.log('   sed -i \'\' "s/your_anon_key_here/YOUR_ANON_KEY/" .env.local');
console.log('\n3. Restart your dev server: npm run dev\n');

console.log('✅ After updating the key, your app should work with Supabase!'); 