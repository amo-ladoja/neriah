"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Sign in with Google OAuth
 * Requests Gmail read permissions for email extraction
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      scopes: "https://www.googleapis.com/auth/gmail.readonly",
      queryParams: {
        access_type: "offline", // Request refresh token
        prompt: "consent", // Force consent screen to get refresh token
      },
    },
  });

  if (error) {
    console.error("[Auth] Sign in error:", error);
    throw new Error("Failed to initiate sign in");
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
