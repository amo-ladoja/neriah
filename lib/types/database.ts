// Database types based on Supabase schema from PRD

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  gmail_access_token: string | null;
  gmail_refresh_token: string | null;
  gmail_token_expires_at: string | null;
  initial_extraction_completed: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemCategory =
  | "reply"
  | "invoice"
  | "follow_up"
  | "deadline"
  | "review"
  | "meeting";

export type ItemPriority = "urgent" | "normal" | "low";

export type ItemStatus = "pending" | "completed" | "snoozed" | "deleted";

export type ReceiptCategory =
  | "software"
  | "travel"
  | "medical"
  | "office"
  | "meals"
  | "utilities"
  | "other";

export type UserFeedback = "positive" | "negative";

export type ReceiptDetails = {
  vendor?: string;
  amount?: number;
  currency?: string;
  invoiceNumber?: string;
  date?: string;
  tax?: number;
  lineItems?: Array<{
    description: string;
    amount: number;
  }>;
  paymentMethod?: string;
};

export type MeetingDetails = {
  attendees: string[];
  suggestedTimes: string[];
  duration: number; // in minutes
  location?: string;
  meetingLink?: string;
  topic?: string;
};

export type Item = {
  id: string;
  user_id: string;
  email_id: string;

  // Extracted data
  title: string;
  description: string | null;
  category: ItemCategory;
  priority: ItemPriority;
  due_date: string | null;
  confidence: number | null;
  extraction_notes: string | null;

  // Receipt-specific
  receipt_details: ReceiptDetails | null;
  receipt_category: ReceiptCategory | null;

  // Meeting-specific
  meeting_details: MeetingDetails | null;
  calendar_event_id: string | null;

  // Email metadata
  sender_name: string | null;
  sender_email: string | null;
  email_subject: string | null;
  email_snippet: string | null;
  email_date: string | null;
  has_attachment: boolean;
  attachment_ids: string[] | null;

  // Feedback
  user_feedback: UserFeedback | null;
  feedback_comment: string | null;
  feedback_at: string | null;

  // State
  status: ItemStatus;
  snoozed_until: string | null;
  completed_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
};

export type SyncLog = {
  id: string;
  user_id: string;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  emails_fetched: number | null;
  emails_processed: number;
  items_created: number;
  items_updated: number;
  status: "running" | "success" | "failed";
  error_message: string | null;
  created_at: string;
};

export type ReceiptAttachment = {
  id: string;
  item_id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

// Helper type for database operations
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Item, "id" | "created_at" | "updated_at">>;
      };
      sync_logs: {
        Row: SyncLog;
        Insert: Omit<SyncLog, "id" | "created_at">;
        Update: Partial<Omit<SyncLog, "id" | "created_at">>;
      };
      receipt_attachments: {
        Row: ReceiptAttachment;
        Insert: Omit<ReceiptAttachment, "id" | "created_at">;
        Update: Partial<Omit<ReceiptAttachment, "id" | "created_at">>;
      };
    };
  };
};
