# Neriah - Email Action Manager

**Your emails, turned into actions.**

Neriah is a mobile-first web application (PWA) that extracts actionable items from Gmail using AI and presents them in a clean dashboard with one-tap actions.

## 📋 Project Documentation

- [Product Requirements Document](./neriah-mvp-prd-v2.md) - Complete PRD with features, timeline, and specifications
- [Architecture Guide](./architecture.md) - System architecture, data flow, and scaling strategies
- [User Stories](./us.json) - All user stories with status tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))
- A Google Cloud account for OAuth credentials
- An Anthropic API key for Claude AI

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
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your credentials:
   - Supabase URL and keys (from your Supabase project)
   - Google OAuth credentials (from Google Cloud Console)
   - Anthropic API key (from Anthropic Console)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

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

## 🎨 Design System

Based on the PRD specifications:

### Colors
- **Primary**: `#3B82F6` (Blue accent)
- **Success**: `#22C55E` (Green - complete)
- **Warning**: `#F97316` (Orange - snooze)
- **Urgent**: `#EF4444` (Red - urgent items)
- **Background**: White

### Typography
- **Font**: Custom font (to be provided by design team)
- Fallback: System UI fonts

### Spacing
- **Grid System**: 8px base unit
- **Touch Targets**: Minimum 44px (for mobile accessibility)

### Border Radius
- **Cards**: 8px
- **Buttons**: 4px

## 🔧 Tech Stack

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

## 📱 PWA Configuration

The app is configured as a Progressive Web App:

1. **Add custom icons**: Place icon files in `public/icons/` (see `public/icons/README.md`)
2. **Install on mobile**: Use "Add to Home Screen" in browser
3. **Offline support**: Service worker handles offline viewing of cached items

## 🧪 Development Workflow

### Running the app
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding Custom Fonts

1. Place font files in `public/fonts/`
2. Update `app/globals.css` with @font-face declarations
3. Update `tailwind.config.ts` to reference the font family

See `public/fonts/README.md` for detailed instructions.

## 🗄️ Database Setup

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

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ANTHROPIC_API_KEY` - Claude AI API key

## 📝 User Stories Status

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

## 🤝 Contributing

1. Check the user stories in `us.json` for what needs to be done
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially on mobile)
5. Submit a pull request

## 📄 License

Private - All rights reserved

---

**Team Resources:**
- [PRD](./neriah-mvp-prd-v2.md) - Product requirements and timeline
- [Architecture](./architecture.md) - Technical architecture and scaling
- [User Stories](./us.json) - Feature tracking

For questions, contact the product team.
