import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

/**
 * Gmail API Client
 * Handles all interactions with Gmail API including:
 * - Token refresh
 * - Email fetching
 * - Attachment downloads
 */

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  body: {
    attachmentId?: string;
    size: number;
    data?: string;
  };
  parts?: GmailMessagePart[]; // Recursive for nested parts
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: GmailMessagePart[];
    body: {
      size: number;
      data?: string;
    };
  };
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded
}

/**
 * Create Gmail API client with user's OAuth tokens
 */
export async function createGmailClient(userId: string) {
  const supabase = await createClient();

  // Get user's Gmail tokens from profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("gmail_access_token, gmail_refresh_token, gmail_token_expires_at")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Failed to get user profile");
  }

  if (!profile.gmail_access_token || !profile.gmail_refresh_token) {
    throw new Error("Gmail tokens not found. User needs to re-authenticate.");
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: profile.gmail_access_token,
    refresh_token: profile.gmail_refresh_token,
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    console.log("[Gmail Client] Token refreshed");
    if (tokens.access_token) {
      // Update access token in database
      await supabase
        .from("profiles")
        .update({
          gmail_access_token: tokens.access_token,
          gmail_token_expires_at: new Date(
            Date.now() + 3600 * 1000
          ).toISOString(),
        })
        .eq("id", userId);
    }
  });

  // Create Gmail client
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  return { gmail, oauth2Client };
}

/**
 * Fetch emails from Gmail with optional filters
 */
export async function fetchEmails(
  userId: string,
  options: {
    maxResults?: number;
    query?: string;
    after?: Date; // Fetch emails after this date
  } = {}
): Promise<GmailMessage[]> {
  const { gmail } = await createGmailClient(userId);

  const { maxResults = 50, query = "", after } = options;

  // Build query
  let searchQuery = query;
  if (after) {
    const afterTimestamp = Math.floor(after.getTime() / 1000);
    searchQuery += ` after:${afterTimestamp}`;
  }

  console.log("[Gmail Client] Fetching emails with query:", searchQuery);

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: searchQuery.trim() || undefined,
  });

  const messages = listResponse.data.messages || [];
  console.log(`[Gmail Client] Found ${messages.length} messages`);

  if (messages.length === 0) {
    return [];
  }

  // Fetch full message details for each message
  const fullMessages = await Promise.all(
    messages.map(async (message) => {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full", // Get full message including body
      });
      return fullMessage.data as GmailMessage;
    })
  );

  return fullMessages;
}

/**
 * Fetch emails from last N days (default 7)
 */
export async function fetchRecentEmails(
  userId: string,
  days: number = 7
): Promise<GmailMessage[]> {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - days);

  console.log(`[Gmail Client] Fetching emails from last ${days} days`);

  return fetchEmails(userId, {
    maxResults: 50,
    query: "category:primary",
    after: afterDate,
  });
}

/**
 * Download email attachment
 */
export async function downloadAttachment(
  userId: string,
  messageId: string,
  attachmentId: string
): Promise<EmailAttachment> {
  const { gmail } = await createGmailClient(userId);

  console.log(
    `[Gmail Client] Downloading attachment ${attachmentId} from message ${messageId}`
  );

  const attachment = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  // Get message to find attachment filename
  const message = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const gmailMessage = message.data as GmailMessage;
  const parts = gmailMessage.payload.parts || [];

  // Find the part with this attachment
  const attachmentPart = parts.find(
    (part) => part.body.attachmentId === attachmentId
  );

  return {
    filename: attachmentPart?.filename || "attachment",
    mimeType: attachmentPart?.mimeType || "application/octet-stream",
    size: attachment.data.size || 0,
    data: attachment.data.data || "",
  };
}

/**
 * Extract email headers
 */
export function getEmailHeader(
  message: GmailMessage,
  headerName: string
): string | undefined {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === headerName.toLowerCase()
  );
  return header?.value;
}

/**
 * Extract email body (plain text or HTML)
 */
export function getEmailBody(message: GmailMessage): {
  text?: string;
  html?: string;
} {
  const { payload } = message;

  // Helper to decode base64
  const decodeBase64 = (data?: string): string => {
    if (!data) return "";
    // Gmail uses URL-safe base64
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  };

  // Check if message has parts (multipart)
  if (payload.parts && payload.parts.length > 0) {
    let textBody = "";
    let htmlBody = "";

    // Recursive function to find text/html parts
    const findParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body.data) {
          textBody = decodeBase64(part.body.data);
        } else if (part.mimeType === "text/html" && part.body.data) {
          htmlBody = decodeBase64(part.body.data);
        } else if (part.parts) {
          // Recursive for nested parts
          findParts(part.parts);
        }
      }
    };

    findParts(payload.parts);

    return {
      text: textBody || undefined,
      html: htmlBody || undefined,
    };
  }

  // Single part message
  if (payload.body.data) {
    const body = decodeBase64(payload.body.data);
    return {
      text: body,
    };
  }

  return {};
}

/**
 * Get list of attachments from email
 */
export function getEmailAttachments(message: GmailMessage): Array<{
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
  attachmentId?: string;
}> {
  const { payload } = message;
  const attachments: Array<{
    partId: string;
    filename: string;
    mimeType: string;
    size: number;
    attachmentId?: string;
  }> = [];

  if (!payload.parts) return attachments;

  // Find parts with attachments
  for (const part of payload.parts) {
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        partId: part.partId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId,
      });
    }

    // Check nested parts
    if (part.parts) {
      for (const subPart of part.parts) {
        if (subPart.filename && subPart.filename.length > 0) {
          attachments.push({
            partId: subPart.partId,
            filename: subPart.filename,
            mimeType: subPart.mimeType,
            size: subPart.body.size,
            attachmentId: subPart.body.attachmentId,
          });
        }
      }
    }
  }

  return attachments;
}

/**
 * Check if email has PDF or image attachments (for receipts)
 */
export function hasReceiptAttachments(message: GmailMessage): boolean {
  const attachments = getEmailAttachments(message);
  return attachments.some(
    (att) =>
      att.mimeType === "application/pdf" ||
      att.mimeType.startsWith("image/")
  );
}

/**
 * Parse email into structured format for extraction
 */
export function parseEmailForExtraction(message: GmailMessage) {
  const from = getEmailHeader(message, "from") || "";
  const to = getEmailHeader(message, "to") || "";
  const subject = getEmailHeader(message, "subject") || "";
  const date = getEmailHeader(message, "date") || "";
  const body = getEmailBody(message);
  const attachments = getEmailAttachments(message);

  return {
    messageId: message.id,
    threadId: message.threadId,
    from,
    to,
    subject,
    date,
    snippet: message.snippet,
    body: body.text || body.html || message.snippet,
    hasAttachments: attachments.length > 0,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      mimeType: att.mimeType,
      size: att.size,
      attachmentId: att.attachmentId,
    })),
    internalDate: new Date(parseInt(message.internalDate)),
  };
}
