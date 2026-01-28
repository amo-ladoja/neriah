"use client";

import { signInWithGoogle } from "@/lib/actions/auth";
import { useState } from "react";
import Image from "next/image";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-060606-100 overflow-hidden">
      {/* Noise Texture Background */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-noise"></div>

      {/* Dark Blur Effect (060606) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-060606-100 rounded-full blur-[150px] opacity-50"></div>

      {/* Yellow Blur Effect (E8F401) - Bottom Right */}
      <div className="absolute bottom-0 right-0 w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-e8f401-100 rounded-full blur-[200px] opacity-20"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Hero Content */}
        <div className="flex flex-col items-center flex-1 justify-center max-w-md md:max-w-lg mb-2 md:mb-4">
          {/* 3D Mark */}
          <div className="relative mb-8 sm:mb-12 md:mb-16">
            <Image
              src="/3d-mark.svg"
              alt="Neriah Mark"
              width={320}
              height={320}
              className="w-[65vw] sm:w-[50vw] md:w-[360px] max-w-[360px] h-auto"
              priority
            />
          </div>

          {/* Tagline */}
          <h1 className="text-fdfdfd-100 text-center text-[11px] sm:text-[13px] md:text-[17px] font-semibold tracking-[0.25em] sm:tracking-[0.3em] mb-12 sm:mb-16 md:mb-20 leading-relaxed">
            INFORMATION DELIVERED<br />THE RIGHT WAY
          </h1>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="group relative px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-full border border-fdfdfd-40 bg-fdfdfd-12 text-fdfdfd-100 font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 hover:border-fdfdfd-60 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(253,253,253,0.1)] hover:shadow-[0_0_30px_rgba(253,253,253,0.2)]"
          >
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in with Google</span>
                  <Image
                    src="/google-icon-logo-svgrepo-com.svg"
                    alt="Google"
                    width={14}
                    height={14}
                    className="w-[20px] h-[20px]"
                  />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mb-6">
          <button
            className="text-fdfdfd-60 text-[12px] md:text-[12px] font-medium tracking-[0.3em] hover:text-fdfdfd-100 transition-colors uppercase cursor-pointer"
            onClick={() => {
              // TODO: Open privacy policy modal/page
              console.log("Privacy notice clicked");
            }}
          >
            USER PRIVACY NOTICE
          </button>
        </div>
      </div>
    </div>
  );
}
