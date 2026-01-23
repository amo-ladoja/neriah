/**
 * Receipt Parser
 * Extracts text and structured data from receipt images and PDFs
 * Uses Tesseract.js for OCR and pdf-parse for PDF text extraction
 */

import { createWorker } from "tesseract.js";

// pdf-parse is a CommonJS module, need to require it
const pdfParse = require("pdf-parse");

export interface ParsedReceipt {
  rawText: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  invoiceNumber?: string;
  confidence: number;
}

/**
 * Extract text from image using Tesseract OCR
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  let worker;

  try {
    // Create Tesseract worker
    worker = await createWorker("eng");

    // Perform OCR
    const {
      data: { text, confidence },
    } = await worker.recognize(imageBuffer);

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to 0-1 scale
    };
  } catch (error) {
    console.error("[OCR] Error extracting text from image:", error);
    throw new Error("Failed to extract text from image");
  } finally {
    // Clean up worker
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Extract text from PDF
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  try {
    const data = await pdfParse(pdfBuffer);

    return {
      text: data.text.trim(),
      confidence: 0.95, // PDFs have high confidence since text is embedded
    };
  } catch (error) {
    console.error("[PDF] Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Parse receipt data from extracted text
 * This uses regex patterns to extract structured data
 */
export function parseReceiptText(text: string): Partial<ParsedReceipt> {
  const result: Partial<ParsedReceipt> = {};

  // Extract amount (looks for patterns like $123.45, USD 123.45, 123.45 USD, etc.)
  const amountPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(?:USD|EUR|GBP)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP)/i,
    /total[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, "");
      result.amount = parseFloat(amountStr);
      break;
    }
  }

  // Extract currency
  const currencyMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD)\b/i);
  if (currencyMatch) {
    result.currency = currencyMatch[1].toUpperCase();
  } else if (text.includes("$")) {
    result.currency = "USD"; // Assume USD for $ symbol
  }

  // Extract date (multiple formats)
  const datePatterns = [
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/,
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // Extract invoice/receipt number
  const invoicePatterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /receipt\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /order\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /transaction\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /ref\s*#?\s*:?\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.invoiceNumber = match[1];
      break;
    }
  }

  // Extract vendor name (first line or line containing recognizable patterns)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    // Look for company indicators
    const companyPatterns = [
      /^([A-Z][A-Za-z\s&.,-]+(?:Inc|LLC|Ltd|Corp|Co|Company|Corporation))/i,
      /^([A-Z][A-Za-z\s&.,-]{3,30})$/,
    ];

    for (const line of lines.slice(0, 5)) {
      // Check first 5 lines
      for (const pattern of companyPatterns) {
        const match = line.match(pattern);
        if (match) {
          result.vendor = match[1].trim();
          break;
        }
      }
      if (result.vendor) break;
    }

    // Fallback: use first line if nothing found
    if (!result.vendor && lines[0]) {
      result.vendor = lines[0];
    }
  }

  return result;
}

/**
 * Main function to parse a receipt file
 * Automatically detects file type and extracts text + structured data
 */
export async function parseReceipt(
  fileBuffer: Buffer,
  fileType: string
): Promise<ParsedReceipt> {
  let text: string;
  let baseConfidence: number;

  // Extract text based on file type
  if (fileType === "application/pdf") {
    const result = await extractTextFromPDF(fileBuffer);
    text = result.text;
    baseConfidence = result.confidence;
  } else if (
    fileType.startsWith("image/") ||
    ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(fileType)
  ) {
    const result = await extractTextFromImage(fileBuffer);
    text = result.text;
    baseConfidence = result.confidence;
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Parse structured data from text
  const parsed = parseReceiptText(text);

  // Calculate overall confidence based on how many fields we extracted
  const fieldsFound = [
    parsed.amount,
    parsed.vendor,
    parsed.date,
    parsed.invoiceNumber,
  ].filter(Boolean).length;

  const structureConfidence = fieldsFound / 4; // 4 key fields
  const overallConfidence = (baseConfidence + structureConfidence) / 2;

  return {
    rawText: text,
    vendor: parsed.vendor,
    amount: parsed.amount,
    currency: parsed.currency || "USD",
    date: parsed.date,
    invoiceNumber: parsed.invoiceNumber,
    confidence: overallConfidence,
  };
}

/**
 * Validate if a parsed receipt has minimum required data
 */
export function isValidReceipt(receipt: ParsedReceipt): boolean {
  // Must have at least amount OR vendor
  return !!(receipt.amount || receipt.vendor);
}
