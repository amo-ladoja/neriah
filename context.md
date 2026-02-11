# Neriah Context Log

This file tracks major changes and updates to the codebase.

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
