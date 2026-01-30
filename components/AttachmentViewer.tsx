"use client";

import { useState, useEffect } from "react";

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  attachmentId: string;
  filename: string;
  emailId?: string; // For opening in Gmail as fallback
}

// Check if the attachmentId is actually a filename (legacy data)
function isLegacyFilename(id: string): boolean {
  const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  const lowerCaseId = id.toLowerCase();
  return fileExtensions.some(ext => lowerCaseId.endsWith(ext));
}

export default function AttachmentViewer({
  isOpen,
  onClose,
  itemId,
  attachmentId,
  filename,
  emailId,
}: AttachmentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);

  useEffect(() => {
    if (!isOpen || !attachmentId) return;

    // Check if this is legacy data (filename stored instead of attachment ID)
    if (isLegacyFilename(attachmentId)) {
      setIsLegacy(true);
      setLoading(false);
      return;
    }

    setIsLegacy(false);
    const fetchAttachment = async () => {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setMimeType(null);

      try {
        console.log(`[AttachmentViewer] Fetching attachment: ${attachmentId}`);
        const response = await fetch(
          `/api/attachments/${itemId}/${encodeURIComponent(attachmentId)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[AttachmentViewer] API error:", errorData);
          throw new Error(errorData.error || "Failed to fetch attachment");
        }

        const contentType = response.headers.get("Content-Type") || "";
        console.log(`[AttachmentViewer] Content-Type: ${contentType}`);
        setMimeType(contentType);

        const blob = await response.blob();
        console.log(`[AttachmentViewer] Blob size: ${blob.size}, type: ${blob.type}`);

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error("[AttachmentViewer] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchAttachment();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, itemId, attachmentId]);

  const handleDownload = () => {
    if (!blobUrl) return;

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInGmail = () => {
    if (emailId) {
      window.open(`https://mail.google.com/mail/u/0/#all/${emailId}`, "_blank");
    }
    onClose();
  };

  const isPdf = mimeType?.includes("pdf");
  const isImage = mimeType?.startsWith("image/");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center p-2 rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span
            style={{
              fontWeight: 500,
              fontSize: 14,
              color: "rgba(253, 253, 253, 0.8)",
            }}
          >
            {isLegacy ? attachmentId : (filename || "Attachment")}
          </span>
        </div>

        {!isLegacy && blobUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8F401] text-[#131313] font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download
          </button>
        )}
      </div>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center pt-16 pb-4 px-4">
        {/* Legacy data - show open in Gmail option */}
        {isLegacy && (
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#fdfdfd0a]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="#E8F401"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2V8H20"
                stroke="#E8F401"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: "rgba(253, 253, 253, 0.8)", fontSize: 16 }}>
              {attachmentId}
            </span>
            <span style={{ color: "rgba(253, 253, 253, 0.4)", fontSize: 12, textAlign: "center", maxWidth: 280 }}>
              This attachment needs to be viewed in Gmail. Re-sync your emails to enable in-app preview.
            </span>
            <button
              onClick={handleOpenInGmail}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8F401] text-[#131313] font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3H21V9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14L21 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Open in Gmail
            </button>
          </div>
        )}

        {/* Loading state */}
        {!isLegacy && loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#E8F401] border-t-transparent rounded-full animate-spin" />
            <span style={{ color: "rgba(253, 253, 253, 0.6)", fontSize: 14 }}>
              Loading attachment...
            </span>
          </div>
        )}

        {/* Error state */}
        {!isLegacy && error && (
          <div className="flex flex-col items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ff6b6b" strokeWidth="2" />
              <path
                d="M12 8V12M12 16H12.01"
                stroke="#ff6b6b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ color: "#ff6b6b", fontSize: 14 }}>{error}</span>
            {emailId && (
              <button
                onClick={handleOpenInGmail}
                className="px-4 py-2 rounded-xl bg-[#E8F401] text-[#131313] font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
              >
                Open in Gmail
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#fdfdfd33] text-white text-sm hover:bg-[#fdfdfd1f] transition-all"
            >
              Close
            </button>
          </div>
        )}

        {/* Success - show content */}
        {!isLegacy && !loading && !error && blobUrl && (
          <>
            {isPdf && (
              <iframe
                src={blobUrl}
                className="w-full h-full max-w-4xl rounded-lg"
                style={{ backgroundColor: "white" }}
                title={filename}
              />
            )}

            {isImage && (
              <img
                src={blobUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}

            {!isPdf && !isImage && (
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#fdfdfd0a]">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#E8F401"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#E8F401"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{ color: "rgba(253, 253, 253, 0.8)", fontSize: 16 }}
                >
                  {filename}
                </span>
                <span
                  style={{ color: "rgba(253, 253, 253, 0.4)", fontSize: 12 }}
                >
                  Preview not available for this file type
                </span>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-[#E8F401] text-[#131313] font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
                >
                  Download File
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
