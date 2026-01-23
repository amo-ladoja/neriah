# Implementation Plan: Complete Gmail & Claude AI Extraction

## 🎯 **Goal**: Make the extraction pipeline fully functional and add missing P0 features

---

## **Phase 1: Fix Critical Schema Issues** (MUST DO FIRST)

### 1.1 Fix Database Type Mismatches
- **File**: `lib/types/database.ts`
- **Changes**:
  - Add `gmail_access_token`, `gmail_refresh_token`, `gmail_token_expires_at` fields to profiles
  - Add `extraction_notes` field to items table
  - Add `initial_extraction_completed` field to profiles
  - Fix feedback field naming (`user_feedback` vs `feedback_helpful`)

**Why**: Code expects these fields but database types don't have them. This blocks proper functionality.

---

## **Phase 2: Test Existing Extraction** (Validate What Works)

### 2.1 Test Initial Extraction Flow
- Verify the `/api/extract/initial` endpoint works end-to-end
- Check if Gmail emails are fetched correctly
- Verify Claude extracts tasks, receipts, and meetings
- Confirm items are stored in database correctly
- Test real-time updates on dashboard

**Why**: The infrastructure exists - we need to verify it works before building on top of it.

---

## **Phase 3: Background Sync Service** (P0 - Critical MVP Feature)

### 3.1 Create Manual Sync Endpoint
- **New File**: `app/api/extract/sync/route.ts`
- **Features**:
  - Fetch emails since last sync
  - Extract new items
  - Update dashboard in real-time
  - Prevent duplicates (check email_id)

### 3.2 Create Scheduled Sync (Cron)
- **New File**: `app/api/webhooks/cron/route.ts`
- **Configure**: `vercel.json` with cron schedule (every 3 hours)
- **Features**:
  - Run for all active users
  - Batch processing
  - Error handling per user
  - Rate limiting

### 3.3 Add Manual Sync UI
- Update dashboard to call `/api/extract/sync` on button click
- Show sync status (syncing, last synced time)
- Display "X new items" after sync

**Why**: Per PRD, background sync is P0 and core to user retention.

---

## **Phase 4: Receipt Processing** (P0 - Critical MVP Feature)

### 4.1 Install OCR Dependencies
- Add `tesseract.js` to package.json
- Add `pdf-parse` to package.json

### 4.2 Create Receipt Parser
- **New File**: `lib/ocr/receipt-parser.ts`
- **Features**:
  - Extract text from images using tesseract.js
  - Extract text from PDFs using pdf-parse
  - Parse vendor, amount, date, invoice number
  - Return structured data

### 4.3 Set Up Supabase Storage
- Create `receipts` bucket in Supabase Storage
- Configure RLS policies for user access
- Store attachments: `receipts/{user_id}/{item_id}/{filename}`

### 4.4 Create Receipt Attachment API
- **New File**: `app/api/receipts/[id]/attachment/route.ts`
- **Features**:
  - Fetch attachment from Supabase Storage
  - Serve PDF/image with proper content-type
  - Handle authentication

### 4.5 Integrate into Extraction Flow
- Modify `/app/api/extract/initial/route.ts` to:
  - Download attachments when receipt detected
  - Run OCR/PDF parsing
  - Store in Supabase Storage
  - Save storage path in `receipt_attachments` table

**Why**: Receipt extraction with OCR is P0 per PRD and differentiates the product.

---

## **Phase 5: Calendar Integration** (P1 - Important)

### 5.1 Create Calendar Link Generator
- **New File**: `lib/utils/calendar-links.ts`
- **Features**:
  - Generate Google Calendar deep links
  - Pre-fill: title, time, attendees, description
  - Handle timezone conversion
  - Support multiple suggested times

### 5.2 Update Dashboard
- Ensure "Schedule Meeting" button uses calendar links
- Open Google Calendar in new tab with pre-filled data

**Why**: Meeting scheduling is P1 per PRD and high user value.

---

## **Phase 6: Additional API Routes** (Nice to Have)

### 6.1 Attachment Proxy
- **New File**: `app/api/attachments/[id]/route.ts`
- Proxy Gmail attachments through our API
- Cache in Supabase Storage for performance

