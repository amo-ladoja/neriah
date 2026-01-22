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
 * Open link in new tab/window
 */
export function openInNewTab(url: string) {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Generate reply link for an item
 * Extracts relevant info from item and generates Gmail compose link
 */
export function generateReplyLink(item: {
  sender_email: string;
  title: string;
  email_id: string;
}): string {
  return generateGmailComposeLink({
    to: item.sender_email,
    subject: item.title,
    messageId: item.email_id,
  });
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
