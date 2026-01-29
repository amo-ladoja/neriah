"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useItems } from "@/lib/hooks/useItems";
import { markItemComplete, submitFeedback } from "@/lib/actions/items";
import { signOut } from "@/lib/actions/auth";
import {
  generateReplyLink,
  generateMeetingLink,
  openInNewTab,
} from "@/lib/utils/gmail-links";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];
type FilterType = "all" | "tasks" | "receipts" | "meetings";

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
              <span className="text-xs font-medium text-[#fdfdfdcc] tracking-[3.33%] leading-[1.19] no-underline" style={{ textDecoration: 'none' }}>
                {item.sender_name || "Unknown"}
              </span>
              <span className="text-[8px] text-[#fdfdfd66] tracking-[5%] leading-[1.19] no-underline" style={{ textDecoration: 'none' }}>
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
        {!item.user_feedback && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onThumbsUp}
              className="hover:opacity-70 transition-opacity"
            >
              <Image
                src="/correct.svg"
                alt="Thumbs up"
                width={14}
                height={14}
                className="w-[14px] h-[14px]"
              />
            </button>
            <button
              onClick={onThumbsDown}
              className="hover:opacity-70 transition-opacity"
            >
              <Image
                src="/incorrect.svg"
                alt="Thumbs down"
                width={14}
                height={14}
                className="w-[14px] h-[14px]"
              />
            </button>
          </div>
        )}
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
  const { items, loading, error } = useItems(activeFilter);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
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

  const handleMarkComplete = async (itemId: string) => {
    const result = await markItemComplete(itemId);
    if (result.error) {
      console.error("Failed to mark complete:", result.error);
    }
  };

  const handleFeedback = async (itemId: string, helpful: boolean) => {
    const result = await submitFeedback(itemId, helpful);
    if (result.error) {
      console.error("Failed to submit feedback:", result.error);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1e1e1e] overflow-hidden pb-32">
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
                <button className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors">
                  <Image src="/notification.svg" alt="Notifications" width={20} height={20} />
                  <span>Notifications</span>
                </button>
                <button className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors">
                  <Image src="/about.svg" alt="About" width={20} height={20} />
                  <span>About</span>
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
          <button className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]">
            <Image src="/Search.svg" alt="Search" width={18} height={18} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-4 w-full">
          {/* Filter Section */}
          <div className="flex flex-col gap-[11.2px] w-full">
            {/* Filter Tabs */}
            <div className="flex items-center gap-[11.6886px] overflow-x-auto no-scrollbar pb-1">
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
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center pl-1 pr-1 w-full">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#fdfdfd] tracking-[0.4px] leading-[1.67] font-medium">
                  {items.length}
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
          <div className="flex flex-col gap-4 w-full">
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

            {!loading && !error && items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#fdfdfd99] text-sm">No items to display</p>
              </div>
            )}

            {!loading &&
              !error &&
              items.map((item) => (
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
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-6 py-2">
          <div className="flex justify-center items-center gap-40">
            <button className="hover:opacity-70 transition-opacity">
              <Image src="/menu.svg" alt="Menu" width={24} height={24} />
            </button>
            <button className="hover:opacity-70 transition-opacity">
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
    </div>
  );
}
