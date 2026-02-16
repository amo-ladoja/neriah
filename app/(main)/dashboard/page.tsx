"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useItems } from "@/lib/hooks/useItems";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { markItemComplete, submitFeedback } from "@/lib/actions/items";
import { signOut } from "@/lib/actions/auth";
import {
  generateReplyLink,
  generateMeetingLink,
  openInNewTab,
} from "@/lib/utils/gmail-links";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];
type FilterType = "all" | "tasks" | "receipts" | "meetings" | "snoozed";

// ============================================
// Utility Components
// ============================================

const CircleDot = ({ color = "#ffffff" }: { color?: string }) => (
  <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: color }} />
);

// ============================================
// Tag Components
// ============================================

interface TagProps {
  label: string;
  variant?: "default" | "active";
  onClick?: () => void;
}

const Tag = ({ label, variant = "default", onClick }: TagProps) => {
  const isActive = variant === "active";

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center px-1.5 py-0.5 rounded-xl text-xs font-medium tracking-[0.2px] leading-[1.67] transition-all ${
        isActive
          ? "bg-[#80d0ae] border border-[#80d0ae4d] text-[#030303cc]"
          : "bg-[#fdfdfd26] border border-[#fdfdfd33]/40 text-[#fdfdfdcc] hover:bg-[#fdfdfd33]"
      }`}
    >
      {label}
    </button>
  );
};

interface SmallTagProps {
  label: string;
  variant: "reply" | "urgent" | "receipt" | "meetings";
}

const SmallTag = ({ label, variant }: SmallTagProps) => {
  const styles = {
    reply: "bg-[#e8f40126] border-[#e8f4014d]",
    urgent: "bg-[#80240b26] border-[#80240b4d]",
    receipt: "bg-[#e8f40126] border-[#e8f4014d]",
    meetings: "bg-[#e8f40126] border-[#e8f4014d]",
  };

  return (
    <div
      className={`flex items-center justify-center px-1 pt-[3px] pb-[2px] rounded text-[6px] font-semibold tracking-[0.4px] leading-[1.33] border-[0.4px] ${styles[variant]} text-[#fdfdfdcc] uppercase`}
    >
      {label}
    </div>
  );
};

// ============================================
// Button Components
// ============================================

