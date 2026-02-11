import type { ItemPriority, ReceiptCategory } from "@/lib/types/database";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "my",
  "me",
  "show",
  "find",
  "get",
  "list",
  "about",
  "please",
  "recent",
  "latest",
  // Category-related words (prevent polluting keyword search)
  "receipts",
  "receipt",
  "invoices",
  "invoice",
  "tasks",
  "task",
  "meetings",
  "meeting",
  "items",
  "item",
  // Query words
  "many",
  "much",
  "how",
  "have",
  "received",
  "days",
  "past",
  "last",
]);

const DATE_KEYWORDS: Record<string, () => { start: Date; end: Date }> = {
  "this week": () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  },
  "last week": () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() - now.getDay() - 1);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  },
  "this month": () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  },
  "last month": () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },
  today: () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  },
  yesterday: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },
};

const CATEGORY_KEYWORDS: Record<ReceiptCategory, string[]> = {
  software: ["software", "saas", "subscription"],
  travel: ["travel", "flight", "hotel", "uber", "lyft"],
  medical: ["medical", "health", "pharmacy"],
  office: ["office", "stationery", "supplies"],
  meals: ["meals", "restaurant", "dinner", "lunch"],
  utilities: ["utilities", "internet", "phone", "electric"],
  other: ["other"],
};

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function parseDateToken(token: string): Date | null {
  const isoMatch = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const slashMatch = token.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const fullYear = year ? Number(year.length === 2 ? `20${year}` : year) : new Date().getFullYear();
    return new Date(fullYear, Number(month) - 1, Number(day));
  }

  return null;
}

function parseMonthDay(tokens: string[]): Date | null {
  if (tokens.length < 2) return null;
  const monthToken = tokens[0];
  const dayToken = tokens[1];
  if (!(monthToken in MONTH_MAP)) return null;
  const day = Number(dayToken);
  if (!day || day < 1 || day > 31) return null;
  const year = new Date().getFullYear();
  return new Date(year, MONTH_MAP[monthToken], day);
}

export function extractDateRange(text: string) {
  const lowered = text.toLowerCase();
  for (const [phrase, builder] of Object.entries(DATE_KEYWORDS)) {
    if (lowered.includes(phrase)) {
      return builder();
    }
  }

  const relativeMatch = lowered.match(/(?:last|past)\s+(\d{1,3})\s+days/);
  if (relativeMatch) {
    const days = Number(relativeMatch[1]);
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    return { start, end };
  }

  const betweenMatch = lowered.match(/between\s+([a-z0-9\/-]+)\s+and\s+([a-z0-9\/-]+)/);
  if (betweenMatch) {
    const start = parseDateToken(betweenMatch[1]);
    const end = parseDateToken(betweenMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  const fromMatch = lowered.match(/from\s+([a-z0-9\/-]+)\s+to\s+([a-z0-9\/-]+)/);
  if (fromMatch) {
    const start = parseDateToken(fromMatch[1]);
    const end = parseDateToken(fromMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  const sinceMatch = lowered.match(/since\s+([a-z0-9\/-]+)/);
  if (sinceMatch) {
    const start = parseDateToken(sinceMatch[1]);
    if (start) {
      return { start, end: new Date() };
    }
  }

  const tokens = tokenize(lowered);
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const parsed = parseMonthDay(tokens.slice(i, i + 2));
    if (parsed) {
      return { start: parsed, end: new Date() };
    }
  }

  return null;
}

export function extractNegations(text: string) {
  const negations: string[] = [];
  const lowered = text.toLowerCase();
  const patterns = /(not|without|exclude|except)\s+([a-z0-9&.\- ]{2,40})/g;
  let match: RegExpExecArray | null;
  while ((match = patterns.exec(lowered))) {
    const phrase = match[2].trim().split(" ").slice(0, 3).join(" ");
    if (phrase) {
      negations.push(phrase);
    }
  }
  return negations;
}

export function extractKeywords(text: string, negations: string[]) {
  const negationTokens = new Set(negations.flatMap((item) => tokenize(item)));
  return tokenize(text)
    .filter((word) => word.length > 2)
    .filter((word) => !STOPWORDS.has(word))
    .filter((word) => !negationTokens.has(word))
    .slice(0, 5);
}

export function extractCategory(text: string): ReceiptCategory | null {
  const lowered = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return category as ReceiptCategory;
    }
  }
  return null;
}

export function extractVendor(text: string): string | null {
  const match = text.match(/(?:from|at|paid to|vendor)\s+([a-z0-9&.\- ]+)/i);
  if (!match) return null;
  return match[1].trim().split(" ").slice(0, 3).join(" ");
}

export function extractPriority(text: string): ItemPriority | null {
  const lowered = text.toLowerCase();
  if (lowered.includes("urgent")) return "urgent";
  if (lowered.includes("high")) return "high";
  if (lowered.includes("medium")) return "medium";
  if (lowered.includes("low")) return "low";
  return null;
}

export function extractItemKind(text: string) {
  const lowered = text.toLowerCase();
  if (/(receipt|invoice)/.test(lowered)) return "receipt";
  if (/(meeting|schedule|calendar)/.test(lowered)) return "meeting";
  if (/(task|follow up|follow-up|deadline|reply)/.test(lowered)) return "task";
  return null;
}
