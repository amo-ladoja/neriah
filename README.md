# Neriah - Email Action Manager

**Your emails, turned into actions.**

Neriah is a mobile-first web application (PWA) that extracts actionable items from Gmail using Claude AI and presents them in a clean dashboard with one-tap actions.

##  Current Status

 **MVP Implementation Complete!** All core features (P0 + P1) are implemented and ready for deployment.

###  What's Working
- Gmail OAuth integration with automatic token refresh
- Claude AI extraction (tasks, receipts, meetings)
- Background sync (manual + scheduled every 3 hours via GitHub Actions)
- Receipt OCR processing (images + PDFs)
- Calendar deep linking
- Real-time dashboard updates
- User feedback system
- Supabase Storage for attachments

###  Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete production setup guide  **START HERE**
- [Product Requirements Document](./neriah-mvp-prd-v2.md) - Complete PRD with features and specifications
- [Architecture Guide](./architecture.md) - System architecture, data flow, and scaling strategies
- [Implementation Plan](./plan.md) - Development progress and completed features
- [User Stories](./us.json) - Feature tracking with acceptance criteria

##  Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account with project created ([sign up here](https://supabase.com))
- Google Cloud account with OAuth credentials configured
- Anthropic API key for Claude AI ([get one here](https://console.anthropic.com))
- Vercel account for deployment (Hobby/Free tier works!)
- GitHub repository (for scheduled sync via GitHub Actions)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neriah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env.local` in the project root:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Google OAuth
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret

   # Anthropic Claude AI
   ANTHROPIC_API_KEY=sk-ant-your-api-key

   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Cron Security (generate with: openssl rand -hex 32)
   CRON_SECRET=your-generated-secret
   ```

   **Note**: The CRON_SECRET will also be used in GitHub Actions for scheduled sync.

4. **Set up Supabase Storage**

   See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed instructions on:
   - Creating the `receipts` storage bucket
   - Configuring RLS policies
   - Setting up database tables

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

7. **Set up GitHub Actions for Scheduled Sync**

   After deploying to Vercel, configure GitHub Actions to trigger background sync every 3 hours:

   - Add repository secrets: `CRON_SECRET` and `VERCEL_APP_URL`
   - Workflow file already exists at `.github/workflows/cron-sync.yml`
   - See **[SETUP_GUIDE.md § 3](./SETUP_GUIDE.md#3-github-actions-cron-setup)** for detailed setup

8. **For Production Deployment**

   Follow the complete setup guide: **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## Project Structure

```
neriah/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth-related routes
│   │   └── auth/callback/   # OAuth callback
│   ├── (main)/              # Protected routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── extracting/      # Extraction loading screen
│   │   ├── item/[id]/       # Item detail view
│   │   ├── receipt/[id]/    # Receipt detail view
│   │   └── meeting/[id]/    # Meeting detail view
│   ├── api/                 # API routes
│   │   ├── extract/         # Extraction endpoints
│   │   └── items/           # Item CRUD endpoints
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific components
│   ├── items/               # Item-related components
│   └── shared/              # Shared components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   ├── types/               # TypeScript type definitions
│   ├── actions/             # Server actions
│   ├── hooks/               # Custom React hooks
│   └── utils.ts             # Utility functions
├── public/
│   ├── fonts/               # Custom fonts (to be added)
│   ├── icons/               # PWA icons (to be added)
│   └── manifest.json        # PWA manifest
└── ...config files
```

##  Design System

### Colors
The app uses a custom dark-mode color palette with precise opacity variants:

**Primary Colors:**
- **Primary/Accent**: `#E8F401` (Bright yellow for CTAs and highlights)
- **Background**: `#131313` (Very dark background)
- **Card Surface**: `#1E1E1E` (Card backgrounds and secondary surfaces)
- **Foreground**: `#FDFDFD` (Near-white for text and icons)

**Semantic Colors:**
- **Success**: `#34A853` (Green for completed states)
- **Urgent**: `#FF4815` (Orange/red for urgent items)
- **Destructive**: `#80240B` (Dark red for errors and destructive actions)
- **Deep Black**: `#060606` (Text on yellow backgrounds)

**Opacity System:**
Each color has variants at 100%, 60%, 40%, 30%, 20%, 15%, 12%, and 2% opacity for precise control of transparency.

### Typography
- **Font**: SFT Schrifted Sans (custom typeface)
- **Weights**: 400 (Regular), 500 (Medium), 600 (DemiBold), 700 (Bold), 900 (Black)
- **Fallback**: system-ui, -apple-system, sans-serif

### Spacing
- **Grid System**: 8px base unit (4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 40px, 48px, 56px, 64px)
- **Touch Targets**: Minimum 44px for mobile accessibility

### Border Radius
- **Cards**: 8px (`rounded-lg`)
- **Buttons**: 4px (`rounded-md`)
- **Tags/Pills**: 12px (`rounded-xl`)
- **Small Elements**: 2px (`rounded-sm`)

##  Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **Auth** | Supabase Auth (Google OAuth) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **AI** | Claude 3.5 Sonnet (Anthropic) |
| **Email API** | Gmail API |
| **Hosting** | Vercel |
| **PWA** | next-pwa |

##  PWA Configuration

The app is configured as a Progressive Web App:

1. **Add custom icons**: Place icon files in `public/icons/` (see `public/icons/README.md`)
2. **Install on mobile**: Use "Add to Home Screen" in browser
3. **Offline support**: Service worker handles offline viewing of cached items

##  Development Workflow

### Running the app
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Custom Font Implementation

The project uses **SFT Schrifted Sans** as the primary typeface:

- Font files are located in `public/fonts/`
- @font-face declarations are in `app/globals.css`
- Configured in `tailwind.config.ts` as the primary sans-serif font
- All weights (400, 500, 600, 700, 900) with regular and italic variants are loaded

##  Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Run the SQL schema from `architecture.md` section 6.4
3. Enable Row Level Security (RLS) policies
4. Set up Google OAuth in Supabase Auth settings

### Required Tables

- `profiles` - User data and Gmail tokens
- `items` - Extracted action items
- `sync_logs` - Sync history
- `receipt_attachments` - Receipt file metadata

##  Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ANTHROPIC_API_KEY` - Claude AI API key

##  User Stories Status

Track development progress using `us.json`:

```json
{
  "status": "todo" | "doing" | "done"
}
```

Before starting work:
1. Check `us.json` for next priority task
2. Update status to "doing"
3. When complete, update to "done"

##  Contributing

1. Check the user stories in `us.json` for what needs to be done
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially on mobile)
5. Submit a pull request

##  License

Private - All rights reserved

---

**Team Resources:**
- [PRD](./neriah-mvp-prd-v2.md) - Product requirements and timeline
- [Architecture](./architecture.md) - Technical architecture and scaling
- [User Stories](./us.json) - Feature tracking

For questions, contact the product team.
