import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error("[Auth Callback] OAuth error:", error);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(
        "Authentication failed. Please try again."
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { error: exchangeError, data } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Error exchanging code:", exchangeError);
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(
          "Failed to complete sign in. Please try again."
        )}`
      );
    }

    // Get user data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[Auth Callback] Error getting user:", userError);
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent("Failed to get user data.")}`
      );
    }

    console.log("[Auth Callback] User authenticated:", user.email);

    // Check if this is a new user (first sign-in)
    const { data: profile } = await supabase
      .from("profiles")
      .select("initial_extraction_completed")
      .eq("id", user.id)
      .single();

    // Store Gmail tokens in profile
    // The provider_token is the access token from Google
    const providerToken = data.session?.provider_token;
    const providerRefreshToken = data.session?.provider_refresh_token;

    if (providerToken) {
      await supabase
        .from("profiles")
        .update({
          gmail_access_token: providerToken,
          gmail_refresh_token: providerRefreshToken,
          gmail_token_expires_at: new Date(
            Date.now() + 3600 * 1000
          ).toISOString(), // 1 hour from now
        })
        .eq("id", user.id);

      console.log("[Auth Callback] Gmail tokens stored for user:", user.email);
    }

    // Redirect based on whether initial extraction has been completed
    if (!profile?.initial_extraction_completed) {
      console.log(
        "[Auth Callback] New user - redirecting to extraction page"
      );
      // New user - redirect to extraction page
      return NextResponse.redirect(`${origin}/extracting`);
    } else {
      console.log(
        "[Auth Callback] Existing user - redirecting to dashboard"
      );
      // Existing user - go straight to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // No code provided - redirect to home
  return NextResponse.redirect(origin);
}
