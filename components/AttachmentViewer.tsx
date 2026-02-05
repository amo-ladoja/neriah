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
  const [actualFilename, setActualFilename] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !attachmentId) return;

    const fetchAttachment = async () => {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setMimeType(null);
      setActualFilename(null);

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

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        if (filenameMatch) {
          setActualFilename(filenameMatch[1]);
          console.log(`[AttachmentViewer] Filename from header: ${filenameMatch[1]}`);
        }

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
    link.download = actualFilename || filename || "attachment";
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
            className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            {actualFilename || filename || "Attachment"}
          </span>
        </div>

        {blobUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F401] text-[#131313] font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
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
      <div className="w-full h-full flex flex-col items-center justify-start pt-[82px] pb-4 px-4">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#E8F401] border-t-transparent rounded-full animate-spin" />
            <span style={{ color: "rgba(253, 253, 253, 0.6)", fontSize: 14 }}>
              Loading attachment...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
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
        {!loading && !error && blobUrl && (
          <>
            {isPdf && (
              <div className="w-full h-full max-w-4xl flex flex-col items-center gap-4">
                <object
                  data={blobUrl}
                  type="application/pdf"
                  className="w-full flex-1 rounded-lg"
                  style={{ backgroundColor: "white", minHeight: 0 }}
                >
                  {/* Fallback if object tag doesn't work */}
                  <div className="flex flex-col items-center gap-4 p-8">
                    <span style={{ color: "rgba(253, 253, 253, 0.8)" }}>
                      PDF preview not available in browser
                    </span>
                  </div>
                </object>
                {/* Always show Open in New Tab button for PDFs */}
                <button
                  onClick={() => window.open(blobUrl, "_blank")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#fdfdfd33] text-white text-sm hover:bg-[#fdfdfd1f] transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11M15 3H21V9M10 14L21 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Open in New Tab
                </button>
              </div>
            )}

            {isImage && (
              <img
                src={blobUrl}
                alt={actualFilename || filename}
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
                  {actualFilename || filename}
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
