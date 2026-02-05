"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { deleteAllUserData } from "@/lib/actions/items";
import { signOut } from "@/lib/actions/auth";

// ============================================
// Accordion Data
// ============================================

const SECTIONS = [
  {
    title: "What We Collect",
    icon: "/Download.svg",
    items: [
      { label: "Account Info", desc: "Name, email, and profile picture from your Google account" },
      { label: "Email Metadata", desc: "Sender, subject, date, and brief snippets (not full email bodies)" },
      { label: "Extracted Items", desc: "Action items, receipts, and meeting details identified by AI" },
      { label: "Attachments", desc: "Receipt PDFs/images cached temporarily (7 days) for viewing" },
    ],
  },
  {
    title: "What We Don't Store",
    icon: "/Prohibit.svg",
    items: [
      { label: "Full Emails", desc: "We never store the complete content of your emails" },
      { label: "Passwords", desc: "We use Google OAuth—we never see your password" },
      { label: "Other Google Data", desc: "We only access Gmail (read-only), nothing else" },
    ],
  },
  {
    title: "How We Use It",
    iconSvg: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 7.5C6.82843 7.5 7.5 6.82843 7.5 6C7.5 5.17157 6.82843 4.5 6 4.5C5.17157 4.5 4.5 5.17157 4.5 6C4.5 6.82843 5.17157 7.5 6 7.5Z" stroke="rgba(253,253,253,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.7 7.5C9.62 7.68 9.6 7.88 9.64 8.07C9.68 8.26 9.78 8.43 9.93 8.56L9.97 8.6C10.09 8.72 10.18 8.86 10.24 9.02C10.3 9.17 10.33 9.34 10.33 9.5C10.33 9.67 10.3 9.83 10.24 9.98C10.18 10.14 10.09 10.28 9.97 10.4C9.85 10.52 9.71 10.61 9.55 10.67C9.4 10.73 9.23 10.76 9.07 10.76C8.9 10.76 8.74 10.73 8.58 10.67C8.43 10.61 8.29 10.52 8.17 10.4L8.13 10.36C8 10.21 7.83 10.11 7.64 10.07C7.45 10.03 7.25 10.05 7.07 10.13C6.89 10.2 6.74 10.33 6.64 10.49C6.54 10.65 6.49 10.84 6.49 11.03V11.17C6.49 11.5 6.36 11.83 6.12 12.07C5.89 12.31 5.56 12.43 5.23 12.43C4.9 12.43 4.57 12.31 4.33 12.07C4.1 11.83 3.97 11.5 3.97 11.17V11.1C3.96 10.9 3.9 10.71 3.79 10.55C3.68 10.39 3.52 10.27 3.33 10.21C3.15 10.13 2.95 10.11 2.76 10.15C2.57 10.19 2.4 10.29 2.27 10.43L2.23 10.47C2.11 10.59 1.97 10.68 1.82 10.74C1.66 10.8 1.5 10.83 1.33 10.83C1.17 10.83 1 10.8 0.85 10.74C0.69 10.68 0.55 10.59 0.43 10.47C0.31 10.35 0.22 10.21 0.16 10.05C0.1 9.9 0.07 9.73 0.07 9.57C0.07 9.4 0.1 9.24 0.16 9.08C0.22 8.93 0.31 8.79 0.43 8.67L0.47 8.63C0.62 8.5 0.72 8.33 0.76 8.14C0.8 7.95 0.78 7.75 0.7 7.57C0.63 7.39 0.5 7.24 0.34 7.14C0.18 7.04 0 6.99 -0.2 6.99H-0.33C-0.66 6.99 -0.99 6.86 -1.23 6.62C-1.47 6.39 -1.6 6.06 -1.6 5.73C-1.6 5.4 -1.47 5.07 -1.23 4.83C-0.99 4.6 -0.66 4.47 -0.33 4.47H-0.27C-0.07 4.46 0.12 4.4 0.28 4.29C0.44 4.18 0.56 4.02 0.62 3.83" stroke="rgba(253,253,253,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    items: [
      { label: "AI Extraction", desc: "Email content is processed by Claude AI to identify action items" },
      { label: "Display", desc: "Extracted items shown in your Neriah dashboard" },
      { label: "Improvement", desc: "Anonymous feedback helps improve extraction accuracy" },
    ],
  },
  {
    title: "Security",
    iconSvg: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="2.25" y="5.25" width="7.5" height="5.25" rx="1" stroke="rgba(253,253,253,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.75 5.25V3.75C3.75 3.15326 3.98705 2.58097 4.40901 2.15901C4.83097 1.73705 5.40326 1.5 6 1.5C6.59674 1.5 7.16903 1.73705 7.59099 2.15901C8.01295 2.58097 8.25 3.15326 8.25 3.75V5.25" stroke="rgba(253,253,253,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    items: [
      { label: "Encryption", desc: "All data encrypted in transit (TLS 1.3) and at rest (AES-256)" },
      { label: "Isolation", desc: "Your data is isolated—only you can access it" },
      { label: "OAuth Tokens", desc: "Stored encrypted, never exposed" },
    ],
  },
  {
    title: "Your Rights",
    icon: "/HandFist.svg",
    items: [
      { label: "Access", desc: "View all data we have about you anytime" },
      { label: "Export", desc: "Download your complete data in JSON format" },
      { label: "Delete", desc: "Permanently erase all your data with one click" },
      { label: "Disconnect", desc: "Revoke Gmail access instantly in Settings" },
    ],
  },
];

// ============================================
// Accordion Component
// ============================================

function Accordion({
  section,
  isOpen,
  onToggle,
}: {
  section: (typeof SECTIONS)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="backdrop-blur-[12px]"
      style={{
        borderRadius: 12,
        boxShadow: "inset 0 0 0 0.4px rgba(253,253,253,0.2)",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2"
        style={{
          backgroundColor: "rgba(30, 30, 30, 0.6)",
          borderRadius: isOpen ? "12px 12px 0 0" : 12,
        }}
      >
        <div className="flex items-center gap-2">
          {section.icon ? (
            <Image src={section.icon} alt="" width={12} height={12} />
          ) : (
            section.iconSvg
          )}
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "rgba(253, 253, 253, 0.8)" }}
          >
            {section.title}
          </span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="rgba(253,253,253,0.6)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div
          className="flex flex-col gap-1.5 p-3 leading-[1.2]"
          style={{
            backgroundColor: "rgba(30, 30, 30, 0.6)",
            borderRadius: "0 0 12px 12px",
            borderTop: "0.4px solid rgba(253,253,253,0.1)",
          }}
        >
          {section.items.map((item) => (
            <div key={item.label}>
              <span
                className="text-xs tracking-medium"
                style={{ color: "rgba(253, 253, 253, 0.8)" }}
              >
                <span className="font-semibold">{item.label}</span>
                {" — "}
                <span style={{ color: "rgba(253, 253, 253, 0.6)" }}>
                  {item.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Data Page
// ============================================

export default function DataPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAllUserData();
    if (result.success) {
      await signOut();
    }
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#060606] overflow-hidden">
      {/* Noise Texture Background */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-noise" />

      {/* Yellow Blur Effect - Bottom Right */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-e8f401-100 rounded-full blur-[200px] opacity-20" />

      {/* 3D Mark - Faded Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none -translate-y-4">
        <Image
          src="/3d_markk.svg"
          alt=""
          width={400}
          height={400}
          className="w-[280px] md:w-[360px] h-auto"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-[39px] pb-10 pt-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-[17px] left-[17px] flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            backgroundColor: "rgba(30, 30, 30, 0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Image src="/CaretLeft.svg" alt="Back" width={16} height={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={92}
            height={24}
            className="h-4 w-auto"
          />
          <span
            className="text-xs font-semibold tracking-[0.25em] text-center"
            style={{ color: "rgba(253, 253, 253, 0.8)" }}
          >
            USER PRIVACY NOTICE
          </span>
        </div>

        {/* Subtitle */}
        <p
          className="text-xs text-center mb-2 max-w-[211px] leading-[1.2]"
          style={{
            color: "rgba(253, 253, 253, 0.6)",
            letterSpacing: "0.03em",
          }}
        >
          Your privacy matters. Here&apos;s exactly what we do with your data.
        </p>

        {/* Our Promise Card */}
        <div
          className="w-full mb-4 p-3 backdrop-blur-[12px]"
          style={{
            backgroundColor: "rgba(30, 30, 30, 0.6)",
            borderRadius: 12,
            boxShadow: "inset 0 0 0 0.4px rgba(253,253,253,0.2)",
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Image src="/ShieldStar.svg" alt="" width={12} height={12} />
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: "rgba(253, 253, 253, 0.8)" }}
              >
                Our Promise
              </span>
            </div>
            <p
              className="text-xs leading-[1.4]"
              style={{ color: "rgba(253, 253, 253, 0.6)" }}
            >
              We never store your full emails. We only extract and save
              actionable items. You can delete everything anytime.
            </p>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="w-full flex flex-col gap-1 mb-9">
          {SECTIONS.map((section, i) => (
            <Accordion
              key={section.title}
              section={section}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Delete My Data Button */}
        <button
          onClick={() => setShowConfirm(true)}
          className="px-6 py-2 rounded-3xl text-base font-medium transition-all"
          style={{
            backgroundColor: "#EB4335",
            color: "rgba(253, 253, 253, 0.8)",
            boxShadow:
              "inset 0 0 0 1px rgba(253,253,253,0.15), 0 0 20px rgba(235,67,53,0.15)",
            backdropFilter: "blur(13px)",
          }}
        >
          Delete My Data
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => !isDeleting && setShowConfirm(false)}
          />
          <div
            className="relative z-10 flex flex-col gap-4 p-6 w-full max-w-sm rounded-2xl"
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.95)",
              backdropFilter: "blur(12px)",
              border: "0.4px solid rgba(253,253,253,0.2)",
            }}
          >
            <h3
              className="text-base font-semibold"
              style={{ color: "rgba(253, 253, 253, 0.9)" }}
            >
              Delete all your data?
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(253, 253, 253, 0.6)" }}
            >
              This will permanently erase all your items, receipts, meetings,
              and push subscriptions. You will be signed out. This action cannot
              be undone.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: "0.4px solid rgba(253,253,253,0.2)",
                  color: "rgba(253, 253, 253, 0.8)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: "#EB4335",
                  color: "rgba(253, 253, 253, 0.9)",
                }}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
