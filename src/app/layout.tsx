import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { UserProfileProvider } from "@/lib/UserProfileContext";
import type { UserRole } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tectonica.AI — Movement Intelligence",
  description:
    "AI-powered suite of helpers for political and social movement organizing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialProfile: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    role?: UserRole;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", user.id)
        .single();

      initialProfile = {
        userId: user.id,
        fullName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email ||
          "User",
        avatarUrl: profile?.avatar_url || null,
        role: (profile?.role as UserRole) || "member",
      };
    }
  } catch {
    // Not authenticated or DB error — leave initialProfile null
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <UserProfileProvider initialProfile={initialProfile}>
          {children}
        </UserProfileProvider>
      </body>
    </html>
  );
}
