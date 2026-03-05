"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import TopBar from "./TopBar";
import LeftSidebar from "./LeftSidebar";

interface AppShellProps {
  userName: string;
  children: React.ReactNode;
}

export default function AppShell({ userName, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDrawerMode = useMediaQuery("(max-width: 699px)");

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        onToggleSidebar={
          isDrawerMode ? () => setSidebarOpen((prev) => !prev) : undefined
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          userName={userName}
          isDrawerOpen={isDrawerMode && sidebarOpen}
          onDrawerClose={() => setSidebarOpen(false)}
        />
        {children}
      </div>
    </div>
  );
}
