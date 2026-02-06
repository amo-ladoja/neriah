"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { markItemComplete, deleteItem, submitFeedback, snoozeItem } from "@/lib/actions/items";
import {
  generateReplyLink,
  generateMeetingLink,
  openInNewTab,
} from "@/lib/utils/gmail-links";
import AttachmentViewer from "@/components/AttachmentViewer";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ id: string; filename: string } | null>(null);

  useEffect(() => {
    async function fetchItem() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (error) throw error;
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId]);

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

  const handleReply = () => {
    if (!item?.sender_email || !item?.title || !item?.email_id) return;
    const link = generateReplyLink({
      sender_email: item.sender_email,
      title: item.title,
      email_id: item.email_id,
    });
    openInNewTab(link);
  };

  const handleScheduleMeeting = () => {
    if (!item) return;
    if (item.calendar_event_id) {
      const eventUrl = `https://calendar.google.com/calendar/event?eid=${item.calendar_event_id}`;
      openInNewTab(eventUrl);
      return;
    }
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

  const handleMarkComplete = async () => {
    if (!item) return;
    const result = await markItemComplete(item.id);
    if (!result.error) {
      router.push("/dashboard");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const result = await deleteItem(item.id);
    if (!result.error) {
      router.push("/dashboard");
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!item) return;
    await submitFeedback(item.id, helpful);
    setItem({ ...item, user_feedback: helpful ? "positive" : "negative" });
  };

  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const getSnoozeUntil = (option: "3hrs" | "tomorrow" | "nextweek") => {
    if (option === "3hrs") {
      return new Date(Date.now() + 3 * 60 * 60 * 1000);
    } else if (option === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    } else {
      const d = new Date();
      const daysUntilMonday = ((8 - d.getDay()) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
      return d;
    }
  };

  const handleSnooze = async (option: "3hrs" | "tomorrow" | "nextweek") => {
    if (!item) return;
    const snoozeUntil = getSnoozeUntil(option);
    const result = await snoozeItem(item.id, snoozeUntil);
    if (!result.error) {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8F401] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4">
        <p className="text-[rgba(253,253,253,0.6)] text-[12px]">{error || "Item not found"}</p>
        <button onClick={() => router.push("/dashboard")} className="text-[#E8F401] text-[12px] no-underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  const isReply = ["task", "reply", "follow_up", "deadline", "review"].includes(item.category);
  const isReceipt = ["receipt", "invoice"].includes(item.category);
  const isMeeting = item.category === "meeting";
  const senderInitials = item.sender_name ? item.sender_name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#131313", backdropFilter: "blur(24px)" }}
    >
      {/* Background Blur Effects - Extended beyond viewport */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 231,
          height: 231,
          left: -71,
          top: 473,
          background: "rgba(6, 6, 6, 0.3)",
          filter: "blur(200px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 231,
          height: 231,
          right: -139,
          top: -100,
          background: "rgba(6, 6, 6, 0.3)",
          filter: "blur(200px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 285,
          height: 285,
          right: -59,
          bottom: -200,
          background: "rgba(232, 244, 1, 0.15)",
          filter: "blur(80px)",
        }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[402px] mx-auto px-2 lg:px-4">
        {/* Header Row */}
        <div className="flex items-center gap-[12px] pt-[64px]">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]"
          >
            <Image src="/CaretLeft.svg" alt="Back" width={18} height={18} />
          </button>
          <span
            style={{
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "1.19em",
              letterSpacing: "0.4px",
              color: "rgba(253, 253, 253, 0.6)",
            }}
          >
            Back to dashboard
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[20px] mt-[22px]">
          {/* Main Card */}
          <div
            className="relative flex flex-col gap-[20px]"
            style={{
              background: "rgba(253, 253, 253, 0.02)",
              borderRadius: 12,
              padding: "24px 16px",
              boxShadow: "0px 4px 24px 2px rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Gradient Border */}
            <div
              className="absolute inset-0 rounded-[12px] pointer-events-none"
              style={{
                padding: 0.4,
                background: "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Sender Row */}
            <div className="flex items-center gap-[14px]">
              <div
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(253, 253, 253, 0.2)" }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(253, 253, 253, 0.8)" }}>
                  {senderInitials}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "1.19em",
                    letterSpacing: "0.4px",
                    color: "rgba(253, 253, 253, 0.8)",
                  }}
                >
                  {item.title}
                </span>
                {/* Tags Row */}
                <div className="flex items-center gap-[8px]">
                  {isReply && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3px 8px 2px",
                        borderRadius: 4,
                        background: "rgba(232, 244, 1, 0.15)",
                        border: "0.4px solid rgba(232, 244, 1, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 6,
                          lineHeight: "1.33em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.8)",
                          textTransform: "uppercase",
                        }}
                      >
                        REPLY NEEDED
                      </span>
                    </div>
                  )}
                  {isReceipt && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3px 8px 2px",
                        borderRadius: 4,
                        background: "rgba(232, 244, 1, 0.15)",
                        border: "0.4px solid rgba(232, 244, 1, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 6,
                          lineHeight: "1.33em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.8)",
                          textTransform: "uppercase",
                        }}
                      >
                        RECEIPT
                      </span>
                    </div>
                  )}
                  {isMeeting && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3px 8px 2px",
                        borderRadius: 4,
                        background: "rgba(232, 244, 1, 0.15)",
                        border: "0.4px solid rgba(232, 244, 1, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 6,
                          lineHeight: "1.33em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.8)",
                          textTransform: "uppercase",
                        }}
                      >
                        MEETING
                      </span>
                    </div>
                  )}
                  {item.priority === "urgent" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3px 8px 2px",
                        borderRadius: 4,
                        background: "rgba(128, 36, 11, 0.15)",
                        border: "0.4px solid rgba(128, 36, 11, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 6,
                          lineHeight: "1.33em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.8)",
                          textTransform: "uppercase",
                        }}
                      >
                        URGENT
                      </span>
                    </div>
                  )}
                  {/* Confidence */}
                  <div className="flex items-center gap-[8px]">
                    <div
                      className="w-[4px] h-[4px] rounded-full"
                      style={{ background: "#34A853" }}
                    />
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 8,
                        lineHeight: "2.5em",
                        letterSpacing: "0.4px",
                        color: "rgba(253, 253, 253, 0.6)",
                      }}
                    >
                      {Math.round((item.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Due Date Section */}
            {item.due_date && (
              <div
                className="flex items-center gap-[10px]"
                style={{
                  background: "rgba(19, 19, 19, 0.3)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: "0.4px solid transparent",
                  backgroundImage: "linear-gradient(rgba(19,19,19,0.3), rgba(19,19,19,0.3)), linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <Image src="/schedule.svg" alt="Calendar" width={16} height={16} />
                <div className="flex flex-col gap-[4px]">
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 6,
                      lineHeight: "1.19em",
                      letterSpacing: "0.4px",
                      color: "rgba(253, 253, 253, 0.8)",
                      textTransform: "uppercase",
                    }}
                  >
                    DUE DATE
                  </span>
                  <div className="flex items-center gap-[8px]">
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 12,
                        lineHeight: "1.19em",
                        letterSpacing: "0.4px",
                        color: "rgba(253, 253, 253, 0.6)",
                      }}
                    >
                      {formatDate(item.due_date)}
                    </span>
                    <div className="w-[4px] h-[4px] rounded-full" style={{ background: "rgba(253,253,253,0.6)" }} />
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 12,
                        lineHeight: "1.19em",
                        letterSpacing: "0.4px",
                        color: "rgba(253, 253, 253, 0.6)",
                      }}
                    >
                      {formatTime(item.due_date)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Original Email Section */}
            <div className="flex flex-col gap-[12px]">
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 8,
                  lineHeight: "1.19em",
                  letterSpacing: "0.4px",
                  color: "rgba(253, 253, 253, 0.6)",
                  textTransform: "uppercase",
                }}
              >
                ORIGINAL EMAIL
              </span>

              <div className="flex flex-col gap-[12px]">
                {/* Sender Info Row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-[8px]">
                    <div
                      className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(253, 253, 253, 0.2)" }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(253, 253, 253, 0.8)" }}>
                        {senderInitials}
                      </span>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 12,
                          lineHeight: "1.19em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.8)",
                          textDecoration: "none",
                        } as React.CSSProperties}
                      >
                        {item.sender_name || "Unknown"}
                      </span>
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: 8,
                          lineHeight: "1.19em",
                          letterSpacing: "0.4px",
                          color: "rgba(253, 253, 253, 0.6)",
                          textDecoration: "none",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                        } as React.CSSProperties}
                      >
                        {item.sender_email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 8,
                        lineHeight: "2.5em",
                        letterSpacing: "0.4px",
                        color: "rgba(253, 253, 253, 0.6)",
                      }}
                    >
                      {formatDate(item.email_date)}
                    </span>
                    <div className="w-[4px] h-[4px] rounded-full" style={{ background: "rgba(253,253,253,0.6)" }} />
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 8,
                        lineHeight: "2.5em",
                        letterSpacing: "0.4px",
                        color: "rgba(253, 253, 253, 0.6)",
                      }}
                    >
                      {formatTime(item.email_date)}
                    </span>
                  </div>
                </div>

                {/* Email Subject */}
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "1.19em",
                    letterSpacing: "0.4px",
                    color: "rgba(253, 253, 253, 0.8)",
                  }}
                >
                  {item.email_subject || item.title}
                </span>

                {/* Email Snippet */}
                <div style={{ borderRadius: 12 }}>
                  <p
                    style={{
                      fontWeight: 400,
                      fontSize: 8,
                      lineHeight: "1.375em",
                      letterSpacing: "0.4px",
                      color: "rgba(253, 253, 253, 0.6)",
                    }}
                  >
                    {item.email_snippet || item.description || "No preview available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachment Section */}
          {item.has_attachment && (
            <div className="flex flex-col gap-[8px]">
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 8,
                  lineHeight: "1.19em",
                  letterSpacing: "0.4px",
                  color: "rgba(253, 253, 253, 0.6)",
                  textTransform: "uppercase",
                }}
              >
                ATTACHMENT
              </span>

              {(item.attachment_ids && item.attachment_ids.length > 0 ? item.attachment_ids : ["default"]).map((attachmentId, index) => {
                // Extract filename from attachment metadata if available
                const filename = attachmentId === "default" ? "Attachment" : `Attachment ${index + 1}`;
                const isViewable = true; // Assume viewable for now

                return (
                  <div
                    key={attachmentId}
                    className="relative flex items-center justify-between"
                    style={{
                      background: "rgba(253, 253, 253, 0.02)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      boxShadow: "0px 4px 24px 2px rgba(0, 0, 0, 0.15)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {/* Gradient Border */}
                    <div
                      className="absolute inset-0 rounded-[12px] pointer-events-none"
                      style={{
                        padding: 0.4,
                        background: "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                      }}
                    />

                    <div className="flex items-center gap-[12px]">
                      {/* File Icon */}
                      <Image src="/File.svg" alt="File" width={16} height={16} />
                      <div className="flex flex-col gap-[2px]">
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: 12,
                            lineHeight: "1.19em",
                            letterSpacing: "0.4px",
                            color: "rgba(253, 253, 253, 0.8)",
                          }}
                        >
                          {filename}
                        </span>
                        <span
                          style={{
                            fontWeight: 400,
                            fontSize: 8,
                            lineHeight: "1.375em",
                            letterSpacing: "0.4px",
                            color: "rgba(253, 253, 253, 0.4)",
                          }}
                        >
                          {isViewable ? "Click to view" : "View in Gmail"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (attachmentId !== "default") {
                          setSelectedAttachment({ id: attachmentId, filename });
                          setViewerOpen(true);
                        } else {
                          // Fallback: open Gmail if no real attachment ID
                          handleReply();
                        }
                      }}
                      className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center"
                      style={{ background: "rgba(253, 253, 253, 0.1)" }}
                    >
                      <Image src="/Eye.svg" alt="View" width={16} height={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feedback Section */}
          <div className="flex flex-col gap-[8px]">
            <span
              style={{
                fontWeight: 500,
                fontSize: 8,
                lineHeight: "1.19em",
                letterSpacing: "0.4px",
                color: "rgba(253, 253, 253, 0.6)",
                textTransform: "uppercase",
              }}
            >
              Was this extraction accurate?
            </span>

            <div className="flex items-center justify-between gap-[28px]">
              {/* Correct Button */}
              <button
                onClick={() => handleFeedback(true)}
                disabled={!!item.user_feedback}
                className="relative flex-1 flex items-center justify-center gap-[8px]"
                style={{
                  padding: "14px 52px",
                  borderRadius: 16,
                  background: item.user_feedback === "positive" ? "rgba(52, 168, 83, 0.2)" : "transparent",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    padding: 1,
                    background: item.user_feedback === "positive"
                      ? "#34A853"
                      : "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <Image src="/correct.svg" alt="Correct" width={14} height={14} />
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "1.19em",
                    letterSpacing: "0.4px",
                    color: "#FFFFFF",
                  }}
                >
                  Correct
                </span>
              </button>

              {/* Incorrect Button */}
              <button
                onClick={() => handleFeedback(false)}
                disabled={!!item.user_feedback}
                className="relative flex-1 flex items-center justify-center gap-[8px]"
                style={{
                  padding: "14px 52px",
                  borderRadius: 16,
                  background: item.user_feedback === "negative" ? "rgba(128, 36, 11, 0.2)" : "transparent",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    padding: 1,
                    background: item.user_feedback === "negative"
                      ? "#80240B"
                      : "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <Image src="/incorrect.svg" alt="Incorrect" width={14} height={14} />
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "1.19em",
                    letterSpacing: "0.4px",
                    color: "#FFFFFF",
                  }}
                >
                  Incorrect
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col gap-[12px] mt-[80px] pb-[100px]">
          {/* Primary Action Button */}
          {isReply && (
            <button
              onClick={handleReply}
              className="flex items-center justify-center gap-[6px] w-full"
              style={{
                background: "#E8F401",
                borderRadius: 16,
                padding: "10px 40px",
              }}
            >
              <Image src="/Chat.svg" alt="Reply" width={14} height={14} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: "1.67em",
                  letterSpacing: "0.4px",
                  color: "#131313",
                }}
              >
                Reply in Gmail
              </span>
            </button>
          )}
          {isReceipt && (
            <button
              onClick={handleReply}
              className="flex items-center justify-center gap-[6px] w-full"
              style={{
                background: "#E8F401",
                borderRadius: 16,
                padding: "10px 40px",
              }}
            >
              <Image src="/Receipt.svg" alt="Receipt" width={14} height={14} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: "1.67em",
                  letterSpacing: "0.4px",
                  color: "#131313",
                }}
              >
                View Receipt
              </span>
            </button>
          )}
          {isMeeting && (
            <button
              onClick={handleScheduleMeeting}
              className="flex items-center justify-center gap-[6px] w-full"
              style={{
                background: "#E8F401",
                borderRadius: 16,
                padding: "10px 40px",
              }}
            >
              <Image src="/schedule.svg" alt="Schedule" width={14} height={14} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: "1.67em",
                  letterSpacing: "0.4px",
                  color: "#131313",
                }}
              >
                Schedule Meeting
              </span>
            </button>
          )}

          {/* Secondary Action Buttons */}
          <div className="flex items-center gap-[15px]">
            {/* Snooze */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                className="relative flex items-center justify-center gap-[8px] w-full"
                style={{
                  padding: "10px 28px",
                  borderRadius: 16,
                }}
              >
                <div
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    padding: 1,
                    background: "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <Image src="/snooze.svg" alt="Snooze" width={14} height={14} />
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "1.19em",
                    letterSpacing: "0.4px",
                    color: "#FFFFFF",
                  }}
                >
                  Snooze
                </span>
              </button>

              {showSnoozeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSnoozeMenu(false)} />
                  <div
                    className="absolute bottom-full left-0 right-0 mb-1 z-50 flex flex-col gap-0.5 p-1 rounded-xl border-[0.4px] border-[#fdfdfd33]"
                    style={{
                      backgroundColor: "rgba(30, 30, 30, 0.9)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {[
                      { key: "3hrs" as const, label: "3 hours" },
                      { key: "tomorrow" as const, label: "Tomorrow 9am" },
                      { key: "nextweek" as const, label: "Next week" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleSnooze(opt.key)}
                        className="px-3 py-2 rounded-lg text-left text-[12px] font-medium text-[#fdfdfdcc] hover:bg-[#fdfdfd1f] transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Done */}
            <button
              onClick={handleMarkComplete}
              className="relative flex items-center justify-center gap-[8px] flex-1"
              style={{
                padding: "10px 28px",
                borderRadius: 16,
              }}
            >
              <div
                className="absolute inset-0 rounded-[16px] pointer-events-none"
                style={{
                  padding: 1,
                  background: "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <Image src="/done.svg" alt="Done" width={14} height={14} />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  lineHeight: "1.19em",
                  letterSpacing: "0.4px",
                  color: "#FFFFFF",
                }}
              >
                Done
              </span>
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="relative flex items-center justify-center gap-[8px] flex-1"
              style={{
                padding: "10px 28px",
                borderRadius: 16,
              }}
            >
              <div
                className="absolute inset-0 rounded-[16px] pointer-events-none"
                style={{
                  padding: 1,
                  background: "linear-gradient(119deg, rgba(253,253,253,0.6) 0%, rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <Image src="/Trash.svg" alt="Delete" width={14} height={14} />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  lineHeight: "1.19em",
                  letterSpacing: "0.4px",
                  color: "#FFFFFF",
                }}
              >
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Viewer Modal */}
      {selectedAttachment && (
        <AttachmentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedAttachment(null);
          }}
          itemId={itemId}
          attachmentId={selectedAttachment.id}
          filename={selectedAttachment.filename}
          emailId={item?.email_id}
        />
      )}
    </div>
  );
}
