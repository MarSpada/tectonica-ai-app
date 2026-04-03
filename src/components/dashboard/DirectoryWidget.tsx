"use client";

import Link from "next/link";
import { getAvatarColor, getInitials, getRoleLabel } from "@/lib/avatar";
import type { Member } from "@/lib/types";

interface DirectoryWidgetProps {
  members: Member[];
}

export default function DirectoryWidget({ members }: DirectoryWidgetProps) {
  const directoryMembers = members.slice(0, 6);

  return (
    <div className="h-full overflow-auto p-6">
      <Link href="/members">
        <h3 className="text-sm font-semibold text-text-primary mb-4 hover:underline cursor-pointer">
          Group Directory
        </h3>
      </Link>
      <div className="space-y-3">
        {directoryMembers.length > 0 ? (
          directoryMembers.map((person) => (
            <Link
              key={person.id}
              href={`/members/${person.id}`}
              className="flex items-center justify-between hover:bg-black/[0.03] -mx-2 px-2 py-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name || ""}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-full ${getAvatarColor(person.id)} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {getInitials(person.full_name)}
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary">
                  {person.full_name || "Unknown"}
                </span>
              </div>
              <span className="text-xs text-text-muted">{getRoleLabel(person.role)}</span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-text-muted">Loading members...</p>
        )}
      </div>
    </div>
  );
}
