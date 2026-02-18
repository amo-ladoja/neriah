# Neriah Context Log

This file tracks major changes and updates to the codebase.

---

## 2026-02-18 15:30 EST | Alpha Landing Page - Final Polish

### Context
Removed the yellow gradient from the bottom CTA section in `app/alpha/page.tsx` as it had a sharp visible edge that didn't match the design.

### Status
✅ Complete

---

## 2026-02-18 15:00 EST | Alpha Landing Page - Dithered Background

### Context
Added dithered dot pattern background to `app/alpha/page.tsx`:

**Dithered Dot Pattern:**
- CSS radial-gradient creating repeating dot grid across the page
- 16px spacing, 0.15 opacity, 1px dots
- Positioned as absolute overlay with pointer-events-none

**Carousel Section Fix:**
- Added solid `bg-[#131313]` background to carousel section
- Prevents dithered dots from showing through carousel content

### Status
✅ Complete

---

## 2026-02-18 14:00 EST | Alpha Landing Page - Carousel Implementation

### Context
Implemented auto-sliding carousel in `app/alpha/page.tsx`:

**Carousel Features:**
- 4 slides: Smart Extraction, One-Tap Actions, Receipt Intelligence, Ask your Inbox
- Auto-advances every 4 seconds with smooth horizontal scroll
- Tab headers sync with carousel position (scrolls to show active tab)
- Uses refs for DOM access (`carouselRef`, `tabsRef`, `tabRefs`)

**Fix Applied:**
- Removed duplicated text content - images already contain headings/descriptions
- Simplified to show only the feature images

### Status
✅ Complete

---

## 2026-02-18 13:00 EST | Alpha Landing Page - Style Adjustments

### Context
Multiple UI refinements to `app/alpha/page.tsx` based on Figma design:

