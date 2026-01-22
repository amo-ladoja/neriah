"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Sparkles } from "lucide-react";

export default function ExtractingPage() {
  const [itemsFound, setItemsFound] = useState(0);

  useEffect(() => {
    // Simulate finding items during extraction
    const interval = setInterval(() => {
      setItemsFound((prev) => {
        const next = prev + Math.floor(Math.random() * 3) + 1;
        return next > 50 ? 50 : next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4 text-center">
        {/* Animation Container */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Pulsing circle background */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />

            {/* Icon container */}
            <div className="relative bg-primary/10 rounded-full p-8">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-12 h-12 text-primary" />
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Analyzing your inbox...
          </h2>

          <p className="text-muted-foreground">
            Found {itemsFound} items so far
          </p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">
              This usually takes less than 60 seconds
            </span>
          </div>
        </div>

        {/* Tips/Info */}
        <div className="mt-12 text-sm text-muted-foreground space-y-2">
          <p>✨ Extracting tasks and action items</p>
          <p>📄 Finding receipts and invoices</p>
          <p>📅 Identifying meeting requests</p>
        </div>
      </div>
    </div>
  );
}
