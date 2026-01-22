# Neriah Architecture

**Version:** 1.0
**Last Updated:** January 19, 2026
**Purpose:** System architecture and data flow for Neriah MVP

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow Scenarios](#data-flow-scenarios)
5. [Technology Stack](#technology-stack)
6. [Database Design](#database-design)
7. [Security & Privacy](#security--privacy)
8. [Scaling Scenarios](#scaling-scenarios)

---

## System Overview

Neriah is a **mobile-first web application (PWA)** that extracts actionable items from Gmail using AI and presents them in a clean dashboard with one-tap actions.

### Key Characteristics
- **Architecture Style**: Serverless, event-driven
- **Client**: Next.js (React) PWA hosted on Vercel
- **Backend**: Supabase (Auth + Database + Storage) + Cloud Run (AI extraction)
- **Data Flow**: User → Next.js → Supabase ↔ Cloud Run → Gmail API → Claude AI

### 30-Second Flow
1. User signs in with Google OAuth (Gmail access granted)
2. Extraction service fetches last 7 days of emails from Gmail
3. Claude AI extracts tasks, receipts, and meetings
4. Results stored in Supabase PostgreSQL
5. Dashboard shows actionable items with one-tap actions
6. Background sync runs every 3 hours

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser/Mobile)                    │
│                              PWA App                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION (Vercel)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  App Router  │  │  API Routes  │  │  Server Actions      │  │
│  │  (Pages)     │  │  (/api/*)    │  │  (Form handlers)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          │        ┌────────┴────────┬─────────┘
          │        │                 │
          ▼        ▼                 ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────┐
│     SUPABASE         │  │  EXTRACTION SERVICE  │  │  GMAIL API  │
│                      │  │   (Cloud Run)        │  │             │
│  ┌────────────────┐  │  │                      │  │  - Fetch    │
│  │ Auth (OAuth)   │  │  │  ┌────────────────┐  │  │    emails   │
│  │ - Google SSO   │  │  │  │  Claude AI     │  │  │  - Get      │
│  │ - Tokens       │  │  │  │  Extraction    │  │  │    attach-  │
│  └────────────────┘  │  │  │                │  │  │    ments    │
│                      │  │  │  - Tasks       │  │  └─────────────┘
│  ┌────────────────┐  │  │  │  - Receipts    │  │
│  │ PostgreSQL     │  │  │  │  - Meetings    │  │  ┌─────────────┐
│  │ - profiles     │  │  │  └────────────────┘  │  │ CALENDAR    │
│  │ - items        │  │  │                      │  │ API         │
│  │ - sync_logs    │  │  │  ┌────────────────┐  │  │             │
│  │ - attachments  │  │  │  │  OCR/PDF Parse │  │  │ - Deep link │
│  └────────────────┘  │  │  │  (tesseract.js)│  │  │   gen       │
│                      │  │  └────────────────┘  │  └─────────────┘
│  ┌────────────────┐  │  └──────────────────────┘
│  │ Storage        │  │
│  │ - Receipt PDFs │  │
│  │ - Images       │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Realtime       │  │
│  │ - WebSocket    │  │
│  │ - Live updates │  │
│  └────────────────┘  │
└──────────────────────┘

┌──────────────────────┐
│   VERCEL CRON        │
│  (Scheduled Jobs)    │
│                      │
│  Every 3 hours:      │
│  → Trigger sync for  │
│     all users        │
└──────────────────────┘
```

---

## Core Components

### 1. Next.js Frontend (Vercel)
**Purpose:** User interface and client-side logic

**Key Responsibilities:**
- Render PWA interface (installable, offline-capable)
- Handle user authentication (Supabase Auth)
- Display dashboard with items
- Manage user actions (reply, complete, snooze)
- Server-side rendering for performance

**Key Files/Routes:**
- `/` - Landing page
- `/dashboard` - Main item list
- `/item/:id` - Item details
- `/receipt/:id` - Receipt viewer
- `/settings` - User settings
- `/api/extract/initial` - Trigger first extraction
- `/api/extract/sync` - Manual sync
- `/api/webhooks/cron` - Background sync endpoint

### 2. Supabase (Backend Platform)

#### 2.1 Auth
- Google OAuth with Gmail scopes
- Token storage (encrypted)
- Session management (30-day refresh)

#### 2.2 PostgreSQL Database
**Tables:**
- `profiles` - User data + Gmail tokens
- `items` - Extracted tasks/receipts/meetings
- `sync_logs` - Sync history
- `receipt_attachments` - Receipt file metadata

**Security:** Row Level Security (RLS) ensures users only access their data

#### 2.3 Storage
- Receipt PDFs and images
- 7-day retention (automatic cleanup)
- Organized by user: `receipts/{user_id}/{item_id}/{filename}`

#### 2.4 Realtime
- WebSocket subscriptions for live updates
- Push new items to dashboard without refresh

### 3. Extraction Service (Cloud Run)
**Purpose:** AI-powered email analysis

**Input:**
```json
{
  "userId": "uuid",
  "accessToken": "gmail_token",
  "since": "2026-01-12T00:00:00Z",
  "limit": 50
}
```

**Process:**
1. Fetch emails from Gmail API
2. For each email:
   - Extract text content
   - Check for attachments (PDFs/images)
   - Send to Claude AI with extraction prompt
3. Parse AI response
4. Extract receipt data using OCR/PDF parsing
5. Return structured items

**Output:**
```json
{
  "items": [
    {
      "emailId": "msg_123",
      "title": "Reply to John about Q4 report",
      "category": "reply",
      "priority": "normal",
      "confidence": 0.92,
      "senderName": "John Doe",
      "senderEmail": "john@company.com",
      ...
    }
  ],
  "stats": {
    "emailsProcessed": 50,
    "itemsExtracted": 12,
    "duration": 45
  }
}
```

**Technology:**
- Container: Docker on Cloud Run (auto-scaling)
- AI: Claude 3.5 Sonnet (Anthropic API)
- OCR: tesseract.js (receipt images)
- PDF: pdf-parse (receipt PDFs)

### 4. External APIs

#### Gmail API
- **Scopes:** `gmail.readonly`, `gmail.metadata`
- **Endpoints Used:**
  - `GET /users/me/messages` - List emails
  - `GET /users/me/messages/{id}` - Get email content
  - `GET /users/me/messages/{id}/attachments/{id}` - Download attachments

#### Google Calendar API
- **Purpose:** Generate deep links for meeting scheduling
- **Format:** `https://calendar.google.com/calendar/r/eventedit?text=...&dates=...`

#### Anthropic Claude API
- **Model:** Claude 3.5 Sonnet
- **Usage:** Extract structured data from emails
- **Cost:** ~$0.50 per 1,000 emails processed

---

## Data Flow Scenarios

### Scenario 1: First-Time User Signup & Extraction

```
[User] Click "Sign in with Google"
   ↓
[Next.js] Redirect to Supabase Auth
   ↓
[Supabase Auth] Google OAuth flow (includes Gmail scope)
   ↓
[Next.js] Receive auth session + Gmail token
   ↓
[Next.js] POST /api/extract/initial { userId, accessToken }
   ↓
[Extraction Service] Fetch last 7 days of emails from Gmail
   ↓
[Gmail API] Return 50 emails
   ↓
[Extraction Service] Send emails to Claude AI (batched)
   ↓
[Claude AI] Return extracted items (tasks, receipts, meetings)
   ↓
[Extraction Service] Process attachments (OCR/PDF parsing for receipts)
   ↓
[Extraction Service] Save items to Supabase DB
   ↓
[Supabase Realtime] Push new items to client
   ↓
[Next.js Dashboard] Display items (< 60 seconds total)
   ↓
[User] Sees actionable items
```

**Timeline:** 45-60 seconds (parallel processing)

### Scenario 2: User Replies to Email

```
[User] Click "Reply" on task item
   ↓
[Next.js] Generate Gmail compose deep link
   Format: https://mail.google.com/mail/?view=cm&to={email}&su=Re:{subject}
   ↓
[Browser] Open Gmail in new tab with pre-filled compose
   ↓
[User] Sends email in Gmail
   ↓
[User] Returns to Neriah
   ↓
[User] Clicks "Mark Complete"
   ↓
[Next.js] Update item status in Supabase
   UPDATE items SET status = 'completed', completed_at = NOW()
   ↓
[Dashboard] Item moves to "Completed" section
```

**Timeline:** Instant (no backend processing)

### Scenario 3: View Receipt with PDF

```
[User] Click "View Receipt" on receipt item
   ↓
[Next.js] Navigate to /receipt/:id
   ↓
[Next.js] Fetch item from Supabase
   SELECT * FROM items WHERE id = :id
   ↓
[Next.js] Display structured data:
   - Vendor: "AWS"
   - Amount: $250.00
   - Category: "Software"
   - Date: Jan 15, 2026
   ↓
[Next.js] Fetch PDF from Supabase Storage
   GET /storage/v1/object/receipts/{user_id}/{item_id}/invoice.pdf
   ↓
[Browser] Render PDF in-app viewer
   ↓
[User] Reviews receipt, clicks thumbs up
   ↓
[Next.js] Update feedback
   UPDATE items SET user_feedback = 'positive', feedback_at = NOW()
```

**Timeline:** < 2 seconds

### Scenario 4: Background Sync (Every 3 Hours)

```
[Vercel Cron] Trigger at 12:00, 15:00, 18:00, etc.
   ↓
[Next.js] POST /api/webhooks/cron (authenticated with secret)
   ↓
[Next.js] Fetch all users with sync_enabled = true
   SELECT id, gmail_token FROM profiles WHERE sync_enabled = true
   ↓
[Next.js] For each user (parallel):
   ├─ POST /extraction-service { userId, since: last_sync_at }
   ├─ [Extraction Service] Fetch new emails since last sync
   ├─ [Extraction Service] Extract new items
   ├─ [Extraction Service] Save to Supabase
   └─ [Supabase Realtime] Push to client (if online)
   ↓
[Next.js] Send push notification
   "3 new items need your attention"
   ↓
[User] Opens app, sees new items at top of list
```

**Timeline:** 1-2 minutes per user (parallelized)

### Scenario 5: Schedule Meeting from Email

```
[User] Click "Schedule Meeting" on meeting item
   ↓
[Next.js] Read meeting_details from DB
   {
     "suggestedTimes": ["2026-01-20T14:00:00Z"],
     "attendees": ["john@company.com", "sarah@company.com"],
     "duration": 60,
     "location": "Conference Room A"
   }
   ↓
[Next.js] Generate Google Calendar deep link
   https://calendar.google.com/calendar/r/eventedit?
     text=Q4%20Strategy%20Review
     &dates=20260120T140000Z/20260120T150000Z
     &add=john@company.com,sarah@company.com
     &location=Conference%20Room%20A
   ↓
[Browser] Open Google Calendar with pre-filled event
   ↓
[User] Confirms and creates event in Calendar
   ↓
[User] Returns to Neriah, marks item complete
```

**Timeline:** Instant (deep link generation)

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework, SSR, PWA |
| **Styling** | Tailwind CSS + shadcn/ui | UI components, responsive design |
| **Auth** | Supabase Auth | Google OAuth with Gmail scopes |
| **Database** | Supabase (PostgreSQL) | User data, items, sync logs |
| **Realtime** | Supabase Realtime | WebSocket for live updates |
| **Storage** | Supabase Storage | Receipt PDFs and images |
| **Extraction** | Google Cloud Run | Serverless container for AI |
| **AI** | Claude 3.5 Sonnet | Task/receipt/meeting extraction |
| **OCR** | tesseract.js | Receipt image text extraction |
| **PDF Parser** | pdf-parse | Receipt PDF text extraction |
| **Email API** | Gmail API | Fetch emails and attachments |
| **Calendar** | Google Calendar API | Deep link generation |
| **Cron Jobs** | Vercel Cron | 3-hour background sync |
| **Hosting** | Vercel (Edge) | Frontend + API routes |

---

## Database Design

### Key Tables

#### `profiles`
```sql
profiles (
  id UUID PRIMARY KEY,              -- Matches Supabase auth.users
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  gmail_token JSONB,                -- Encrypted OAuth tokens
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### `items` (Core table)
```sql
items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  email_id TEXT UNIQUE,             -- Gmail message ID (deduplication)

  -- Extracted data
  title TEXT,                        -- "Reply to John about Q4 report"
  description TEXT,
  category TEXT,                     -- 'reply', 'invoice', 'meeting', etc.
  priority TEXT,                     -- 'urgent', 'normal', 'low'
  confidence REAL,                   -- AI confidence 0-1

  -- Receipt-specific (JSONB for flexibility)
  receipt_details JSONB,             -- {vendor, amount, currency, ...}
  receipt_category TEXT,             -- 'software', 'travel', 'medical', etc.

  -- Meeting-specific
  meeting_details JSONB,             -- {attendees, suggestedTimes, duration}
  calendar_event_id TEXT,

  -- Email metadata
  sender_name TEXT,
  sender_email TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  email_date TIMESTAMPTZ,
  has_attachment BOOLEAN,
  attachment_ids TEXT[],

  -- Feedback
  user_feedback TEXT,                -- 'positive', 'negative', null
  feedback_comment TEXT,
  feedback_at TIMESTAMPTZ,

  -- State
  status TEXT DEFAULT 'active',      -- 'active', 'completed', 'snoozed'
  snoozed_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Indexes:**
- `idx_items_user_status` - Fast filtering by user + status
- `idx_items_user_created` - Dashboard ordering
- `idx_items_receipt_category` - Receipt filtering

**Security:** Row Level Security (RLS) policies ensure `user_id = auth.uid()`

---

## Security & Privacy

### Authentication
- Google OAuth via Supabase (industry-standard)
- Gmail scopes: `gmail.readonly`, `gmail.metadata` (read-only)
- Tokens encrypted at rest in Supabase vault
- Session: 30-day refresh tokens

### Data Privacy
- **Email content NOT stored** - only extracted metadata
- Attachments cached in Supabase Storage for 7 days, then deleted
- User can export or delete all data anytime
- GDPR/CCPA compliant

### API Security
- Row Level Security (RLS) - users can only access their data
- API routes protected by Supabase session
- Cron webhook secured with secret token
- Rate limiting via Vercel + Supabase

### HTTPS/TLS
- All connections use HTTPS/TLS 1.3
- Vercel Edge handles SSL termination

---

## Scaling Scenarios

### Scenario 1: Growth to 10,000 Users (Year 1 Target)

**Current Architecture:**
- Supabase Free/Pro tier: Up to 10GB database
- Vercel Hobby/Pro: Unlimited requests
- Cloud Run: Auto-scales 0-1000 instances

**Changes Needed:**
- ✅ **No changes required** - current architecture handles this
- Supabase Pro: ~$25/month (up to 8GB database, 50GB bandwidth)
- Cloud Run: ~$200/month (estimated at 10k users × 4 syncs/day)
- Anthropic API: ~$1,500/month (10k users × 100 emails/month)

**Cost:** ~$1,725/month = **$0.17/user/month**

**Performance:**
- Database: PostgreSQL handles 10k users easily with proper indexes
- Extraction: Parallel processing (100 users/minute)
- API: Vercel Edge is globally distributed

---

### Scenario 2: Heavy Email Users (500 emails/day per user)

**Challenge:**
- Gmail API quota: 250 quota units/user/second (1 email = 5 units = 50 emails/sec)
- Heavy users could hit rate limits during sync

**Solution:**
```
┌─────────────────────┐
│   Rate Limiter      │
│   (Redis Queue)     │
│                     │
│  - Queue users      │
│  - Process 1/sec    │
│  - Retry on 429     │
└─────────────────────┘
```

**Implementation:**
- Add Redis (Upstash) for queue management
- Batch users: Process 1 user/second to respect quotas
- Incremental sync: Fetch only new emails (since `last_sync_at`)

**Cost:** +$10/month (Upstash Redis)

---

### Scenario 3: Real-Time Sync (< 5 minute delays)

**Challenge:**
- Current: 3-hour sync intervals
- Users want near-instant updates

**Solution 1: Gmail Push Notifications (Pub/Sub)**
```
[Gmail] → [Google Cloud Pub/Sub] → [Cloud Function] → [Extraction Service]
```

**How it works:**
1. Subscribe to Gmail push notifications (watch API)
2. Gmail sends event to Pub/Sub when new email arrives
3. Cloud Function triggers extraction for that user
4. New items appear in < 1 minute

**Cost:** ~$50/month (Cloud Pub/Sub + Functions)

**Solution 2: Webhook-based (if scaling further)**
- Dedicated extraction workers (Cloud Run always-on instances)
- Queue system (Redis/BullMQ)
- Process users in batches every 5 minutes

---

### Scenario 4: Multi-Account Support (100k+ users)

**Challenge:**
- Gmail API quotas are per-project (1 billion quota units/day)
- 100k users × 4 syncs/day × 50 emails × 5 units = 100M units/day ✅ Within quota
- But spikes could cause issues

**Solution: Sharding by User Cohorts**
```
┌──────────────────┐
│  Load Balancer   │
└────────┬─────────┘
         │
    ┌────┴────┬────────┐
    ▼         ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Shard A│ │ Shard B│ │ Shard C│
│ Users  │ │ Users  │ │ Users  │
│ 1-33k  │ │34-66k  │ │67-100k │
└────────┘ └────────┘ └────────┘
```

**Implementation:**
- Create 3 Google Cloud projects (separate API quotas)
- Route users to shards based on `user_id % 3`
- Each shard: 1 billion quota units/day

**Cost:** No additional infrastructure cost (just API project setup)

---

### Scenario 5: Global Expansion (Low-Latency Worldwide)

**Challenge:**
- Current: Vercel Edge (global), Supabase US-East, Cloud Run US-Central
- Users in Asia/Europe experience latency

**Solution: Multi-Region Deployment**
```
┌─────────────────────────────────────┐
│  Vercel Edge (Global CDN)           │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬──────────────┐
    ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│Supabase │  │Supabase │  │Supabase │
│ US-East │  │ EU-West │  │ AP-SE   │
└─────────┘  └─────────┘  └─────────┘
```

**Implementation:**
- Supabase Pro: Enable read replicas in EU/Asia
- Cloud Run: Deploy to multiple regions (us-central1, europe-west1, asia-southeast1)
- Route users to nearest region based on geolocation

**Cost:** +$100/month (regional replicas)

**Performance Improvement:**
- US users: 50ms → 50ms (no change)
- EU users: 150ms → 30ms (5x faster)
- Asia users: 250ms → 50ms (5x faster)

---

## Summary

### Current MVP Architecture (500-10k users)
- **Frontend:** Next.js PWA on Vercel Edge
- **Backend:** Supabase (Auth + DB + Storage + Realtime)
- **Extraction:** Cloud Run serverless containers
- **AI:** Claude 3.5 Sonnet (Anthropic)
- **Cost:** ~$0.17-0.60/user/month
- **Performance:** < 60s initial extraction, < 2s dashboard load

### Scaling Path
1. **10k users:** No changes (current architecture scales)
2. **Heavy users:** Add Redis queue for rate limiting
3. **Real-time:** Gmail push notifications (Pub/Sub)
4. **100k users:** Shard across multiple Google Cloud projects
5. **Global:** Multi-region Supabase + Cloud Run

### Key Design Decisions
- **Serverless:** Auto-scales, pay-per-use
- **Supabase:** Managed backend (less ops overhead)
- **No email storage:** Privacy-first, GDPR compliant
- **Event-driven:** Realtime updates via WebSocket

---

**Questions?** Reach out to the engineering team for clarification on any component.
