import { Button } from "@/components/ui/button";
import { Mail, Zap, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Neriah
            </h1>
          </div>

          {/* Hero Copy */}
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Your emails, turned into actions
          </h2>

          <p className="text-xl text-muted-foreground mb-12">
            Sign in with Google. See what needs your attention. Act.
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            className="tap-target px-8 py-6 text-lg bg-primary hover:bg-primary/90"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Free to try. No credit card required.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">One-step setup</h3>
            <p className="text-muted-foreground">
              Sign in with Google. That's it. No complex configuration.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant value</h3>
            <p className="text-muted-foreground">
              See your actionable items within 60 seconds of signing up.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">One-tap actions</h3>
            <p className="text-muted-foreground">
              Reply, view receipts, schedule meetings - all one tap away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
