/**
 * Gmail Deep Link Utilities
 * Generate deep links to open Gmail compose with pre-filled data
 */

/**
 * Generate a Gmail compose deep link
 * Opens Gmail in a new tab/app with pre-filled recipient, subject, and body
 */
export function generateGmailComposeLink(params: {
  to: string;
  subject?: string;
  body?: string;
  messageId?: string; // For threading
}): string {
  const { to, subject, body, messageId } = params;

  // Base Gmail compose URL
  const baseUrl = "https://mail.google.com/mail/?view=cm";

  // Build query parameters
  const queryParams: string[] = [];

  // Recipient
  queryParams.push(`to=${encodeURIComponent(to)}`);

  // Subject (add Re: if replying)
  if (subject) {
    const subjectText = subject.startsWith("Re:")
      ? subject
      : `Re: ${subject}`;
    queryParams.push(`su=${encodeURIComponent(subjectText)}`);
  }

  // Body
  if (body) {
    queryParams.push(`body=${encodeURIComponent(body)}`);
  }

  // Message ID for threading (if replying to a specific message)
  if (messageId) {
    // Gmail uses a specific format for message IDs in URLs
    // We pass it as part of the compose parameters
    queryParams.push(`rm=${encodeURIComponent(messageId)}`);
  }

  return `${baseUrl}&${queryParams.join("&")}`;
}

/**
 * Generate a link to view a specific email in Gmail
 */
export function generateGmailMessageLink(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#all/${messageId}`;
}

/**
 * Generate a Google Calendar event creation link
 */
export function generateCalendarEventLink(params: {
  title: string;
  startTime?: string; // ISO date string
  endTime?: string; // ISO date string
  description?: string;
  attendees?: string[]; // Email addresses
}): string {
  const { title, startTime, endTime, description, attendees } = params;

  // Base Google Calendar URL
  const baseUrl = "https://calendar.google.com/calendar/render";

  // Build query parameters
  const queryParams: string[] = [];

  // Action
  queryParams.push("action=TEMPLATE");

  // Title
  queryParams.push(`text=${encodeURIComponent(title)}`);

  // Date/Time
  if (startTime) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

    // Format: YYYYMMDDTHHmmSSZ
    const formatDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/-|:|\.\d{3}/g, "")
        .replace(/Z$/, "Z");
    };

    queryParams.push(
      `dates=${formatDate(start)}/${formatDate(end)}`
    );
  }

  // Description
  if (description) {
    queryParams.push(`details=${encodeURIComponent(description)}`);
  }

  // Attendees (comma-separated)
  if (attendees && attendees.length > 0) {
    queryParams.push(`add=${encodeURIComponent(attendees.join(","))}`);
  }

  return `${baseUrl}?${queryParams.join("&")}`;
}

/**
 * Detect if user is on a mobile device
 */
function isMobile(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if user is on iOS
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Detect if user is on Android
 */
function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Generate Gmail app deep link for viewing a message
 */
function getGmailAppMessageLink(messageId: string): string | null {
  if (isIOS()) {
    // iOS Gmail app deep link
    return `googlegmail://navigate?view=conversation&messageid=${messageId}`;
  } else if (isAndroid()) {
    // Android Gmail app deep link using intent
    return `intent://mail/u/0/#all/${messageId}#Intent;scheme=https;package=com.google.android.gm;end`;
  }
  return null;
}

/**
 * Open link in new tab/window
 * On mobile, tries to open Gmail app first, falls back to web
 */
export function openInNewTab(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Smart open for Gmail - tries app first on mobile, then falls back to web
 */
export function openGmailLink(webUrl: string, messageId?: string) {
  if (typeof window === "undefined") return;

  // On desktop, just open web
  if (!isMobile()) {
    window.open(webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // On mobile, try Gmail app first
  const appLink = messageId ? getGmailAppMessageLink(messageId) : null;

  if (appLink) {
    // Try to open the app
    const startTime = Date.now();

    // Create a hidden iframe to try opening the app (works better on iOS)
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = appLink;
    document.body.appendChild(iframe);

    // Also try window.location for Android
    if (isAndroid()) {
      window.location.href = appLink;
    }

    // Set a timeout to fall back to web if app doesn't open
    setTimeout(() => {
      document.body.removeChild(iframe);
      // If less than 2 seconds passed, app probably didn't open
      if (Date.now() - startTime < 2000) {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }
    }, 1500);
  } else {
    // No app link available, open web
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }
}

/**
 * Generate reply link for an item
 * Opens the original email in Gmail so user can reply in thread context
 */
export function generateReplyLink(item: {
  sender_email: string;
  title: string;
  email_id: string;
}): string {
  // Open the original email in Gmail (user clicks Reply there for proper threading)
  return generateGmailMessageLink(item.email_id);
}

/**
 * Generate meeting scheduling link
 * Wrapper around generateCalendarEventLink for convenience
 */
export function generateMeetingLink(params: {
  title: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  attendees?: string[];
}): string {
  return generateCalendarEventLink(params);
}
