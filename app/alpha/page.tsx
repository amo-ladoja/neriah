"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const carouselData = [
  { id: 0, tab: "Smart Extraction", image: "/smart_extraction.png" },
  { id: 1, tab: "One-Tap Actions", image: "/one_tap_action.png" },
  { id: 2, tab: "Receipt Intelligence", image: "/receipt_intelligence.png" },
  { id: 3, tab: "Ask your Inbox", image: "/ask_your_inbox.png" },
];

export default function AlphaLandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bottomEmail, setBottomEmail] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % carouselData.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll to active slide and tab
  useEffect(() => {
    // Scroll carousel
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: activeTab * slideWidth,
        behavior: "smooth",
      });
    }

    // Scroll tabs to show active tab
    if (tabsRef.current && tabRefs.current[activeTab]) {
      const tab = tabRefs.current[activeTab];
      const container = tabsRef.current;
      if (tab) {
        const tabLeft = tab.offsetLeft;
        const tabWidth = tab.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth",
        });
      }
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent, emailValue: string) => {
    e.preventDefault();
    if (!emailValue.trim()) return;

    setIsSubmitting(true);
    // TODO: Implement actual email submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
    setEmail("");
    setBottomEmail("");
  };

  return (
    <div className="relative min-h-screen bg-[#131313] overflow-x-hidden">
      {/* Dithered Dot Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(253,253,253,0.3) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Dithered Background Effect - Hero */}
      <div
        className="absolute top-0 left-0 right-0 h-[800px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(232,244,1,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4">
        {/* Header */}
        <header className="flex items-center justify-between pt-6 pb-4">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={100}
            height={28}
            className="h-[28px] w-auto"
          />
          <button className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(253,253,253,0.8)"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Dropdown Menu - Disabled for now
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center justify-center p-[9.984px] rounded-full bg-[#fdfdfd1f] backdrop-blur-[11.375px] border-[1.2px] border-[#fdfdfd33] hover:bg-[#fdfdfd26] transition-all shadow-[0_0_8px_rgba(253,253,253,0.3)]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(253,253,253,0.8)"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 z-50 mt-[8px] flex flex-col gap-[24px] px-[24px] py-[24px] rounded-2xl border-[0.4px] border-[#fdfdfd33]"
                  style={{
                    backgroundColor: "rgba(30, 30, 30, 0.8)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push("/alpha/terms");
                    }}
                    className="flex items-center gap-[16px] text-[16px] text-[#fdfdfdcc] hover:text-[#fdfdfd] transition-colors"
                  >
                    <Image src="/terms_service.svg" alt="Terms" width={20} height={20} />
                    <span>Terms of Service</span>
                  </button>
                </div>
              </>
            )}
          </div>
          */}
        </header>

        {/* Hero Section */}
        <section className="relative flex flex-col items-center pt-4">
          {/* Mobile Mockup with 3D elements */}
          <div className="relative w-full flex items-center justify-center mb-2">
            {/* 3D Thumbs Up - Left, on top of phone */}
            <div className="absolute left-[13px] top-[calc(15%-16px)] z-10">
              <Image
                src="/3d_thumbs_up.png"
                alt=""
                width={96}
                height={96}
                className="w-[77px] h-[77px] md:w-[96px] md:h-[96px]"
              />
            </div>

            {/* Mobile Mock - Center with fade */}
            <div
              className="relative z-0"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 50%, transparent 95%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 50%, transparent 95%)",
              }}
            >
              <Image
                src="/mobile_mock.png"
                alt="Neriah App"
                width={280}
                height={560}
                className="w-[220px] md:w-[260px] h-auto"
                priority
              />
            </div>

            {/* 3D Logo - Right, on top of phone */}
            <div className="absolute right-[8px] bottom-[calc(35%-64px)] z-10">
              <Image
                src="/3d_neriah_logo.png"
                alt=""
                width={100}
                height={100}
                className="w-[96px] h-[96px] md:w-[100px] md:h-[100px]"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-[28px] md:text-[32px] font-semibold text-[#fdfdfdcc] leading-tight tracking-tight">
            Your emails,
            <br />
            turned to <span className="italic text-[#E8F401]">actions</span>
          </h1>

          {/* Subtext */}
          <p className="text-center text-[14px] text-[#fdfdfd99] leading-relaxed mt-2 max-w-[320px]">
            We extracts what matters from your inbox; tasks, receipts, meetings,
            all ready for one tap actions.
          </p>

          {/* Email Input & CTA */}
          <form
            onSubmit={(e) => handleSubmit(e, email)}
            className="w-full mt-6 flex flex-col gap-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3 py-3 rounded-full bg-[#fdfdfd0a] border border-[#fdfdfd33] text-[#fdfdfdcc] text-[14px] placeholder-[#fdfdfd66] focus:outline-none focus:border-[#fdfdfd66] transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || submitted}
              className="w-fit px-20 py-2 mx-auto rounded-full bg-[#E8F401] text-[#131313] font-semibold text-[14px] hover:bg-[#E8F401]/90 transition-colors disabled:opacity-70"
            >
              {submitted ? "You're on the list!" : isSubmitting ? "Joining..." : "Join the Alpha"}
            </button>
          </form>

          {/* Footer text */}
          <p className="text-center text-[12px] text-[#fdfdfd66] mt-2">
            Free early access. Shape the product.
          </p>
        </section>

        {/* Carousel Section */}
        <section className="relative mt-16 bg-[#131313] -mx-4 px-4 py-8">
          {/* Carousel Tabs */}
          <div
            ref={tabsRef}
            className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
          >
            {carouselData.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                onClick={() => setActiveTab(index)}
                className={`whitespace-nowrap text-[12px] font-medium transition-colors ${
                  activeTab === index
                    ? "text-[#fdfdfdcc]"
                    : "text-[#fdfdfd4d]"
                }`}
              >
                {index + 1}. {item.tab}
              </button>
            ))}
          </div>

          {/* Carousel Content */}
          <div
            ref={carouselRef}
            className="mt-6 flex overflow-x-hidden scroll-smooth rounded-xl"
          >
            {carouselData.map((item) => (
              <div key={item.id} className="w-full flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.tab}
                  width={400}
                  height={300}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="relative mt-20 pb-8">
  
          <div className="relative flex flex-col items-center">
            {/* Heading */}
            <h2 className="text-center text-[24px] md:text-[28px] font-semibold text-[#fdfdfdcc] leading-tight">
              Help us build it
            </h2>

            {/* Subtext */}
            <p className="text-center text-[14px] text-[#fdfdfd99] leading-relaxed mt-3 max-w-[320px]">
              We&apos;re opening Neriah to a small group of early users. Your
              feedback shapes what we build next.
            </p>

            {/* Email Input & CTA */}
            <form
              onSubmit={(e) => handleSubmit(e, bottomEmail)}
              className="w-full mt-6 flex flex-col gap-3"
            >
              <input
                type="email"
                value={bottomEmail}
                onChange={(e) => setBottomEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-3 rounded-full bg-[#fdfdfd0a] border border-[#fdfdfd33] text-[#fdfdfdcc] text-[14px] placeholder-[#fdfdfd66] focus:outline-none focus:border-[#fdfdfd66] transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmitting || submitted}
                className="w-fit px-16 py-2 mx-auto rounded-full bg-[#E8F401] text-[#131313] font-semibold text-[14px] hover:bg-[#E8F401]/90 transition-colors disabled:opacity-70"
              >
                {submitted ? "You're on the list!" : isSubmitting ? "Requesting..." : "Request Early Access"}
              </button>
            </form>

            {/* Footer text */}
            <p className="text-center text-[12px] text-[#fdfdfd66] mt-3">
              Free during alpha. No credit card required.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center py-12 mt-8 border-t border-[#fdfdfd1a]">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={125}
            height={35}
            className="h-[35px] w-auto mb-4"
          />
          <button
            onClick={() => router.push("/alpha/terms")}
            className="text-[12px] text-[#E8F401] hover:text-[#E8F401]/80 transition-colors mb-2"
          >
            Terms of Service
          </button>
          <p className="text-[12px] text-[#fdfdfd66]">
            Neriah © 2026. All Rights Reserved
          </p>
        </footer>
      </div>

      {/* Global styles for no-scrollbar */}
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
