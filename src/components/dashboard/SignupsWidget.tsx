"use client";

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

export default function SignupsWidget({ signups, nbStatus, assignments, onSignupClick }: SignupsWidgetProps) {
  function getAssignment(signupId: string): SignupAssignment | null {
    return assignments.find((a) => a.nb_signup_id === signupId) || null;
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-3">New Sign-Ups</h3>
      <div className="space-y-2.5">
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
          signups.map((s) => {
            const time = formatSignupTime(s.created_at);
            const assignment = getAssignment(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onSignupClick(s)}
                className="w-full flex items-center justify-between hover:bg-amber-100/50 rounded-lg px-2 -mx-2 py-1.5 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full shrink-0 ${getAvatarColor(s.id)} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {getInitials(s.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{s.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                        <img src="/nb-icon.png" alt="" className="w-4 h-4" />
                        via NB
                      </span>
                    </div>
                    {assignment && (
                      <span className="text-xs text-text-muted block truncate">
                        Assigned to {assignment.assignee_name}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs shrink-0 ml-2 ${
                    time.urgent ? "font-semibold text-red-500" : "text-text-muted"
                  }`}
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
        <p className="text-xs text-text-muted mt-3">
          Click a sign-up to view details and assign to a team member.
        </p>
      )}
    </div>
  );
}
