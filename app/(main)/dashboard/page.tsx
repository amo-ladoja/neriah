"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { useItems } from "@/lib/hooks/useItems";
import { markItemComplete, submitFeedback } from "@/lib/actions/items";
import {
  generateReplyLink,
  generateMeetingLink,
  openInNewTab,
} from "@/lib/utils/gmail-links";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];
type FilterType = "all" | "tasks" | "receipts" | "meetings";

export default function DashboardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { items, loading, error } = useItems(activeFilter);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // TODO: Implement background sync endpoint
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

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-[#8B4513]/20 text-[#FF6B6B] border border-[#FF6B6B]/30";
      default:
        return "bg-[#4A5F4E]/30 text-[#6B8E6F] border border-[#6B8E6F]/30";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "reply":
        return "bg-[#4A5F4E]/30 text-[#6B8E6F] border border-[#6B8E6F]/30";
      case "invoice":
        return "bg-[#8B4513]/20 text-[#D4A574] border border-[#D4A574]/30";
      default:
        return "bg-[#4A5F4E]/30 text-[#6B8E6F] border border-[#6B8E6F]/30";
    }
  };

  const getReceiptCategoryColor = (category: string) => {
    return "bg-[#8B4513]/20 text-[#D4A574] border border-[#D4A574]/30";
  };

  const renderItemCard = (item: Item) => {
    const senderInitials = item.sender_name
      ? item.sender_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";

    const isReply = item.category === "reply" || ["reply", "follow_up", "deadline", "review"].includes(item.category);
    const isReceipt = item.category === "invoice";
    const isMeeting = item.category === "meeting";

    return (
      <div
        key={item.id}
        className="bg-[#1A1A1A]/80 backdrop-blur-xl rounded-[20px] p-5 mb-4 border border-white/5"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-semibold">
              {senderInitials}
            </div>
            <div>
              <p className="text-white font-medium text-base">
                {item.sender_name || "Unknown"}
              </p>
              <p className="text-gray-400 text-sm">{item.sender_email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">
              {item.email_date
                ? new Date(item.email_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </p>
            <p className="text-gray-400 text-sm">
              {item.email_date
                ? new Date(item.email_date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-medium text-lg mb-3">{item.title}</h3>

        {/* Description */}
        {item.description && !isReceipt && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Receipt Display */}
        {isReceipt && item.receipt_details && (
          <div className="bg-black/40 rounded-2xl p-4 mb-3 border border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-3xl mb-1">
                  {item.receipt_details.currency || "₦"}
                  {item.receipt_details.amount?.toLocaleString() || "0.00"}
                </p>
                <p className="text-gray-400 text-sm">
                  {item.receipt_details.vendor} •{" "}
                  {item.receipt_details.invoiceNumber || "N/A"}
                </p>
              </div>
              {item.receipt_category && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getReceiptCategoryColor(
                    item.receipt_category
                  )}`}
                >
                  {item.receipt_category.charAt(0).toUpperCase() +
                    item.receipt_category.slice(1)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          {/* Category Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getCategoryBadgeColor(
              item.category
            )}`}
          >
            {item.category === "reply" && "REPLY NEEDED"}
            {item.category === "invoice" && "RECEIPT"}
            {item.category === "meeting" && "MEETING"}
            {item.category === "follow_up" && "FOLLOW UP"}
            {item.category === "deadline" && "DEADLINE"}
            {item.category === "review" && "REVIEW"}
          </span>

          {/* Priority Badge */}
          {item.priority && item.priority !== "normal" && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getPriorityBadgeColor(
                item.priority
              )}`}
            >
              {item.priority}
            </span>
          )}

          {/* Confidence */}
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-400 text-sm">
              {Math.round((item.confidence || 0) * 100)}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Primary Action */}
          {isReply && (
            <button
              onClick={() => handleReply(item)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F401] rounded-full text-black font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
            >
              <Image
                src="/reply.svg"
                alt="Reply"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              Reply
            </button>
          )}
          {isReceipt && (
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F401] rounded-full text-black font-semibold text-sm hover:bg-[#E8F401]/90 transition-all">
              <Image
                src="/Receipt.svg"
                alt="Receipt"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              View Receipt
            </button>
          )}
          {isMeeting && (
            <button
              onClick={() => handleScheduleMeeting(item)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F401] rounded-full text-black font-semibold text-sm hover:bg-[#E8F401]/90 transition-all"
            >
              <Image
                src="/schedule.svg"
                alt="Schedule"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              Schedule
            </button>
          )}

          {/* Snooze */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-transparent rounded-full text-white font-medium text-sm border border-white/20 hover:bg-white/5 transition-all">
            <Image
              src="/snooze.svg"
              alt="Snooze"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            Snooze
          </button>

          {/* Done */}
          <button
            onClick={() => handleMarkComplete(item.id)}
            className="flex items-center gap-2 px-4 py-2.5 bg-transparent rounded-full text-white font-medium text-sm border border-white/20 hover:bg-white/5 transition-all"
          >
            <Image
              src="/done.svg"
              alt="Done"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            Done
          </button>

          {/* Feedback */}
          {!item.user_feedback && (
            <>
              <button
                onClick={() => handleFeedback(item.id, true)}
                className="ml-auto p-2.5 hover:bg-white/5 rounded-full transition-all"
              >
                <Image
                  src="/correct.svg"
                  alt="Thumbs up"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </button>
              <button
                onClick={() => handleFeedback(item.id, false)}
                className="p-2.5 hover:bg-white/5 rounded-full transition-all"
              >
                <Image
                  src="/incorrect.svg"
                  alt="Thumbs down"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 relative overflow-hidden">
      {/* Green Blur Effect - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-[#4A9B5C] rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-8">
          {/* Profile */}
          <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
            <Image src="/User.svg" alt="Profile" width={24} height={24} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/neriah_box.svg"
              alt="Neriah"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-white text-2xl font-semibold">neriah</span>
          </div>

          {/* Search */}
          <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="9"
                cy="9"
                r="6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M14 14L18 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeFilter === "all"
                ? "bg-[#5FB574] text-white"
                : "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("tasks")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeFilter === "tasks"
                ? "bg-[#5FB574] text-white"
                : "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveFilter("receipts")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeFilter === "receipts"
                ? "bg-[#5FB574] text-white"
                : "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
            }`}
          >
            Receipts
          </button>
          <button
            onClick={() => setActiveFilter("meetings")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeFilter === "meetings"
                ? "bg-[#5FB574] text-white"
                : "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
            }`}
          >
            Meetings
          </button>
        </div>

        {/* Items Count & Sync */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-base">
            <span className="font-bold">{items.length}</span>{" "}
            <span className="text-gray-400">items need attention</span>
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 text-white hover:text-[#E8F401] transition-colors disabled:opacity-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isSyncing ? "animate-spin" : ""}
            >
              <path
                d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.84871 2 11.5076 2.82597 12.6213 4.12132"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M14 4V4.5M14 4.5V8H10.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm">sync now</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="relative z-10 px-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E8F401] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No items to display</p>
          </div>
        )}

        {!loading && items.map(renderItemCard)}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4">
        <div className="flex items-center justify-center gap-24">
          <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
            <Image src="/menu.svg" alt="Menu" width={24} height={24} />
          </button>
          <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
            <Image src="/Chat.svg" alt="Chat" width={24} height={24} />
          </button>
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