interface ActionButtonProps {
  label: string;
  iconPath: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

const ActionButton = ({
  label,
  iconPath,
  variant = "secondary",
  onClick,
}: ActionButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center gap-[6px] px-1 py-[4px] rounded-xl text-[8px] tracking-[0.4px] leading-[1.5] cursor-pointer transition-all ${
        isPrimary
          ? "bg-[#e8f401] text-[#131313] font-bold hover:bg-[#e8f401]/90"
          : "bg-transparent text-[#fdfdfd] font-semibold"
      }`}
    >
      <div className="absolute inset-0 rounded-xl p-[0.4px] pointer-events-none opacity-[0.4]"
        style={{
          background: 'linear-gradient(119deg, rgba(253,253,253,0.6), rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />
      <Image src={iconPath} alt={label} width={14} height={14} className="w-[14px] h-[14px]" />
      <span>{label}</span>
    </button>
  );
};

// ============================================
// Task Card Component
// ============================================

interface TaskCardProps {
  item: Item;
  onCardClick?: () => void;
  onReply?: () => void;
  onViewReceipt?: () => void;
  onSchedule?: () => void;
  onDone?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}

const TaskCard = ({
  item,
  onCardClick,
  onReply,
  onViewReceipt,
  onSchedule,
  onDone,
  onThumbsUp,
  onThumbsDown,
}: TaskCardProps) => {
  const isReply = ["task", "reply", "follow_up", "deadline", "review"].includes(item.category);
  const isReceipt = ["receipt", "invoice"].includes(item.category);
  const isMeeting = item.category === "meeting";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTags = () => {
    const tags: { label: string; variant: "reply" | "urgent" | "receipt" | "meetings" }[] = [];

    if (isReply) {
      tags.push({ label: "REPLY NEEDED", variant: "reply" });
    } else if (isReceipt) {
      tags.push({ label: "RECEIPT", variant: "receipt" });
    } else if (isMeeting) {
      tags.push({ label: "MEETINGS", variant: "meetings" });
    }

    if (item.priority === "urgent") {
      tags.push({ label: "URGENT", variant: "urgent" });
    }

    return tags;
  };

  const senderInitials = item.sender_name
    ? item.sender_name.charAt(0).toUpperCase()
    : "?";

  return (
    <div
      onClick={onCardClick}
      className="relative overflow-hidden flex flex-col gap-[8px] p-2 rounded-2xl bg-[#fdfdfd05] backdrop-blur-[12px] shadow-[0_4px_24px_2px_rgba(0,0,0,0.15)] cursor-pointer hover:bg-[#fdfdfd08] transition-colors"
    >
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-2xl p-[0.4px] pointer-events-none opacity-[0.4]"
        style={{
          background: 'linear-gradient(119deg, rgba(253,253,253,0.6), rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />
      {/* Header */}
      <div className="flex flex-col gap-1 w-full">
        {/* Sender Info Row */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-1">
            <div className="w-[28px] h-[28px] rounded-full bg-[#fdfdfd33] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-[#fdfdfdcc] tracking-[0.4px]">
                {senderInitials}
              </span>
            </div>
            <div className="flex flex-col gap-[-1px]">
              <span className="text-xs font-medium text-[#fdfdfdcc] tracking-[3.33%] leading-[1.19] no-underline" style={{ textDecoration: 'none' } as React.CSSProperties}>
                {item.sender_name || "Unknown"}
              </span>
              <span className="text-[8px] text-[#fdfdfd66] tracking-[5%] leading-[1.19] no-underline" style={{ textDecoration: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
                {item.sender_email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {formatDate(item.email_date)}
            </span>
            <CircleDot color="#fdfdfd99" />
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {formatTime(item.email_date)}
            </span>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-medium text-[#fdfdfdcc] tracking-[3.33%] leading-[1.19] mt-[4px]">{item.title}</p>
      </div>

      {/* Content */}
      {isReply && item.description && (
        <div className="w-full rounded-xl flex flex-col justify-center">
          <p className="text-[8px] text-[#fdfdfd99] tracking-[5%] leading-[1.375] line-clamp-2">
            {item.description}
          </p>
        </div>
      )}

      {isReceipt && item.receipt_details && (
        <div className="flex flex-col gap-0 rounded-lg bg-[#13131366] px-[12px] py-[12px] border-[0.4px] border-[#fdfdfd4d] w-full mt-[-2px]">
          <span className="text-lg text-[#fdfdfdcc] tracking-[0.4px] font-medium">
            {item.receipt_details.currency || "₦"}
            {item.receipt_details.amount?.toLocaleString() || "0.00"}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {item.receipt_details.vendor}
            </span>
            <CircleDot color="#fdfdfd99" />
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {item.receipt_details.invoiceNumber || "N/A"}
            </span>
          </div>
        </div>
      )}

      {isMeeting && item.meeting_details && (
        <div className="flex flex-col gap-0 rounded-lg bg-[#13131366] px-[12px] py-[12px] border-[0.4px] border-[#fdfdfd4d] w-full mt-[-2px]">
          <span className="text-lg text-[#fdfdfdcc] tracking-[0.4px] font-medium">
            {item.meeting_details.suggestedTimes?.[0]
              ? new Date(item.meeting_details.suggestedTimes[0]).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }) +
                " at " +
                new Date(item.meeting_details.suggestedTimes[0]).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : item.title}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {item.meeting_details.duration || 30} minutes
            </span>
            <CircleDot color="#fdfdfd99" />
            <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
              {item.meeting_details.attendees?.length || 0} attendees
            </span>
          </div>
        </div>
      )}

      {/* Tags & Confidence */}
      <div className="flex justify-between items-center w-full mt-[2px] pb-1.5 border-b-[0.2px] border-b-[#fdfdfd66]">
        <div className="flex items-center gap-2">
          {getTags().map((tag, index) => (
            <SmallTag key={index} label={tag.label} variant={tag.variant} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <CircleDot color="#34a853" />
          <span className="text-[8px] font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[2.5]">
            {Math.round((item.confidence || 0) * 100)}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center w-full mt-[4px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {isReply && (
            <ActionButton
              label="Reply"
              iconPath="/reply.svg"
              variant="primary"
              onClick={onReply}
            />
          )}
          {isReceipt && (
            <ActionButton
              label="View Receipt"
              iconPath="/Receipt.svg"
              variant="primary"
              onClick={onViewReceipt}
            />
          )}
          {isMeeting && (
            <ActionButton
              label="Schedule"
              iconPath="/schedule.svg"
              variant="primary"
              onClick={onSchedule}
            />
          )}
          <ActionButton label="Snooze" iconPath="/snooze.svg" />
          <ActionButton label="Done" iconPath="/done.svg" onClick={onDone} />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onThumbsUp}
            disabled={!!item.user_feedback}
            className="hover:opacity-70 transition-all disabled:cursor-default disabled:hover:opacity-100"
          >
            <Image
              src="/correct.svg"
              alt="Thumbs up"
              width={14}
              height={14}
              className="w-[14px] h-[14px]"
              style={item.user_feedback === "positive" ? {
                filter: "brightness(0) saturate(100%) invert(76%) sepia(25%) saturate(491%) hue-rotate(107deg) brightness(92%) contrast(87%)"
              } : undefined}
            />
          </button>
          <button
            onClick={onThumbsDown}
            disabled={!!item.user_feedback}
            className="hover:opacity-70 transition-all disabled:cursor-default disabled:hover:opacity-100"
          >
            <Image
              src="/incorrect.svg"
              alt="Thumbs down"
              width={14}
              height={14}
              className="w-[14px] h-[14px]"
              style={item.user_feedback === "negative" ? {
                filter: "brightness(0) saturate(100%) invert(76%) sepia(25%) saturate(491%) hue-rotate(107deg) brightness(92%) contrast(87%)"
              } : undefined}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Dashboard Component
// ============================================

export default function Dashboard() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { items, loading, error, refetch } = useItems(activeFilter);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState<number | null>(null);
  const [undoItemId, setUndoItemId] = useState<string | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { subscribed, subscribe, clearBadge } = usePushNotifications();

  // Clear badge count when dashboard is opened
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearBadge(); }, []);

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.sender_name?.toLowerCase().includes(query) ||
      item.sender_email?.toLowerCase().includes(query) ||
      item.email_subject?.toLowerCase().includes(query)
    );
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/extract/sync", { method: "POST" });
      await refetch();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReply = (item: Item) => {
    if (!item.sender_email || !item.title || !item.email_id) return;

    const link = generateReplyLink({
      sender_email: item.sender_email,
      title: item.title,
      email_id: item.email_id,
    });
    openInNewTab(link);
  };

  const handleScheduleMeeting = (item: Item) => {
    // If email already has a calendar invite, open it instead of creating new
    if (item.calendar_event_id) {
      const eventUrl = `https://calendar.google.com/calendar/event?eid=${item.calendar_event_id}`;
      openInNewTab(eventUrl);
      return;
    }