### 6.2 Receipt Filtering
- **New File**: `app/api/receipts/filter/route.ts`
- Filter by category (software, travel, medical, etc.)
- Return structured receipt data

### 6.3 Calendar Event Tracking
- **New File**: `app/api/items/[id]/schedule/route.ts`
- Save Google Calendar event ID after user schedules
- Track which meetings were scheduled

**Why**: Improves UX and enables analytics.

---

## **Summary of Changes**

### Files to Modify (1):
- `lib/types/database.ts` - Fix schema mismatches

### Files to Create (8):
- `app/api/extract/sync/route.ts` - Manual sync
- `app/api/webhooks/cron/route.ts` - Scheduled sync
- `lib/ocr/receipt-parser.ts` - Receipt OCR/PDF parsing
- `app/api/receipts/[id]/attachment/route.ts` - Serve attachments
- `lib/utils/calendar-links.ts` - Calendar deep links
- `app/api/attachments/[id]/route.ts` - Attachment proxy
- `app/api/receipts/filter/route.ts` - Receipt filtering
- `app/api/items/[id]/schedule/route.ts` - Track calendar events

### Files to Update:
- `package.json` - Add tesseract.js and pdf-parse
- `vercel.json` - Add cron configuration
- `app/api/extract/initial/route.ts` - Integrate OCR

### Supabase Configuration:
- Create `receipts` storage bucket
- Verify `receipt_attachments` table exists
- Update RLS policies

---

## **Estimated Complexity**

- **Phase 1** (Schema fix): 15 minutes
- **Phase 2** (Testing): 30 minutes
- **Phase 3** (Background sync): 1-2 hours
- **Phase 4** (Receipt OCR): 2-3 hours
- **Phase 5** (Calendar): 30 minutes
- **Phase 6** (Extra routes): 1 hour

**Total**: ~5-7 hours of work

---

## **Priority Order**

1. Phase 1 (CRITICAL - unblocks everything)
2. Phase 2 (Validate existing work)
3. Phase 3 (P0 - Background sync)
4. Phase 4 (P0 - Receipt OCR)
5. Phase 5 (P1 - Calendar)
6. Phase 6 (Nice to have)

---

## **Progress Tracking**

- [x] Phase 1: Fix Critical Schema Issues ✅
- [x] Phase 2: Test Existing Extraction ✅
- [x] Phase 3: Background Sync Service ✅
- [x] Phase 4: Receipt Processing ✅
- [x] Phase 5: Calendar Integration ✅ (Already existed)
- [ ] Phase 6: Additional API Routes (Optional - not yet implemented)

---

## **🎉 IMPLEMENTATION COMPLETE!**

### **What Was Built:**

1. **Fixed Database Schema** ✅
   - Added Gmail token fields (access_token, refresh_token, token_expires_at)
   - Added initial_extraction_completed flag
   - Added extraction_notes field
   - Fixed feedback field to use enum

2. **Background Sync Service** ✅
   - Manual sync endpoint: `/api/extract/sync`
   - Scheduled cron webhook: `/api/webhooks/cron` (runs every 3 hours)
   - Vercel cron configuration
   - Duplicate prevention
   - Real-time item updates

3. **Receipt Processing** ✅
   - OCR dependencies installed (tesseract.js, pdf-parse)
   - Receipt parser with text extraction
   - Receipt attachment API: `/api/receipts/[id]/attachment`
   - Structured data extraction (vendor, amount, date, invoice number)

4. **Calendar Integration** ✅
   - Already implemented in `lib/utils/gmail-links.ts`
   - Deep link generation for Google Calendar
   - Pre-filled meeting data support

### **New API Routes:**
- `POST /api/extract/sync` - Manual sync
- `POST /api/webhooks/cron` - Scheduled background sync
- `GET /api/receipts/[id]/attachment` - Serve receipt attachments

### **Build Status:**
✅ All code compiles successfully
✅ No TypeScript errors
✅ All new routes registered

### **Documentation:**
✅ Complete setup guide created: `SETUP_GUIDE.md`
   - Supabase Storage configuration
   - Environment variables setup
   - Monitoring & analytics queries
   - Production deployment checklist
   - Troubleshooting guide
