"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ============================================
// Suggested Prompts Pool
// ============================================

const PROMPT_SUGGESTIONS = [
  "List all my urgent tasks here?",
  "What's the total amount of invoices I received in May?",
  "How many tasks do I receive on average per day?",
  "Show me pending follow-ups",
  "What receipts do I have from this week?",
  "Any meetings I need to schedule?",
  "What are my high priority items?",
  "How much did I spend last month?",
  "What tasks are due this week?",
];

// ============================================
// Prompt Pill Component
// ============================================

interface PromptPillProps {
  text: string;
  onClick: () => void;
}

const PromptPill = ({ text, onClick }: PromptPillProps) => (
  <button
    onClick={onClick}
    className="relative overflow-hidden flex items-center justify-center px-3 py-2 rounded-[32px] backdrop-blur-[12px] hover:bg-[#fdfdfd08] transition-colors"
    style={{
      backgroundColor: "rgba(253, 253, 253, 0.04)",
    }}
  >
    {/* Gradient border */}
    <div
      className="absolute inset-0 rounded-[32px] p-[0.4px] pointer-events-none"
      style={{
        background:
          "linear-gradient(119deg, rgba(253,253,253,0.6), rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6))",
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
    <span
      className="text-xs tracking-[1.67%] leading-[1.67]"
      style={{ color: "rgba(253, 253, 253, 0.6)" }}
    >
      {text}
    </span>
  </button>
);

// ============================================
// Main Chat Component
// ============================================

export default function ChatPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Randomly select 3 prompts on mount
  const randomPrompts = useMemo(() => {
    const shuffled = [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // TODO: Implement chat API call
    console.log("Sending:", inputValue);
    setInputValue("");
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // ~4 lines max
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  return (
    <div className="relative min-h-screen bg-[#131313] overflow-hidden">
      {/* Background Gradient Effects - Same as dashboard */}
      <div className="absolute w-[231px] h-[231px] rounded-full bg-[#0606064d] blur-[175px] -left-[71px] top-[473px]" />
      <div className="absolute w-[231px] h-[231px] rounded-full bg-[#0606064d] blur-[175px] right-[139px] -top-[100px]" />
      <div className="absolute w-[285px] h-[285px] rounded-full bg-[#e8f40126] blur-[70px] right-[-120px] -bottom-[200px] mix-blend-lighten" />

      {/* Main Container - Responsive (matching dashboard) */}
      <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-2 lg:px-4 flex flex-col min-h-screen pb-[180px]">
        {/* Logo - Same position as dashboard */}
        <div className="flex items-center justify-center pt-[71px] pb-[22px]">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={123}
            height={35}
            className="w-[123px] h-[35px]"
          />
        </div>

        
        {/* Chat Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center" />
      </div>

      {/* Suggested Prompts - Fixed above input bar */}
      <div className="fixed left-0 right-0 bottom-[calc(64px+52px+32px)] z-30">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-[11px]">
          <div className="flex flex-col items-start gap-[12px] w-full max-w-[366px]">
            {randomPrompts.map((prompt, index) => (
              <PromptPill
                key={index}
                text={prompt}
                onClick={() => handlePromptClick(prompt)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Input Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-[11px]">
          <div
            className="flex items-center gap-3 px-2 py-2 rounded-full"
            style={{
              backgroundColor: "rgba(19, 19, 19, 0.2)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "0.4px solid rgba(253, 253, 253, 0.2)",
              borderLeft: "0.4px solid rgba(253, 253, 253, 0.2)",
              borderRight: "0.4px solid rgba(253, 253, 253, 0.2)",
            }}
          >
            {/* Attach Button */}
            <button
              className="relative flex items-center justify-center w-[32px] h-[32px] rounded-full flex-shrink-0"
              style={{
                backgroundColor: "rgba(253, 253, 253, 0.04)",
              }}
            >
              {/* Gradient border */}
              <div
                className="absolute inset-0 rounded-full p-[0.4px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(119deg, rgba(253,253,253,0.6), rgba(202,202,202,0.6) 57%, rgba(151,151,151,0.6))",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <Image src="/Plus.svg" alt="Attach" width={16} height={16} />
            </button>

            {/* Input Field */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me about your actions items"
              className="flex-1 bg-transparent text-xs text-[#fdfdfdcc] placeholder-[#fdfdfd66] outline-none resize-none overflow-y-auto"
              style={{
                letterSpacing: "1.67%",
                minHeight: "20px",
                maxHeight: "120px",
                lineHeight: "1.5",
              }}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "#E8F401",
              }}
            >
              <Image
                src="/PaperPlaneTilt.svg"
                alt="Send"
                width={14}
                height={14}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed (same as dashboard) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13131333] backdrop-blur-[17.5px] border-t-[0.4px] border-t-[#fdfdfd33]">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-6 py-3">
          <div className="flex justify-center items-center gap-40">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:opacity-70 transition-opacity opacity-100"
            >
              <Image src="/CirclesFour.svg" alt="Dashboard" width={24} height={24} />
            </button>
            <button className="hover:opacity-70 transition-opacity opacity-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Chat"
              >
                <path
                  d="M11.9998 2.25C10.3065 2.24987 8.64231 2.69074 7.17116 3.52921C5.70002 4.36768 4.4726 5.57483 3.60977 7.03182C2.74693 8.4888 2.27842 10.1454 2.25036 11.8385C2.22231 13.5315 2.63567 15.2027 3.44976 16.6875L2.65289 19.4906C2.57794 19.7486 2.57318 20.0218 2.63911 20.2822C2.70503 20.5426 2.83924 20.7807 3.02789 20.9719C3.21653 21.1614 3.45296 21.2964 3.7121 21.3624C3.97124 21.4284 4.24342 21.4231 4.49976 21.3469L7.31226 20.55C8.61566 21.2644 10.0651 21.6713 11.5499 21.7397C13.0346 21.8081 14.5154 21.5361 15.8789 20.9445C17.2424 20.353 18.4527 19.4575 19.4171 18.3266C20.3816 17.1956 21.0747 15.8592 21.4435 14.4193C21.8123 12.9795 21.847 11.4744 21.5451 10.0191C21.2431 8.56374 20.6124 7.19672 19.7011 6.02249C18.7899 4.84826 17.6223 3.8979 16.2875 3.24406C14.9527 2.59022 13.4861 2.25021 11.9998 2.25ZM7.49976 13.125C7.27726 13.125 7.05975 13.059 6.87475 12.9354C6.68974 12.8118 6.54555 12.6361 6.4604 12.4305C6.37525 12.225 6.35297 11.9988 6.39638 11.7805C6.43979 11.5623 6.54693 11.3618 6.70427 11.2045C6.8616 11.0472 7.06206 10.94 7.28029 10.8966C7.49852 10.8532 7.72472 10.8755 7.93028 10.9606C8.13585 11.0458 8.31155 11.19 8.43517 11.375C8.55878 11.56 8.62476 11.7775 8.62476 12C8.62476 12.2984 8.50624 12.5845 8.29526 12.7955C8.08428 13.0065 7.79813 13.125 7.49976 13.125ZM11.9998 13.125C11.7773 13.125 11.5598 13.059 11.3747 12.9354C11.1897 12.8118 11.0455 12.6361 10.9604 12.4305C10.8753 12.225 10.853 11.9988 10.8964 11.7805C10.9398 11.5623 11.0469 11.3618 11.2043 11.2045C11.3616 11.0472 11.5621 10.94 11.7803 10.8966C11.9985 10.8532 12.2247 10.8755 12.4303 10.9606C12.6358 11.0458 12.8115 11.19 12.9352 11.375C13.0588 11.56 13.1248 11.7775 13.1248 12C13.1248 12.2984 13.0062 12.5845 12.7953 12.7955C12.5843 13.0065 12.2981 13.125 11.9998 13.125ZM16.4998 13.125C16.2773 13.125 16.0598 13.059 15.8747 12.9354C15.6897 12.8118 15.5455 12.6361 15.4604 12.4305C15.3753 12.225 15.353 11.9988 15.3964 11.7805C15.4398 11.5623 15.5469 11.3618 15.7043 11.2045C15.8616 11.0472 16.0621 10.94 16.2803 10.8966C16.4985 10.8532 16.7247 10.8755 16.9303 10.9606C17.1358 11.0458 17.3115 11.19 17.4352 11.375C17.5588 11.56 17.6248 11.7775 17.6248 12C17.6248 12.2984 17.5062 12.5845 17.2953 12.7955C17.0843 13.0065 16.7981 13.125 16.4998 13.125Z"
                  fill="#E8F401"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
