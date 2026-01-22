# Product Requirements Document: Neriah MVP

**Date:** January 17, 2026
**Author:** Product Team
**Status:** Draft v2.1
**Version:** 2.1 (MVP - Simplified B2C + Receipts + Calendar + Feedback)

---

## 1. Executive Summary

### Problem Statement
Knowledge workers receive hundreds of emails daily containing actionable tasks, deadlines, meeting requests, invoices, and follow-ups. Important items get buried in inbox clutter, leading to missed commitments, forgotten receipts, and wasted time scrolling through emails. Users need a simple app that automatically surfaces actionable items, categorizes expenses, and lets them take action instantly.

### Proposed Solution
**Neriah** is a standalone mobile-first web app that connects to Gmail with a single sign-in, extracts actionable items using Claude AI, and presents them with one-tap actions (reply to email, schedule meeting, view categorized receipts, mark complete). No external tools required.

### Key Differentiators
- **One-step setup:** Sign in with Google = done
- **Instant value:** First extraction happens immediately after signup
- **Actionable:** Reply, schedule meetings, and complete tasks directly from the app
- **Auto-categorized receipts:** Software, Travel, Medical, Office, Meals, Utilities automatically classified
- **Standalone:** No Notion, no Zapier, no complex integrations

### Business Impact
- **Increased Productivity**: Users save 30-60 minutes daily on email triage
- **Reduced Cognitive Load**: AI surfaces what matters, users just act
- **High Retention**: Critical daily workflow creates habit

### Timeline
| Phase | Milestone | Target Date |
|-------|-----------|-------------|
| Phase 1 | Design & Architecture Complete | Week 2 |
| Phase 2 | Auth + Immediate Extraction | Week 4 |
| Phase 3 | Task Actions & Receipt Extraction | Week 6 |
| Phase 4 | Receipt UI, Calendar & Feedback | Week 8 |
| Phase 5 | Background Sync & Notifications | Week 9 |
| Phase 6 | Beta Launch | Week 10 |

### Resources Required
- **Engineering**: 2 Full-stack developers
- **Design**: 1 UI/UX Designer (part-time)
- **Infrastructure**: Vercel (frontend), Supabase (database + auth), Google Cloud Run (extraction service)
- **Budget**: $5,000 (infrastructure + API costs for first 3 months)

### Success Metrics
| Metric | Target (3 months) |
|--------|-------------------|
| User Signups | 500 users |
| Onboarding Completion | 95% (single step = high completion) |
| Task Extraction Accuracy | 85%+ (validated via user feedback) |
| Receipt Categorization Accuracy | 85%+ (validated via user feedback) |
| Daily Active Users | 40% of signups |
| Actions Taken per User | 3+ per day |
| Feedback Submissions | 20% of extractions |

---

## 2. Problem Definition

### 2.1 Customer Problem

**Who:** Busy professionals, freelancers, and anyone who:
- Receives 30+ emails daily
- Misses important follow-ups buried in their inbox
- Wants a simple "what do I need to do" view
- Hates switching between apps

**What:**
- Important emails get lost in noise (newsletters, promotions, notifications)
- No easy way to see "just the actionable stuff"
- Replying to emails requires context-switching to Gmail
- Invoices and attachments are hard to find later

**When:**
- Morning email triage
- Quick checks throughout the day
- End-of-day review before signing off

**Where:**
- Mobile (primary) - quick checks on the go
- Desktop (secondary) - deeper work sessions

**Why (Root Cause):**
- Email clients show everything equally (spam = important client email)
- No native AI to identify what needs action
- Existing solutions require complex setup or external tools

**Impact of Not Solving:**
- Missed deadlines and follow-ups
- Client frustration from slow responses
- Anxiety from overflowing inbox
- Lost invoices and important documents

### 2.2 Market Opportunity

**Market Size:**
- **TAM:** $50B - Global productivity software market
- **SAM:** $5B - Email productivity & automation tools
- **SOM:** $100M - AI-powered email action apps

**Competition:**
| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **Superhuman** | Great UX, fast | $30/mo, no AI extraction, power users only |
| **SaneBox** | Email filtering | No task extraction, no actions |
| **Shortwave** | AI summaries | Replaces Gmail entirely (high friction) |
| **Spark** | Nice mobile app | No AI task extraction |
| **Gmail itself** | Ubiquitous | No AI action extraction, cluttered |

**Gap:** No simple, standalone app that extracts actions from email and lets you act on them instantly.

**Timing - Why Now?**
- Claude AI enables accurate task extraction
- Mobile-first usage patterns dominant
- Users expect AI-powered experiences (ChatGPT moment)
- Subscription fatigue = users want simple, focused tools

### 2.3 Business Case

**Revenue Potential:**
- Pricing: $9/month (individual) or $79/year
- Year 1 Target: 1,000 paying users = $108,000 ARR
- Year 2 Target: 10,000 paying users = $1.08M ARR

**Cost Structure (per 1,000 users):**
- Supabase: ~$25/month
- Anthropic API: ~$500/month (estimated)
- Vercel: ~$20/month
- Google Cloud Run: ~$50/month
- **Total:** ~$595/month = $0.60/user/month

