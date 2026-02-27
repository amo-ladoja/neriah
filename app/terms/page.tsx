"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

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

      {/* Background Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(232,244,1,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 pb-12">
        {/* Header */}
        <header className="flex items-center justify-between pt-6 pb-8">
          <button
            onClick={() => router.back()}
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={100}
            height={28}
            className="h-[28px] w-auto"
          />
          <div className="w-[38px]" /> {/* Spacer for centering */}
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/terms_service.svg"
              alt="Terms"
              width={24}
              height={24}
            />
            <h1 className="text-[24px] font-semibold text-[#fdfdfdcc]">
              Terms of Service
            </h1>
          </div>

          <p className="text-[12px] text-[#fdfdfd66]">
            Effective Date: January 17, 2026
          </p>

          <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your use of Neriah (&quot;Service&quot;), operated by Neriah Inc. (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;). By using Neriah, you agree to these Terms.
          </p>

          {/* Section 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">1. Service Description</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              Neriah connects to your Gmail account to extract actionable items (tasks, receipts, meetings) using AI and displays them in a dashboard. You can query your data, get spending insights, and draft responses via our chat interface.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">2. Eligibility</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              You must be at least 18 years old and capable of forming a binding contract. By using Neriah, you represent that you meet these requirements.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">3. Account & Access</h2>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>You must sign in with a valid Google account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not share your account or use another person&apos;s account</li>
              <li>We may suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">4. Acceptable Use</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed mb-1">You agree <strong>not</strong> to:</p>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Use the Service to send spam or malicious content</li>
              <li>Interfere with other users&apos; access to the Service</li>
              <li>Use automated tools to access the Service (except as we provide)</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">5. Gmail & Google Data</h2>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>We access Gmail via Google OAuth with read-only permissions</li>
              <li>We only read email metadata and content to extract actionable items</li>
              <li>We do not store full email content—only extracted metadata</li>
              <li>You can revoke access anytime via Google Account settings or our Settings page</li>
              <li>Our use of Google data complies with Google API Services User Data Policy</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">6. AI-Generated Content</h2>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>Our Service uses AI (Claude by Anthropic) to extract items and generate drafts</li>
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>You are responsible for reviewing all AI-generated content before use</li>
              <li>We do not guarantee the accuracy, completeness, or fitness of AI outputs</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">7. Subscription & Billing</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              <strong>Free Plan:</strong> Limited features, usage caps apply
            </p>
          </section>

          {/* Section 8 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">8. Intellectual Property</h2>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>Neriah and its content, features, and functionality are owned by Neriah.</li>
              <li>You retain ownership of your data (emails, extracted items, feedback)</li>
              <li>You grant us a limited license to process your data to provide the Service.</li>
              <li>You may not copy, modify, or distribute our Service without permission</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">9. Privacy</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              Your privacy matters. Our use of your data is governed by our Privacy Policy, which explains what data we collect, how we use it, and your rights (access, export, deletion).
            </p>
          </section>

          {/* Section 10 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">10. Disclaimers</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed uppercase text-[12px]">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed mt-2">We do not warrant that:</p>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>The Service will be uninterrupted or error-free</li>
              <li>AI extractions or calculations will be accurate</li>
              <li>The Service will meet your specific requirements</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">11. Limitation of Liability</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed uppercase text-[12px]">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NERIAH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
            </p>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed mt-2">
              Our total liability shall be zero at any point in time.
            </p>
          </section>

          {/* Section 12 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">12. Indemnification</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              You agree to indemnify and hold harmless Neriah from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          {/* Section 13 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">13. Changes to Terms</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes via email or in-app notice at least 30 days before they take effect. Continued use after changes constitutes acceptance.
            </p>
          </section>

          {/* Section 14 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">14. Termination</h2>
            <ul className="text-[14px] text-[#fdfdfd99] leading-relaxed list-disc list-inside space-y-1">
              <li>You may stop using the Service and delete your account anytime</li>
              <li>We may terminate or suspend your access for violation of these Terms</li>
              <li>Upon termination, your right to use the Service ceases immediately</li>
              <li>Sections 6, 8, 10, 11, 12, and 15 survive termination</li>
            </ul>
          </section>

          {/* Section 15 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">15. Governing Law & Disputes</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              These Terms are governed by the laws of the State of Delaware, USA. Any disputes shall be resolved through binding arbitration in accordance with the AAA rules, except that either party may seek injunctive relief in court.
            </p>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed mt-2">
              <strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive any right to participate in class actions.
            </p>
          </section>

          {/* Section 16 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold text-[#fdfdfdcc]">16. Contact</h2>
            <p className="text-[14px] text-[#fdfdfd99] leading-relaxed">
              Questions about these Terms? Contact us:
            </p>
            <p className="text-[14px] text-[#E8F401]">
              hello@neriah.xyz
            </p>
          </section>

          {/* Last Updated */}
          <p className="text-[12px] text-[#fdfdfd66] italic mt-4">
            Last updated: January 17, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
