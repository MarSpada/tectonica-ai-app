import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { UserProfileProvider } from "@/lib/UserProfileContext";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    orgName?: string;
    groupName?: string;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, org_id, group_id")
        .eq("id", user.id)
        .single();

      let orgName: string | undefined;
      let groupName: string | undefined;

      if (profile?.org_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.org_id)
          .single();
        orgName = org?.name || undefined;
      }

      if (profile?.group_id) {
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", profile.group_id)
          .single();
        groupName = group?.name || undefined;
      }

      initialProfile = {
        userId: user.id,
        fullName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email ||
          "User",
        avatarUrl: profile?.avatar_url || null,
        role: (profile?.role as UserRole) || "member",
        orgName,
        groupName,
      };
    }
  } catch {
    // Not authenticated or DB error — leave initialProfile null
  }

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head />
      <body className={`${inter.variable} antialiased`}>
        <UserProfileProvider initialProfile={initialProfile}>
          {children}
          <Toaster position="bottom-right" />
        </UserProfileProvider>
      </body>
    </html>
  );
}