    // Otherwise, create a new calendar event
    if (!item.meeting_details) return;

    const link = generateMeetingLink({
      title: item.meeting_details.topic || item.title,
      startTime: item.meeting_details.suggestedTimes?.[0],
      endTime: undefined,
      description: item.description || undefined,
      attendees: item.meeting_details.attendees,
    });
    openInNewTab(link);
  };

  const completeItem = useCallback(async (itemId: string) => {
    const result = await markItemComplete(itemId);
    if (result.error) {
      console.error("Failed to mark complete:", result.error);
    }
  }, []);

  const handleMarkComplete = (itemId: string) => {
    if (undoCountdown !== null) return;

    // Start 5 second countdown
    setUndoItemId(itemId);
    setUndoCountdown(5);

    undoIntervalRef.current = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Countdown finished, complete the item
          if (undoIntervalRef.current) {
            clearInterval(undoIntervalRef.current);
            undoIntervalRef.current = null;
          }
          completeItem(itemId);
          setUndoItemId(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleUndo = () => {
    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
    setUndoCountdown(null);
    setUndoItemId(null);
  };

  const handleFeedback = async (itemId: string, helpful: boolean) => {
    const result = await submitFeedback(itemId, helpful);
    if (result.error) {
      console.error("Failed to submit feedback:", result.error);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#131313] overflow-hidden pb-32">
      {/* Background Gradient Effects - Extended beyond viewport */}
      <div className="absolute w-[231px] h-[231px] rounded-full bg-[#0606064d] blur-[175px] -left-[71px] top-[473px]" />
      <div className="absolute w-[231px] h-[231px] rounded-full bg-[#0606064d] blur-[175px] right-[139px] -top-[100px]" />
      <div className="absolute w-[285px] h-[285px] rounded-full bg-[#e8f40126] blur-[70px] right-[-120px] -bottom-[200px] mix-blend-lighten" />

      {/* Main Container - Responsive */}
      <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-2 lg:px-4">
        {/* Logo */}
        <div className="flex items-center justify-center pt-[71px] pb-[22.158752px]">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={123}
            height={35}
            className="w-[123px] h-[35px]"
          />
        </div>

        {/* Header Icons */}
        <div className="absolute left-2 lg:left-4 top-16 z-50">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]"
          >
            <Image src="/User.svg" alt="Profile" width={18} height={18} />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="relative z-50 mt-[8px] flex flex-col gap-[24px] px-[24px] py-[24px] rounded-2xl border-[0.4px] border-[#fdfdfd33]"
                style={{
                  backgroundColor: "rgba(30, 30, 30, 0.8)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <button className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors">
                  <Image src="/account.svg" alt="Account" width={20} height={20} />
                  <span>Account</span>
                </button>
                <button
                  onClick={async () => {
                    if (!subscribed) await subscribe();
                  }}
                  className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors"
                >
                  <Image src="/notification.svg" alt="Notifications" width={20} height={20} />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => router.push("/data")}
                  className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors"
                >
                  <Image src="/data.svg" alt="Data" width={20} height={20} />
                  <span>Data</span>
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                  }}
                  className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors"
                >
                  <Image src="/SignOut.svg" alt="Sign Out" width={20} height={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="absolute right-2 lg:right-4 top-16">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]"
          >
            <Image src="/Search.svg" alt="Search" width={18} height={18} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-2 w-full">
          {/* Search Input */}
          {isSearchOpen && (
            <div className="relative flex items-center w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  className="w-full pl-2 py-2 pr-10 rounded-xl bg-[#fdfdfd0a] backdrop-blur-[12px] border-[0.4px] border-[#fdfdfd33] text-[#fdfdfdcc] text-sm placeholder-[#fdfdfd66] focus:outline-none focus:border-[#fdfdfd66] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#fdfdfd66] hover:text-[#fdfdfdcc] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="ml-3 text-sm text-[#fdfdfd99] hover:text-[#fdfdfdcc] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Filter Section */}
          <div className="flex flex-col gap-[11.2px] w-full">
            {/* Filter Tabs */}
            <div className="flex items-center gap-[11.6886px] overflow-x-auto no-scrollbar pb-1 -mx-2 lg:-mx-4 px-2 lg:px-4">
              <Tag
                label="All"
                variant={activeFilter === "all" ? "active" : "default"}
                onClick={() => setActiveFilter("all")}
              />
              <Tag
                label="Tasks"
                variant={activeFilter === "tasks" ? "active" : "default"}
                onClick={() => setActiveFilter("tasks")}
              />
              <Tag
                label="Receipts"
                variant={activeFilter === "receipts" ? "active" : "default"}
                onClick={() => setActiveFilter("receipts")}
              />
              <Tag
                label="Meetings"
                variant={activeFilter === "meetings" ? "active" : "default"}
                onClick={() => setActiveFilter("meetings")}
              />
              <Tag
                label="Snoozed"
                variant={activeFilter === "snoozed" ? "active" : "default"}
                onClick={() => setActiveFilter("snoozed")}
              />
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center pl-1 pr-1 w-full">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#fdfdfd] tracking-[0.4px] leading-[1.67] font-medium">
                  {filteredItems.length}
                </span>
                <span className="text-sm font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[1.67]">
                  items need attention
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50"
              >
                <Image
                  src="/snooze.svg"
                  alt="Sync"
                  width={12}
                  height={12}
                  className={isSyncing ? "animate-spin" : ""}
                />
                <span className="text-sm font-medium text-[#fdfdfd99] tracking-[0.4px] leading-[1.67]">
                  sync now
                </span>
              </button>
            </div>
          </div>

          {/* Task Cards */}
          <div className="flex flex-col gap-2 w-full">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#e8f401] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-[#fdfdfd99] text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <div className="flex flex-col items-center mt-[84px]">
                <Image src="/Bathtub.svg" alt="" width={32} height={32} className="mb-2" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "rgba(253,253,253,0.8)" }}>
                  {searchQuery ? "No matches" : "You're free!"}
                </h3>
                <p style={{ fontSize: 12, color: "rgba(253,253,253,0.5)", textAlign: "center", marginTop: 8 }}>
                  {searchQuery
                    ? "No items match your search"
                    : "No action items right now."}
                </p>
                {!searchQuery && (
                  <p style={{ fontSize: 12, color: "rgba(253,253,253,0.5)", textAlign: "center" }}>
                    Enjoy the calm, we&apos;ve got your inbox covered.
                  </p>
                )}
              </div>
            )}

            {!loading &&
              !error &&
              filteredItems.map((item) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  onCardClick={() => router.push(`/dashboard/${item.id}`)}
                  onReply={() => handleReply(item)}
                  onViewReceipt={() => {
                    /* TODO: Implement receipt viewer */
                  }}
                  onSchedule={() => handleScheduleMeeting(item)}
                  onDone={() => handleMarkComplete(item.id)}
                  onThumbsUp={() => handleFeedback(item.id, true)}
                  onThumbsDown={() => handleFeedback(item.id, false)}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13131333] backdrop-blur-[17.5px] border-t-[0.4px] border-t-[#fdfdfd33]">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-6 py-3">
          <div className="flex justify-center items-center gap-40">
            <button className="hover:opacity-70 transition-opacity">
              <Image src="/menu.svg" alt="Menu" width={24} height={24} />
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="hover:opacity-70 transition-opacity"
            >
              <Image src="/Chat.svg" alt="Chat" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Undo Toast */}
      {undoCountdown !== null && (
        <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleUndo}
            className="flex items-center gap-[12px] px-[16px] py-[10px] rounded-full"
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.95)",
              backdropFilter: "blur(12px)",
              border: "0.4px solid rgba(253, 253, 253, 0.2)",
            }}
          >
            {/* Countdown Circle */}
            <div className="relative w-[32px] h-[32px]">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 32 32"
              >
                {/* Background circles */}
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="#808080"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="#E8F401"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 13}
                  strokeDashoffset={2 * Math.PI * 13 * (1 - undoCountdown / 5)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              {/* Countdown number */}
              <span
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
              >
                {undoCountdown}
              </span>
            </div>
            {/* Undo text */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#FFFFFF",
              }}
            >
              Undo
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