**Unit Economics:**
- Revenue per user: $9/month
- Cost per user: $0.60/month
- **Gross margin: 93%**

---

## 3. Solution Overview

### 3.1 Proposed Solution

**Neriah** is a standalone web app (mobile-first, PWA) that:

1. **One-Step Signup (30 seconds):**
   - User clicks "Sign in with Google"
   - Single OAuth grants app access + Gmail read permission
   - That's it. Done.

2. **Immediate First Extraction:**
   - While user watches a brief "analyzing your inbox" animation
   - System fetches last 50 emails (or 7 days)
   - Claude AI extracts actionable items
   - User sees their first tasks within 60 seconds

3. **Ongoing Background Sync (every 3 hours):**
   - System fetches new emails since last sync
   - Extracts new actionable items
   - Push notification: "3 new items need your attention"

4. **In-App Actions:**
   - **Reply:** Opens Gmail compose with context pre-filled
   - **View Invoice/Attachment:** Opens attachment viewer in-app
   - **Mark Complete:** Archives the item
   - **Snooze:** Resurface later (tomorrow, next week)
   - **Delete:** Remove from list

**User Journey:**
```
Landing Page → "Sign in with Google" → 60-second extraction → See actionable items → Take action → Done
```

### 3.2 In Scope (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Google Sign-In** | Single OAuth for auth + Gmail access | P0 (Critical) |
| **Immediate Extraction** | Extract tasks from last 7 days on signup | P0 (Critical) |
| **Task Dashboard** | List of actionable items with metadata | P0 (Critical) |
| **Reply Action** | Deep link to Gmail compose with context | P0 (Critical) |
| **Mark Complete** | Archive/complete an item | P0 (Critical) |
| **Background Sync** | Fetch new emails every 3 hours | P0 (Critical) |
| **Receipt Extraction** | Auto-extract receipts from emails with OCR/PDF parsing | P0 (Critical) |
| **Receipt Categorization** | AI auto-categorizes receipts: Software, Travel, Medical, Office, Meals, Utilities, Other | P0 (Critical) |
| **Receipt Viewer** | In-app PDF/image viewer for receipt attachments | P0 (Critical) |
| **Category Filtering** | Filter dashboard by receipt category | P0 (Critical) |
| **Schedule Meeting** | Deep link to Google Calendar with pre-filled meeting details | P1 (Important) |
| **Feedback System** | Thumbs up/down on extractions with optional comment | P1 (Important) |
| **Push Notifications** | Alert when new items extracted | P1 (Important) |
| **Snooze Action** | Resurface item later | P1 (Important) |
| **Task Categories** | Filter by type (reply, follow-up, deadline, meeting) | P1 (Important) |
| **Search** | Find past items | P2 (Nice-to-have) |
| **Email Preview** | See full email content in-app | P2 (Nice-to-have) |

### 3.3 Out of Scope (Post-MVP)

**Explicitly NOT in MVP:**
- Notion/Todoist/Asana integrations (standalone first)
- Calendar integration
- Multiple email accounts
- Team/shared features
- Smart replies (AI-generated responses)
- Email sending from within app
- Desktop app (web PWA only)
- Offline mode

**Future Roadmap:**
- Phase 2: Smart replies + calendar integration
- Phase 3: Multiple email accounts
- Phase 4: Native mobile apps (iOS/Android)
- Phase 5: Team plans

### 3.4 MVP Definition

**Core Flow (Must Work Perfectly):**
1. User signs in with Google → lands on dashboard
2. First extraction completes within 60 seconds
3. User sees list of actionable items
4. User can reply to an email (opens Gmail)
5. User can view an invoice/attachment
6. User can mark item complete
7. Background sync adds new items every 3 hours

