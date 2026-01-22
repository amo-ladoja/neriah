"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Step = {
  id: number;
  label: string;
  status: "pending" | "loading" | "completed";
};

export default function ExtractingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [allComplete, setAllComplete] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const router = useRouter();

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: "Getting your\ncredentials", status: "loading" },
    { id: 2, label: "Setting up\nyour space", status: "pending" },
    { id: 3, label: "Eliminating\nthe noise", status: "pending" },
    { id: 4, label: "Fetching\nattachments", status: "pending" },
  ]);

  useEffect(() => {
    // Start actual extraction
    const startExtraction = async () => {
      try {
        const response = await fetch("/api/extract/initial", {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Extraction failed");
        }

        console.log("[Extracting] Extraction complete:", data);
      } catch (error) {
        console.error("[Extracting] Extraction error:", error);
        setExtractionError(error instanceof Error ? error.message : "Unknown error");
      }
    };

    startExtraction();

    // Animate steps sequentially
    const stepDurations = [2000, 2500, 2000, 2500]; // Duration for each step in ms
    let totalTime = 0;

    stepDurations.forEach((duration, index) => {
      // Mark step as completed
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => {
            if (i === index) return { ...step, status: "completed" };
            if (i === index + 1) return { ...step, status: "loading" };
            return step;
          })
        );
        setCurrentStep(index + 1);
      }, totalTime + duration);

      totalTime += duration;
    });

    // All steps complete
    setTimeout(() => {
      setAllComplete(true);
    }, totalTime + stepDurations[stepDurations.length - 1]);
  }, []);

  const handleGetStarted = () => {
    if (allComplete && !extractionError) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative h-screen bg-060606-100 overflow-hidden fixed inset-0">
      {/* Noise Texture Background */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-noise"></div>

      {/* Yellow Blur Effect - Bottom Right */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-e8f401-100 rounded-full blur-[200px] opacity-20"></div>

      {/* 3D Mark - Faded Background (centered) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none -translate-y-4">
        <Image
          src="/3d_markk.svg"
          alt="Background"
          width={400}
          height={400}
          className="w-[280px] md:w-[360px] h-auto"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-between h-screen px-6 py-8 md:py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mt-4 mb-16 md:mb-24 -translate-y-2.5">
          <Image
            src="/neriah-white.svg"
            alt="Neriah"
            width={280}
            height={60}
            className="w-auto h-12 md:h-14"
            priority
          />
        </div>

        {/* Main Content - Steps */}
        <div className="flex flex-col items-center justify-center flex-1 -translate-y-[22px] -translate-x-[30px]">
          <div className="space-y-4 md:space-y-5">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-4">
                {/* Loader Circle */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
                  {/* Background Circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42.5"
                      fill="none"
                      stroke="rgba(253, 253, 253, 0.2)"
                      strokeWidth="15"
                    />
                  </svg>

                  {/* Progress Circle - fills as step completes */}
                  {(step.status === "loading" || step.status === "completed") && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42.5"
                        fill="none"
                        stroke="#E8F401"
                        strokeWidth="15"
                        strokeDasharray="267"
                        strokeDashoffset={step.status === "completed" ? "0" : "67"}
                        className={step.status === "loading" ? "transition-all duration-2000 ease-linear" : ""}
                        style={{
                          strokeDashoffset: step.status === "loading" ? "0" : step.status === "completed" ? "0" : "267"
                        }}
                      />
                    </svg>
                  )}
                </div>

                {/* Step Label */}
                <div className="text-left">
                  <p
                    className={`text-base md:text-lg font-semibold whitespace-pre-line leading-[1.275] ${
                      step.status === "loading" || step.status === "completed"
                        ? "text-fdfdfd-100"
                        : "text-fdfdfd-40"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="mb-6 w-full max-w-md">
          {extractionError ? (
            <div className="text-center mb-4">
              <p className="text-destructive text-sm mb-4">{extractionError}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-4 py-2 md:px-12 md:py-5 rounded-[26px] md:rounded-[29px] text-base md:text-lg font-semibold transition-all duration-300 bg-e8f401-100 text-060606-100 hover:bg-e8f401-100/90"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={handleGetStarted}
              disabled={!allComplete}
              className={`w-full px-4 py-2 md:px-12 md:py-5 rounded-[26px] md:rounded-[29px] text-base md:text-lg font-semibold transition-all duration-300 ${
                allComplete
                  ? "bg-e8f401-100 text-060606-100 hover:bg-e8f401-100/90 cursor-pointer"
                  : "bg-e8f401-100 text-060606-100 cursor-not-allowed opacity-50"
              }`}
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
