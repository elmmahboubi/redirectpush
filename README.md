# GoLinks - Advanced URL Shortener with Analytics

A modern, fast, and production-ready URL shortener built with Vite.js, React, Supabase, and TailwindCSS. Features advanced analytics, geolocation tracking, and a beautiful UI. Designed to be deployed on Vercel with custom domain support.

## 🚀 Features

- **Lightning Fast**: Built with Vite.js for instant hot reload and optimized builds
- **Clean UI**: Minimal, responsive design built with TailwindCSS and custom components
- **Fast Redirects**: Optimized for speed with efficient database queries
- **Advanced Analytics**: Real-time click tracking with time-based statistics
- **Geolocation Tracking**: Track clicks by country, city, and IP address
- **Referrer Analytics**: Track where your clicks come from (e.g., depop.com, facebook.com)
- **Country Tracking**: See which countries your clicks originate from with flag emojis
- **Auto-increment Slugs**: Automatically generates p1, p2, p3... for easy management
- **Production Ready**: Built with best practices for security and performance

## 🛠 Tech Stack

- **Frontend**: Vite.js + React 18 + TypeScript
- **Styling**: TailwindCSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router DOM
- **UI Components**: Custom components with Radix UI primitives
- **Hosting**: Vercel (compatible with custom domains)

## 📦 Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd golinks
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Run the migrations in the Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
-- supabase/migrations/20250712000937_foggy_rain.sql
-- supabase/migrations/20250712000938_add_referrer_tracking.sql
-- supabase/migrations/20250712000939_add_delete_policy.sql
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BASE_URL=https://your-domain.com

# SECURITY: Superuser Authentication (REQUIRED)
VITE_SUPERUSER_USERNAME=your_secure_username
VITE_SUPERUSER_PASSWORD=your_secure_password
```

**⚠️ SECURITY WARNING**: Never commit your `.env.local` file to version control. The superuser credentials are used for admin access to the application.

### 4. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🚀 Deployment on Vercel

### 1. Build and Deploy

```bash
# Build for production
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

### 2. Configure Custom Domain

1. In your Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update your DNS settings to point to Vercel

### 3. Environment Variables in Vercel

Add the same environment variables in your Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BASE_URL`
- `VITE_SUPERUSER_USERNAME` (REQUIRED for admin access)
- `VITE_SUPERUSER_PASSWORD` (REQUIRED for admin access)

**⚠️ SECURITY**: Make sure to set strong, unique credentials for the superuser authentication in your Vercel environment variables.

## 📊 Database Schema

The app uses two main tables:

### `short_links` table:
```sql
CREATE TABLE short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,           -- e.g., p1, p2, p3
  original_url text NOT NULL,          -- Full destination URL
  click_count integer DEFAULT 0,       -- Number of visits
  created_at timestamptz DEFAULT now() -- Creation timestamp
);
```

### `referrer_clicks` table (for analytics):
```sql
CREATE TABLE referrer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid REFERENCES short_links(id) ON DELETE CASCADE,
  referrer text,                       -- The website where the click came from
  user_agent text,                     -- Browser/device info
  ip_address inet,                     -- IP address (optional)
  country text,                        -- Country where the click originated
  country_code text,                   -- ISO country code (e.g., US, GB, FR)
  city text,                           -- City where the click originated (optional)
  clicked_at timestamptz DEFAULT now() -- When the click happened
);
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Public Access**: Configured for anonymous link creation and access
- **Input Validation**: URL validation on both client side
- **Error Handling**: Comprehensive error handling throughout the app
- **Environment-based Authentication**: Superuser credentials stored in environment variables, not in source code
- **Session Management**: Secure localStorage-based session persistence
- **Input Sanitization**: All user inputs are validated and sanitized

## 📱 How It Works

### Creating Short Links
1. User enters a long URL in the input field
2. App queries Supabase to get the next available slug number
3. Creates a new record with slug format `p{number}` (p1, p2, p3...)
4. Returns the short URL for copying and sharing

### Redirecting
1. User visits your domain with a slug (e.g., `yourdomain.com/p1`)
2. React Router captures the slug parameter
3. App queries Supabase for the original URL
4. Records referrer information (where the click came from)
5. Captures geolocation data (country, city, IP) asynchronously
6. Increments click count asynchronously
7. Redirects user to the original URL

### Advanced Analytics
- **Time-based Statistics**: Today, yesterday, last 7 days, last 30 days
- **Automatic Tracking**: Every click is recorded with referrer information
- **Domain Extraction**: Shows which websites are driving traffic
- **Device Detection**: Tracks mobile vs desktop usage
- **Country Tracking**: Shows which countries your clicks originate from with flag emojis
- **City Information**: Displays city names when available
- **Real-time Stats**: View analytics by clicking the chart icon next to each link
- **Detailed History**: See individual click timestamps, sources, and locations

## 🎨 Customization

### Changing the URL Format
To change from `p1, p2, p3...` to a different format, modify the slug generation logic in `src/pages/HomePage.tsx`:

```javascript
// Current: p1, p2, p3...
const newSlug = `p${nextNumber}`

// Custom examples:
const newSlug = `link${nextNumber}`        // link1, link2, link3...
const newSlug = `${nextNumber}`            // 1, 2, 3...
const newSlug = `go${nextNumber}`          // go1, go2, go3...
```

### Styling
The app uses TailwindCSS with a custom color scheme. Modify styles in:
- Global styles: `src/index.css`
- Component styles: Individual component files
- Tailwind config: `tailwind.config.js`

## 🔧 Performance Optimizations

- **Vite.js**: Lightning-fast development and optimized production builds
- **Database Indexing**: Optimized queries with proper indexes
- **Client-side Routing**: Fast navigation with React Router
- **Incremental Click Tracking**: Non-blocking click count updates
- **Error Boundaries**: Graceful error handling

## 🚀 Vite.js Benefits

- **Instant Server Start**: No bundling required in development
- **Lightning Fast HMR**: Hot Module Replacement that stays fast
- **Optimized Builds**: Rollup-based production builds
- **TypeScript Support**: First-class TypeScript support out of the box
- **Modern JavaScript**: ES modules and modern browser features

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ⚡ Vite.js and ❤️ for GoLinks**