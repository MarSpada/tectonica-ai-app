"use client";

import { Icon } from "@/components/ui/icon";

export default function RecruitWidget() {
  return (
    <div className="h-full overflow-auto p-6 flex flex-col items-center justify-center text-center text-text-primary">
      <Icon name="person-add" size={40} className="mb-2" />
      <span className="text-sm font-bold leading-tight uppercase">
        Recruit More People
      </span>
    </div>
  );
}