**Success Criteria:**
- Onboarding completion: 95%+ (it's one click!)
- Time to first value: < 60 seconds
- Extraction accuracy: 85%+
- Daily retention (Day 7): 40%+

---

## 4. User Stories & Requirements

### 4.1 User Stories

#### Story 1: Sign Up & Immediate Value
```
As a busy professional
I want to sign in with one click and immediately see my actionable emails
So that I can start being productive without any setup

Acceptance Criteria:
- [ ] "Sign in with Google" button on landing page
- [ ] Single OAuth flow grants auth + Gmail read access
- [ ] User sees "Analyzing your inbox..." loading state
- [ ] First tasks appear within 60 seconds
- [ ] No additional setup steps required
```

#### Story 2: View My Action Items
```
As a Neriah user
I want to see all my actionable items in one clean list
So that I know exactly what needs my attention

Acceptance Criteria:
- [ ] Dashboard shows list of extracted items
- [ ] Each item shows: title, sender, category, time received
- [ ] Items sorted by priority/recency
- [ ] Can filter by category (invoices, follow-ups, deadlines)
- [ ] Empty state if no items (with encouraging message)
```

#### Story 3: Reply to Email
```
As a Neriah user
I want to quickly reply to an email that needs response
So that I can take action without leaving my workflow

Acceptance Criteria:
- [ ] "Reply" button on each relevant item
- [ ] Tapping opens Gmail compose in new tab/app
- [ ] Gmail compose pre-filled with: To, Subject (Re:), thread context
- [ ] After sending, user can mark item complete in Neriah
```

#### Story 4: View Invoice/Attachment
```
As a Neriah user
I want to view invoices and attachments without digging through email
So that I can quickly review documents that need attention

Acceptance Criteria:
- [ ] Items with attachments show attachment icon
- [ ] "View Invoice" / "View Attachment" button
- [ ] PDF viewer opens in-app (or new tab)
- [ ] Image attachments display inline
- [ ] Can download attachment
```

#### Story 5: Complete an Item
```
As a Neriah user
I want to mark items as complete when I've handled them
So that my list stays clean and focused

Acceptance Criteria:
- [ ] "Done" / checkmark button on each item
- [ ] Completed items move to "Completed" section (or hide)
- [ ] Can undo completion within 5 seconds
- [ ] Completion syncs to database immediately
```

#### Story 6: Receive New Items Automatically
```
As a Neriah user
I want new actionable items to appear automatically
So that I don't miss anything important

Acceptance Criteria:
- [ ] Background sync runs every 3 hours
- [ ] New items appear at top of list
- [ ] Push notification: "3 new items need attention"
- [ ] Badge count updates on PWA icon
- [ ] Can manually trigger sync (pull-to-refresh)
```

#### Story 7: Snooze an Item
```
As a Neriah user
I want to snooze items I can't handle right now
So that they resurface when I'm ready

Acceptance Criteria:
- [ ] "Snooze" button with options: Later today, Tomorrow, Next week
- [ ] Snoozed items disappear from main list
- [ ] Items reappear at scheduled time
- [ ] Can view all snoozed items in separate section
```

#### Story 8: Schedule Meeting from Email
```
As a Neriah user
I want to schedule meetings from email requests
So that I can book time without switching apps

Acceptance Criteria:
- [ ] Items with meeting requests show "Schedule Meeting" button
- [ ] Tapping opens Google Calendar with pre-filled: title, time, attendees, description
- [ ] Can schedule directly or edit before creating
- [ ] After scheduling, can mark item complete
- [ ] Handles multiple suggested times from email
```

#### Story 9: View Categorized Receipts
```
As a Neriah user
I want to see receipts auto-categorized by expense type
So that I can quickly find and review expenses

Acceptance Criteria:
- [ ] Receipts extracted with vendor, amount, date, invoice number
- [ ] AI assigns category: Software, Travel, Medical, Office, Meals, Utilities, Other
- [ ] Can filter dashboard: "Show only Travel receipts"
- [ ] Receipt details display in structured format (vendor, amount, date, category)
- [ ] Category badge shows on each receipt item
```

#### Story 10: Review Receipt Details
```
As a Neriah user
I want to view receipt PDFs and extracted details
So that I can verify expense information

Acceptance Criteria:
- [ ] "View Receipt" button opens in-app PDF viewer
- [ ] Shows extracted: Vendor, Amount, Currency, Date, Invoice #, Category, Tax
- [ ] Can download original PDF or image
- [ ] Image receipts display inline
- [ ] OCR confidence score displayed
```

#### Story 11: Provide Feedback on Extractions
```
As a Neriah user
I want to mark extractions as correct/incorrect
So that the AI improves over time and I can report issues

Acceptance Criteria:
- [ ] Thumbs up/down buttons on each item (tasks, receipts, meetings)
- [ ] Optional: "What was wrong?" comment field
- [ ] Feedback saved immediately
- [ ] Visual confirmation after submission ("Thanks for your feedback!")
- [ ] Can change feedback after submission
```

### 4.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR1** | User can sign up/login with Google OAuth (includes Gmail scope) | P0 |
| **FR2** | System extracts tasks from last 7 days on first login | P0 |
| **FR3** | Extraction completes within 60 seconds | P0 |
| **FR4** | Dashboard displays actionable items with metadata | P0 |
| **FR5** | User can tap "Reply" to open Gmail compose | P0 |
| **FR6** | User can view PDF/image attachments in-app | P0 |
| **FR7** | User can mark items as complete | P0 |
| **FR8** | Background job syncs new emails every 3 hours | P0 |
| **FR9** | Push notifications for new items | P1 |
| **FR10** | User can snooze items | P1 |
| **FR11** | User can filter by category | P1 |
| **FR12** | User can manually trigger sync (pull-to-refresh) | P1 |
| **FR13** | System prevents duplicate items (email ID tracking) | P1 |
| **FR14** | User can search past items | P2 |
| **FR15** | User can view full email content in-app | P2 |
| **FR16** | System extracts meeting details (attendees, times, duration) from emails | P1 |
| **FR17** | System generates Google Calendar deep links with pre-filled meeting data | P1 |
| **FR18** | System extracts receipt data from PDF and image attachments using OCR | P0 |
| **FR19** | AI auto-categorizes receipts into 7 categories (Software, Travel, Medical, Office, Meals, Utilities, Other) | P0 |
| **FR20** | Dashboard displays receipt details in structured format (vendor, amount, currency, date, invoice #, tax, category) | P0 |
| **FR21** | User can filter dashboard by receipt category | P0 |
| **FR22** | User can provide thumbs up/down feedback on any extracted item | P1 |
| **FR23** | User can add optional comment explaining feedback | P2 |
| **FR24** | System stores feedback for future AI improvement and analytics | P1 |
| **FR25** | In-app PDF/image viewer for receipt attachments | P0 |

### 4.3 Non-Functional Requirements

**Performance:**
- Initial extraction: < 60 seconds for 50 emails
- Dashboard load time: < 1 second
- Action response time: < 200ms
- Background sync: < 2 minutes for 20 new emails

**Scalability:**
- Support 10,000 users in Year 1
- Handle 100 emails per user per sync
- Gmail API: Stay within quota (250 units/user/second)

**Security:**
- HTTPS/TLS 1.3 for all connections
- OAuth tokens encrypted at rest (Supabase vault)
- No email content stored permanently (only extracted metadata)
- GDPR/CCPA compliant (data export, deletion)

**Reliability:**
- Uptime: 99.5%
- Background sync success rate: 98%+
- Zero data loss

**Mobile-First:**
- Responsive design (mobile-first)
- PWA installable
- Touch-friendly UI (44px tap targets)
- Works offline for viewing cached items

---

## 5. Design & User Experience

### 5.1 Design Principles

1. **Instant Value**: User sees actionable items within 60 seconds of signup
2. **One-Tap Actions**: Every action is one tap away (reply, view, complete)
3. **Mobile-First**: Designed for phone, scales up to desktop
4. **Calm Interface**: Clean, minimal UI that reduces anxiety
5. **Trust**: Clear about what data is accessed, easy to disconnect

### 5.2 Key Screens

**1. Landing Page** (`/`)
- Hero: "Your emails, turned into actions"
- Subhead: "Sign in with Google. See what needs your attention. Act."
- Single CTA: "Sign in with Google" button
- Below fold: 3 feature highlights, testimonials

**2. Loading/Extraction Screen** (`/extracting`)
- Friendly animation (inbox → magic wand → checklist)
- Progress: "Analyzing your inbox... Found 12 items so far"
- Completes automatically, redirects to dashboard

**3. Dashboard** (`/dashboard`)
- Header: Logo, sync status, settings icon
- Filter tabs: All | Tasks | Receipts | Meetings
- Receipt category sub-filters (when Receipts selected): Software | Travel | Medical | Office | Meals | Utilities | Other
- Item list (cards):
  - Sender avatar + name
  - Item title (extracted action)
  - Category badge + time + confidence score
  - For receipts: Vendor, amount, category badge
  - Action buttons: Reply | Schedule Meeting | View Receipt | Done | Snooze
  - Feedback buttons: 👍 👎 (bottom of each card)
- Pull-to-refresh for manual sync
- FAB: Manual sync button (mobile)

**4. Item Detail** (`/item/:id`)
- Full item details
- Email preview (sender, subject, snippet)
- Attachment preview (if applicable)
- Full action bar: Reply | View Attachment | Done | Snooze | Delete

**5. Settings** (`/settings`)
- Account: Email, sign out, delete account
- Notifications: Push on/off, email digest on/off
- Data: Export my data, disconnect Gmail
- About: Version, privacy policy, terms

**6. Receipt Detail** (`/receipt/:id`)
- Header: "Receipt from {Vendor}"
- Structured data display:
  - Vendor name
  - Amount + Currency
  - Date
  - Invoice number
  - Category badge (e.g., "Travel")
  - Tax amount (if extracted)
  - Payment method (if extracted)
  - Confidence score
- In-app PDF/image viewer (below structured data)
- Action buttons: Download | Mark Complete | Delete
- Feedback section:
  - "Was this extraction correct?"
  - 👍 Correct | 👎 Incorrect
  - Optional comment field: "What was wrong?"
  - Category correction dropdown (if incorrect)

**7. Meeting Detail** (`/meeting/:id`)
- Header: "Meeting Request from {Sender}"
- Extracted meeting info:
  - Suggested times (list of options if multiple)
  - Duration
  - Attendees (To/CC from email)
  - Location/Meeting link (if extracted)
  - Meeting topic/agenda (from email content)
- Email preview (sender, subject, relevant snippet)
- Primary action: "Schedule Meeting" button → Opens Google Calendar with pre-filled data
- Alternative: "View in Gmail" → Deep link to original email
- Feedback: 👍 👎 buttons

### 5.3 Information Architecture

```
/ (Landing - unauthenticated)
├── /auth/google (OAuth redirect)
├── /extracting (first-time loading)
├── /dashboard (main screen - authenticated)
│   ├── /item/:id (item detail modal/page)
│   └── /completed (completed items)
├── /snoozed (snoozed items)
└── /settings
    ├── /settings/notifications
    ├── /settings/data
    └── /settings/account
```

### 5.4 Design System

- **Colors**: White background, Blue accent (#3B82F6), Green (complete), Orange (snooze), Red (urgent)
- **Typography**: Inter (clean, modern, readable)
- **Components**: shadcn/ui (accessible, consistent)
- **Icons**: Lucide React
- **Spacing**: 8px grid system
- **Border radius**: 8px (cards), 4px (buttons)

---

## 6. Technical Specifications

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       USER (Browser/PWA)                     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                       │
│                      (Vercel Edge)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Pages (App   │  │ API Routes   │  │ Server       │      │
│  │ Router)      │  │ (/api/*)     │  │ Actions      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐
│    SUPABASE      │ │ EXTRACTION   │ │      GMAIL API       │
│  ┌────────────┐  │ │   SERVICE    │ │                      │
│  │ Auth       │  │ │ (Cloud Run)  │ │  - Fetch emails      │
│  │ (Google    │  │ │              │ │  - Get attachments   │
│  │  OAuth)    │  │ │ Claude AI    │ │                      │
│  ├────────────┤  │ │ extracts     │ └──────────────────────┘
│  │ Database   │  │ │ actions      │
│  │ (Postgres) │  │ └──────────────┘
│  ├────────────┤  │
│  │ Realtime   │  │
│  │ (WebSocket)│  │
│  ├────────────┤  │
│  │ Storage    │  │
│  │ (Attach-   │  │
│  │  ments)    │  │
│  └────────────┘  │
└──────────────────┘
```

### 6.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14+ | React framework, App Router, Server Actions |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Components** | shadcn/ui | Accessible UI components |
| **Auth** | Supabase Auth | Google OAuth with Gmail scopes |
| **Database** | Supabase (PostgreSQL) | Users, items, sync state |
| **Realtime** | Supabase Realtime | Push new items to UI |
| **Storage** | Supabase Storage | Cache attachments |
| **Extraction Service** | Google Cloud Run | Serverless container for AI extraction |
| **AI** | Claude 3.5 Sonnet | Task/receipt/meeting extraction from emails |
| **Email API** | Gmail API | Fetch emails, attachments |
| **Calendar API** | Google Calendar API | Deep link generation for meeting scheduling |
| **OCR** | tesseract.js | Extract text from receipt images (reused from V1) |
| **PDF Parser** | pdf-parse | Extract text from PDF receipts (reused from V1) |
| **Background Jobs** | Vercel Cron + Cloud Run | 3-hour sync schedule |
| **Push Notifications** | Web Push API | Notify users of new items |
| **Hosting** | Vercel | Frontend hosting, edge functions |

### 6.3 API Design

**Supabase handles most data operations directly. Custom API routes:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback` | GET | Google OAuth callback (Supabase handles) |
| `/api/extract/initial` | POST | Trigger first-time extraction |
| `/api/extract/sync` | POST | Trigger manual sync |
| `/api/webhooks/cron` | POST | Scheduled 3-hour sync (Vercel Cron) |
| `/api/items/:id/complete` | POST | Mark item complete |
| `/api/items/:id/snooze` | POST | Snooze item |
| `/api/items/:id/feedback` | POST | Submit thumbs up/down + optional comment |
| `/api/items/:id/schedule` | POST | Save Google Calendar event ID after user schedules meeting |
| `/api/receipts/:id/attachment` | GET | Fetch receipt PDF/image from Supabase Storage |
| `/api/receipts/filter` | GET | Filter receipts by category (?category=travel) |
| `/api/attachments/:id` | GET | Fetch attachment (proxied) |

**Supabase Direct Access (via client SDK):**
- `items` table: CRUD operations
- `sync_logs` table: Read sync history
- Realtime subscription: New items

### 6.4 Database Schema (Supabase PostgreSQL)

```sql
-- Users (managed by Supabase Auth, extended)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  gmail_token JSONB, -- Encrypted OAuth tokens
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted action items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL, -- Gmail message ID (for deduplication)
  
  -- Extracted data
  title TEXT NOT NULL, -- "Reply to John about Q4 report"
  description TEXT, -- Additional context
  category TEXT NOT NULL, -- 'reply', 'invoice', 'follow_up', 'deadline', 'review', 'meeting'
  priority TEXT DEFAULT 'normal', -- 'urgent', 'normal', 'low'
  due_date TIMESTAMPTZ, -- Extracted deadline (if any)
  confidence REAL, -- AI confidence 0-1

  -- Receipt-specific data (JSONB for flexibility)
  receipt_details JSONB, -- {vendor, amount, currency, invoiceNumber, date, tax, lineItems, paymentMethod}
  receipt_category TEXT, -- 'software', 'travel', 'medical', 'office', 'meals', 'utilities', 'other'

  -- Meeting-specific data
  meeting_details JSONB, -- {attendees: [], suggestedTimes: [], duration: 60, location: ''}
  calendar_event_id TEXT, -- If user schedules, store Google Calendar event ID

  -- Email metadata
  sender_name TEXT,
  sender_email TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  email_date TIMESTAMPTZ,
  has_attachment BOOLEAN DEFAULT false,
  attachment_ids TEXT[], -- Gmail attachment IDs

  -- Feedback system
  user_feedback TEXT, -- 'positive', 'negative', null
  feedback_comment TEXT, -- Optional user explanation
  feedback_at TIMESTAMPTZ,

  -- Item state
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'snoozed', 'deleted'
  snoozed_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, email_id)
);

-- Sync history
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  emails_processed INTEGER DEFAULT 0,
  items_extracted INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'running', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own items" ON public.items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync logs" ON public.sync_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_items_user_status ON public.items(user_id, status);
CREATE INDEX idx_items_user_created ON public.items(user_id, created_at DESC);
CREATE INDEX idx_items_email_id ON public.items(email_id);
CREATE INDEX idx_items_receipt_category ON public.items(user_id, receipt_category) WHERE receipt_category IS NOT NULL;
CREATE INDEX idx_items_category ON public.items(user_id, category);

-- Receipt attachments table
CREATE TABLE public.receipt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'application/pdf', 'image/png', etc.
  file_size INTEGER,
  storage_path TEXT NOT NULL, -- Supabase Storage: 'receipts/{user_id}/{item_id}/{filename}'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_item ON public.receipt_attachments(item_id);

ALTER TABLE public.receipt_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipt attachments" ON public.receipt_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = receipt_attachments.item_id
      AND items.user_id = auth.uid()
    )
  );
```

### 6.5 Extraction Service (Cloud Run)

**Input:** User ID, Gmail access token, date range
**Output:** Array of extracted items

```typescript
interface ExtractionRequest {
  userId: string;
  accessToken: string;
  since: Date; // Fetch emails since this date
  limit?: number; // Max emails to process (default 50)
}

interface ExtractedItem {
  emailId: string;
  title: string;
  description?: string;
  category: 'reply' | 'invoice' | 'follow_up' | 'deadline' | 'review';
  priority: 'urgent' | 'normal' | 'low';
  dueDate?: Date;
  confidence: number;
  senderName: string;
  senderEmail: string;
  emailSubject: string;
  emailSnippet: string;
  emailDate: Date;
  hasAttachment: boolean;
  attachmentIds?: string[];
}
```

**Claude Prompt (enhanced with receipts & meetings):**
```
Analyze this email and extract actionable items. For each action, provide:
- title: A clear, actionable title (e.g., "Reply to John about Q4 report")
- category: One of [reply, invoice, follow_up, deadline, review, meeting]
- priority: urgent (needs response today), normal, or low
- dueDate: Any mentioned deadline (ISO format) or null
- confidence: Your confidence this is a real action item (0-1)

**For Receipts/Invoices:**
If this email contains a receipt or invoice:
- Extract: vendor name, total amount, currency, date, invoice number, tax amount
- Categorize into ONE of: software, travel, medical, office, meals, utilities, other
  - software: SaaS, licenses, cloud services, software tools (e.g., Notion, GitHub, AWS, Vercel)
  - travel: flights, hotels, car rentals, rideshares, parking (e.g., United, Hilton, Uber, Hertz)
  - medical: healthcare, insurance, prescriptions, medical equipment (e.g., CVS, Kaiser, Blue Cross)
  - office: supplies, furniture, equipment, office rent (e.g., Staples, Amazon office items, Office Depot)
  - meals: restaurants, catering, business meals (e.g., Starbucks, Uber Eats, Chipotle)
  - utilities: internet, phone, electricity, water, gas (e.g., Comcast, AT&T, PG&E)
  - other: anything that doesn't fit above categories
- Look for: PDF attachments, invoice numbers, payment confirmations, "Invoice", "Receipt", "Payment"

**For Meeting Requests:**
If this email contains a meeting request:
- Extract: suggested times (all mentioned), attendees (To/CC), duration (default 60 mins), location/meeting link
- Identify: direct asks ("Let's meet") vs. availability checks ("Are you free?")
- Parse: relative times ("tomorrow at 2pm"), date formats ("Jan 20th at 3pm PST")
- Include timezone if mentioned

Only extract items that require user action. Ignore newsletters, promotions, notifications.

Email:
From: {sender}
Subject: {subject}
Date: {date}
Body: {body}
Attachments: {attachments}
```

### 6.6 Security Considerations

**Authentication:**
- Supabase Auth with Google OAuth
- Gmail scopes: `gmail.readonly`, `gmail.metadata`
- Tokens encrypted in Supabase (vault)
- Session: 30-day refresh tokens

**Data Privacy:**
- Email content NOT stored (only extracted metadata)
- Attachments cached temporarily in Supabase Storage (7 days)
- User can delete all data anytime
- GDPR: Export and deletion endpoints

**API Security:**
- Supabase RLS enforces user data isolation
- API routes protected by Supabase session
- Cron webhook protected by secret token
- Rate limiting via Vercel/Supabase

---

## 7. Go-to-Market Strategy

### 7.1 Launch Plan

**Soft Launch (Beta) - Week 8:**
- Target: 100 beta users (Twitter, ProductHunt waitlist)
- Goals: Validate extraction accuracy, find UX issues
- Feedback: In-app feedback button, user interviews

**Public Launch - Week 10:**
- ProductHunt launch (target: Top 5 of the day)
- Twitter/X thread + demo video
- Hacker News Show HN
- Target: 500 signups in first week

### 7.2 Pricing Strategy

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 20 items/month, 24-hour sync, no snooze |
| **Pro** | $9/month or $79/year | Unlimited items, 3-hour sync, snooze, priority support |

**Why $9/month:**
- Lower than Superhuman ($30), competitive with other productivity tools
- High margin (93% gross margin)
- Annual discount drives commitment

### 7.3 Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| User Signups | 500 |
| Onboarding Completion | 95% |
| Free → Pro Conversion | 15% |
| Day 7 Retention | 40% |
| Day 30 Retention | 25% |
| Actions per User per Day | 3+ |
| NPS Score | 50+ |

---

## 8. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low extraction accuracy** | Medium | High | Extensive prompt tuning, user feedback loop, show confidence scores |
| **Receipt OCR accuracy on poor-quality images** | High | Medium | Show confidence score, allow user feedback to flag errors, fallback to manual PDF viewer, support high-res images only |
| **Incorrect receipt categorization** | Medium | High | Thumbs down feedback, allow user to see/change category, AI learns from corrections, show category confidence |
| **Meeting time parsing ambiguity** | Medium | Medium | Show extracted time for user review before scheduling, use email sender timezone, handle multiple suggested times |
| **Google OAuth rejection** | Low | Critical | Apply early, follow guidelines, limited scopes (readonly) |
| **Gmail API rate limits** | Low | Medium | Batch requests, respect quotas, queue system |
| **Users don't return daily** | Medium | High | Push notifications, email digest, snooze feature |
| **Privacy concerns** | Medium | High | Clear messaging ("we don't store your emails"), easy disconnect |
| **Claude API costs spike** | Medium | Medium | Set per-user limits, optimize prompts, cache results |

---

## 9. Timeline & Milestones

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 1 | Kickoff | PRD approved, Figma started, Supabase project created |
| 2 | Design Complete | Wireframes, UI mockups, user flow finalized (including receipt/meeting screens) |
| 3 | Auth + DB | Google OAuth working, database schema with receipt/meeting fields, profiles |
| 4 | First Extraction | Extraction service deployed, task extraction working |
| 5 | Receipt Extraction | OCR/PDF parsing, receipt categorization, AI prompt tuning |
| 6 | Dashboard + Filters | Item list UI, category filtering (tasks/receipts/meetings), view/complete actions |
| 7 | Receipt UI + Calendar | Receipt viewer, category badges, calendar deep links, meeting scheduling |
| 8 | Feedback System + Attachments | Thumbs up/down, Supabase Storage integration, attachment viewer |
| 9 | Background Sync + Notifications | Cron job, push notifications, realtime updates |
| 10 | Beta Launch | Deploy to production, onboard 100 beta users, iterate based on feedback |

---

## 10. Team & Resources

### 10.1 Team

| Role | Responsibilities | Time |
|------|------------------|------|
| **Product Manager** | PRD, roadmap, metrics, launch | 50% |
| **Full-stack Engineer 1** | Frontend (Next.js), Supabase integration | 100% |
| **Full-stack Engineer 2** | Extraction service, Gmail API, background jobs | 100% |
| **UI/UX Designer** | Wireframes, mockups, design system | 25% |

### 10.2 Budget

| Category | Cost |
|----------|------|
| Engineering (2 × 10 weeks) | $80,000 |
| Design (0.25 × 10 weeks) | $2,000 |
| Supabase (3 months) | $75 |
| Supabase Storage (receipt attachments) | $25 |
| Vercel (3 months) | $60 |
| Google Cloud Run (3 months) | $150 |
| Anthropic API (3 months, higher usage for receipts) | $2,000 |
| Domain + misc | $100 |
| **Total** | ~$84,410 |

---

## 11. Appendix

### 11.1 Action Types & Deep Links

| Category | Example Title | Primary Action | Deep Link |
|----------|---------------|----------------|-----------|
| **Reply** | "Reply to John about Q4 report" | Open Gmail compose | `https://mail.google.com/mail/?view=cm&to={email}&su=Re:{subject}` |
| **Invoice** | "Review invoice from Acme Corp" | View PDF | In-app viewer or `https://mail.google.com/mail/u/0/#inbox/{messageId}` |
| **Follow-up** | "Follow up with Sarah on proposal" | Open Gmail compose | Same as Reply |
| **Deadline** | "Submit report by Friday" | Mark complete | In-app action |
| **Review** | "Review contract from Legal" | View attachment | In-app viewer |

### 11.2 Extraction Categories

| Category | Trigger Signals | Example Emails |
|----------|-----------------|----------------|
| `reply` | Questions, requests, "let me know", "please respond" | "Can you send me the latest figures?" |
| `invoice` | "Invoice", "payment", "receipt", PDF attachment | "Invoice #1234 attached" |
| `follow_up` | "Following up", "checking in", "any update" | "Just checking in on the proposal" |
| `deadline` | Dates, "by EOD", "due", "deadline" | "Please submit by Friday 5pm" |
| `review` | "Review", "feedback", "take a look", doc attachment | "Can you review the attached contract?" |
| `meeting` | "Let's meet", "schedule", "are you free", calendar invite | "Are you available tomorrow at 2pm for a quick sync?" |

### 11.3 Receipt Categories (from V1)

Auto-categorization rules for expense classification:

| Category | Examples | Vendor Signals | Use Cases |
|----------|----------|----------------|-----------|
| **software** | Notion, GitHub, AWS, Vercel, Stripe, Figma | ".io", "cloud", "SaaS", "subscription", "API", "hosting" | Software licenses, cloud services, developer tools |
| **travel** | United, Hilton, Uber, Hertz, Airbnb, Expedia | "Airlines", "Hotel", "rental", "airport", "flight", "booking" | Flights, hotels, car rentals, rideshares, parking |
| **medical** | CVS, Kaiser, Blue Cross, Walgreens, UnitedHealth | "Pharmacy", "Hospital", "Dr.", "Medical", "Health", "Rx" | Healthcare, insurance, prescriptions, medical equipment |
| **office** | Staples, Amazon Business, Office Depot, WeWork | "Office", "Supplies", "Furniture", "Workspace", "Rent" | Office supplies, furniture, equipment, coworking |
| **meals** | Starbucks, Uber Eats, Chipotle, Doordash, Grubhub | "Restaurant", "Food", "Catering", "Coffee", "Delivery" | Business meals, team lunches, catering |
| **utilities** | Comcast, AT&T, Verizon, PG&E, ConEd | "Internet", "Phone", "Electric", "Utility", "Telecom" | Internet, phone, electricity, water, gas |
| **other** | Anything else | Default fallback | Miscellaneous expenses that don't fit above |

**Categorization Logic:**
1. Check vendor name against known patterns (e.g., "AWS" → software)
2. Analyze line items and descriptions (e.g., "cloud storage" → software)
3. Use email subject/body context (e.g., "Your Uber receipt" → travel)
4. Default to "other" if uncertain (confidence < 0.7)

### 11.4 Calendar Deep Link Format

Google Calendar supports pre-filled event creation via URL parameters:

**Format:**
```
https://calendar.google.com/calendar/r/eventedit?
  text={meeting_title}
  &dates={start_time}/{end_time}
  &details={description}
  &add={attendee_emails}
  &location={meeting_location}
```

**Parameters:**
- `text`: Meeting title (URL-encoded)
- `dates`: Start/end time in format `YYYYMMDDTHHmmssZ` (UTC)
  - Example: `20260120T140000Z/20260120T150000Z` (Jan 20, 2026, 2-3pm UTC)
- `details`: Meeting description/agenda (URL-encoded)
- `add`: Comma-separated attendee emails
- `location`: Physical location or video call link

**Example:**
```
https://calendar.google.com/calendar/r/eventedit?
  text=Q4%20Strategy%20Review
  &dates=20260120T140000Z/20260120T150000Z
  &details=Discuss%20Q4%20roadmap%20and%20priorities
  &add=john@company.com,sarah@company.com
  &location=Conference%20Room%20A
```

**Implementation Notes:**
- Times must be converted to UTC before generating link
- Handle timezone parsing from email content (e.g., "2pm PST" → UTC conversion)
- If multiple times suggested, create link for first option, show alternatives in UI
- Duration defaults to 60 minutes if not specified

### 11.5 Feedback Data Schema

User feedback structure for tracking extraction accuracy:

**TypeScript Interface:**
```typescript
interface ItemFeedback {
  itemId: string;
  userId: string;
  feedbackType: 'positive' | 'negative';
  feedbackComment?: string; // Optional user explanation
  feedbackCategory?: 'wrong_category' | 'wrong_amount' | 'wrong_vendor' | 'wrong_date' | 'not_actionable' | 'other';
  correctedCategory?: string; // If user provides correction
  timestamp: Date;
  itemType: 'task' | 'receipt' | 'meeting'; // Type of item being reviewed
}
```

**Example Feedback Scenarios:**

1. **Positive Feedback (Receipt):**
```json
{
  "itemId": "uuid-123",
  "feedbackType": "positive",
  "itemType": "receipt",
  "timestamp": "2026-01-17T10:00:00Z"
}
```

2. **Negative Feedback (Wrong Category):**
```json
{
  "itemId": "uuid-456",
  "feedbackType": "negative",
  "feedbackComment": "This is office supplies, not software",
  "feedbackCategory": "wrong_category",
  "correctedCategory": "office",
  "itemType": "receipt",
  "timestamp": "2026-01-17T10:05:00Z"
}
```

3. **Negative Feedback (Not Actionable):**
```json
{
  "itemId": "uuid-789",
  "feedbackType": "negative",
  "feedbackComment": "This is just a newsletter, not a task",
  "feedbackCategory": "not_actionable",
  "itemType": "task",
  "timestamp": "2026-01-17T10:10:00Z"
}
```

**Usage:**
- Store in `items` table as `user_feedback` and `feedback_comment` fields
- Aggregate for analytics: `SELECT category, COUNT(*) FROM items WHERE user_feedback = 'negative' GROUP BY category`
- Use for future AI training/prompt improvement
- Display feedback rate in admin dashboard

### 11.6 Glossary

- **PWA**: Progressive Web App - installable web app
- **RLS**: Row Level Security - Supabase/Postgres feature for data isolation
- **Deep Link**: URL that opens a specific screen in another app
- **OAuth**: Authorization protocol for third-party access
- **Extraction**: AI process of identifying actionable items from email

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Product Team | Initial MVP PRD (Notion-based) |
| 2.0 | 2026-01-17 | Product Team | Simplified B2C: Removed Notion, added Supabase, in-app actions, immediate extraction |
| 2.1 | 2026-01-17 | Product Team | Added: Receipt extraction with V1 categories, Calendar meeting scheduling, Feedback system (thumbs up/down), Extended timeline to 10 weeks, Updated budget to $84,410 |

---

**Document Status:** ✅ Ready for Review
**Next Steps:** Design review, technical feasibility check, sprint planning
