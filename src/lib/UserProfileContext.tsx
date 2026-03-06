"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface UserProfile {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role?: string;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: UserProfile | null;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    return { profile: null, updateProfile: () => {} };
  }
  return ctx;
}