**Hamburger Menu:**
- Styled to match search/back button pattern (rounded-full, bg-[#fdfdfd1f], border-[#fdfdfd33])

**Logo Sizes:**
- Header logo: 100x28px
- Footer logo: 125x35px (reduced by 50%, then increased 2.5x)

**3D Elements Positioning:**
- Thumbs up: left-[13px], top-[calc(15%-16px)], 77x77px (mobile) / 96x96px (desktop)
- 3D Neriah logo: right-[8px], bottom-[calc(35%-64px)], 96x96px (mobile) / 100x100px (desktop)
- Multiple iterations to get exact pixel-perfect positioning

**Form Consistency:**
- Both email forms styled identically (rounded-full inputs, yellow CTA buttons)

### Status
✅ Complete

---

## 2026-02-18 12:00 EST | Alpha Landing Page Creation

### Context
Created new alpha landing page at `app/alpha/page.tsx` based on Figma design for early access signups.

**Page Structure:**
- Header: Neriah logo + hamburger menu
- Hero section: Mobile mockup with 3D decorative elements (thumbs up, 3D logo)
- Email signup form with "Join the Alpha" CTA
- Feature carousel with 4 slides
- Bottom CTA section with "Request Early Access" form
- Footer with logo and copyright

**Technical Implementation:**
- Next.js app router page
- React state for email inputs and form submission
- useEffect for carousel auto-advance
- Responsive design (mobile-first with md: breakpoints)
- Tailwind CSS styling matching existing design system

### Status
✅ Complete

---

## 2026-02-17 | Dashboard Card Text Size & Pluralization Fixes

### Context
Made UI refinements to the dashboard cards in `app/(main)/dashboard/page.tsx`:

**Text Size Changes:**
- Receipt card: Vendor name and invoice number reduced from 12px to 10px
- Meeting card: Duration and attendees text changed from 8px to 10px

**Pluralization Fixes:**
- Meeting card: "60 minutes" → "1 minute" / "60 minutes" (singular/plural)
- Meeting card: "1 attendees" → "1 attendee" / "2 attendees" (singular/plural)
- Status bar: "items need attention" → "1 item needs attention" / "10 items need attention"

### Status
✅ Complete

---

## 2026-02-11 | LLM-Powered Chat Implementation (Planned)

### Context
Upgrading chat from rule-based regex parsing to actual LLM (Claude) integration.

**Current State:**
- Chat uses regex/keyword matching in `lib/chat/queryParsing.ts`
- 3 hardcoded endpoints: `/api/chat/query`, `/api/chat/calculate`, `/api/chat/draft`
- Limited understanding, can't handle complex questions
- Draft replies are generic templates (no AI)

**New Architecture: RAG + Tool Calling**
1. Single `/api/chat` endpoint replaces 3 current endpoints
2. Fetch user's items as context (RAG)
3. Claude with 4 tools: `query_items`, `calculate_spending`, `draft_email`, `get_insights`
4. Return structured JSON for UI rendering

**Files to Create:**
- `app/api/chat/route.ts` - Unified LLM endpoint
- `lib/ai/chat-tools.ts` - Tool definitions
- `lib/ai/chat-handlers.ts` - Tool execution logic
- `lib/ai/chat-context.ts` - Context building
- `lib/types/chat.ts` - Type definitions

**Files to Modify:**
- `app/(main)/chat/page.tsx` - Use new endpoint

**Files to Delete (after migration):**
- `app/api/chat/query/route.ts`
- `app/api/chat/calculate/route.ts`
- `app/api/chat/draft/route.ts`

**Decisions:**
- No streaming (wait for complete response)
- No regex fallback (LLM only)

### Status
✅ Complete - Pending verification & cleanup of old endpoints

---

## 2026-02-11 | Resolved Git Merge Conflicts

### Context
Fixed merge conflicts in:
- `us.json` (line 39-43) - Kept detailed notes from origin/main
- `app/(main)/dashboard/page.tsx` (line 699-703) - Used `mb-2` for Bathtub.svg margin

### Status
✅ Complete

---

## 2026-02-11 | MVP Status Review

### Context
Compared PRD v2.1 against us.json. Status:
- **14/15 user stories completed**
- **1 in progress: US-11 (Feedback Improvements)**

**US-11 Missing Criteria:**
- Optional "What was wrong?" comment field
- Toast confirmation ("Thanks for your feedback!")
- Ability to change feedback after submission

### Status
✅ Review complete - US-11 is the only remaining MVP work

---

## 2026-02-08 | Chat History Persistence

### Context
Added Supabase persistence for chat conversations:
- New tables: `chats`, `chat_messages` in `supabase/schema.sql`
- New types: `Chat`, `ChatMessage` in `lib/types/database.ts`
- API routes: `/api/chats/`, `/api/chats/[chatId]/`, `/api/chats/[chatId]/messages/`
- `useChats` hook for fetching previous conversations
- Chat page updated with "Previous Chats" display and "New Chat" button

### Status
✅ Complete

---

## 2026-02-07 16:42 EST | Implement Chat P1 UI + Stub APIs

### Context
Implemented the P1 chat experience and stubbed chat APIs:
- Chat history rendering with user/assistant messages and item cards in `app/(main)/chat/page.tsx`
- Spending total response UI, draft reply UI with Copy/Open Gmail actions
- Item attachment picker (tabs, search, multi-select) and attached item chips
- Send flow wired to stub endpoints: `/api/chat/query`, `/api/chat/calculate`, `/api/chat/draft`
- Suggested prompts hidden once a conversation starts

### Status
✅ Done - Not tested

---

## 2026-02-07 16:53 EST | Wire Chat Endpoints to Supabase + Robust Parsing

### Context
Replaced mock chat responses with real Supabase queries and added robust query parsing:
- `/api/chat/query` now uses Supabase data with keyword matching, category/priority hints, date-range filters, and basic negation filters.
- `/api/chat/calculate` now calculates totals from real receipt data with category/vendor filters, date-range parsing, and negation filters.
- Added shared parsing helpers for date ranges, intent/entity hints, and negations in `lib/chat/queryParsing.ts`.

### Status
✅ Done - Not tested

---

## 2026-02-07 | Add Chat Feature User Stories

### Context
Added 4 new user stories (US-12 to US-15) to us.json for the Chat feature based on neriah_v2.2_chat.md PRD:
- **US-12**: Query Dashboard via Chat - natural language queries against dashboard data
- **US-13**: Get Spending Insights via Chat - spending totals and receipt calculations
- **US-14**: Attach Items to Chat - attach specific items for contextual AI help
- **US-15**: Draft Responses via Chat - AI-assisted email reply drafting

These stories define the acceptance criteria for implementing the chat interface feature.

### Status
✅ Complete - us.json updated with US-12 through US-15

---

## 2026-02-07 | Implement Chat Interface UI (US-12 Phase 1)

### Context
Created the chat page UI at `app/(main)/chat/page.tsx` with:
- Responsive layout matching dashboard patterns (max-w-md lg:max-w-lg xl:max-w-xl)
- Logo positioned at pt-[71px] (same as dashboard and other pages)
- Background gradient effects (same as dashboard)
- Suggested prompt pills - randomly selected from a pool on page load
- Sticky input bar at bottom with dark blur background (rgba(19,19,19,0.2) + backdrop-blur-[20px])
- "+" button for future item attachment feature
- Send button with yellow (#E8F401) styling
- Bottom navigation with chat icon active state

Also updated dashboard to navigate to `/chat` when chat icon is tapped.

### Status
✅ Complete - Chat UI shell implemented, navigation working
