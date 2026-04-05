"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import type { NbSignup, SignupAssignment } from "@/lib/types";

interface SignupsWidgetProps {
  signups: NbSignup[];
  nbStatus: "connected" | "error" | "not_configured" | "loading";
  assignments: SignupAssignment[];
  onSignupClick: (signup: NbSignup) => void;
}

const MAX_VISIBLE = 2;

export default function SignupsWidget({ signups, nbStatus, assignments, onSignupClick }: SignupsWidgetProps) {
  function getAssignment(signupId: string): SignupAssignment | null {
    return assignments.find((a) => a.nb_signup_id === signupId) || null;
  }

  return (
    <div className="h-full overflow-auto p-5 flex flex-col">
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>New Sign-Ups</h3>
      <div className="space-y-2.5 flex-1">
        {nbStatus === "loading" ? (
          <div className="flex items-center gap-2">
            <Icon name="loading" size={16} className="animate-spin opacity-60" />
            <p className="text-sm text-text-muted">Loading...</p>
          </div>
        ) : nbStatus === "error" ? (
          <div className="flex items-center gap-2">
            <Icon name="warning" size={16} />
            <p className="text-sm text-orange-600 font-medium">Error connecting with source</p>
          </div>
        ) : nbStatus === "not_configured" ? (
          <p className="text-sm text-text-muted">No source connected</p>
        ) : signups.length > 0 ? (
          signups.slice(0, MAX_VISIBLE).map((s) => {
            const time = formatSignupTime(s.created_at);
            const assignment = getAssignment(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onSignupClick(s)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer text-left hover:opacity-80"
                style={{ backgroundColor: "var(--widget-list-item-bg)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full shrink-0 ${getAvatarColor(s.id)} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {getInitials(s.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-color)" }}>{s.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                        <img src="/nb-icon.png" alt="" className="w-4 h-4" />
                        via NB
                      </span>
                    </div>
                    {assignment && (
                      <span className="block truncate font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>
                        Assigned to {assignment.assignee_name}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 font-medium ${
                    time.urgent ? "font-semibold text-red-500" : ""
                  }`}
                  style={{ fontSize: "var(--widget-list-secondary-size)", color: time.urgent ? undefined : "var(--widget-text-muted)" }}
                >
                  {time.text}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-text-muted">No recent sign-ups</p>
        )}
      </div>
      {signups.length > 0 && (
        <Link
          href="/signups"
          className="widget-cta-btn w-full rounded-sm text-white font-semibold cursor-pointer mt-3 block text-center"
          style={{ backgroundColor: "#c66a0c", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
        >
          See all the {signups.length} new signups
        </Link>
      )}
    </div>
  );
}
