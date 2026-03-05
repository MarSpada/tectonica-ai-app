"use client";

import { useState } from "react";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime, isUrgent } from "@/lib/signup-utils";
import type { NbSignup, Member, SignupAssignment } from "@/lib/types";

interface NbSignupModalProps {
  signup: NbSignup | null;
  assignment: SignupAssignment | null;
  members: Member[];
  onClose: () => void;
  onAssigned: (assignment: SignupAssignment) => void;
}

export default function NbSignupModal({
  signup,
  assignment,
  members,
  onClose,
  onAssigned,
}: NbSignupModalProps) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  if (!signup) return null;

  const time = formatSignupTime(signup.created_at);
  const urgent = isUrgent(signup.created_at);
  const assignableMembers = members.filter(
    (m) => ["admin", "organizer", "leader", "member"].includes(m.role)
  );

  async function handleAssign(memberId: string) {
    if (!signup) return;
    setIsAssigning(true);
    try {
      const res = await fetch("/api/signups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nbSignupId: signup.id,
          nbSignupName: signup.name,
          nbSignupEmail: signup.email,
          nbSignupPhone: signup.phone,
          nbSignupCreatedAt: signup.created_at,
          assignToUserId: memberId,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        onAssigned({
          id: json.assignmentId,
          nb_signup_id: signup.id,
          nb_signup_name: signup.name,
          assigned_to: memberId,
          assigned_by: "",
          status: "pending",
          created_at: new Date().toISOString(),
          assignee_name: json.assigneeName || "Team member",
        });
        setShowAssignDropdown(false);
      }
    } catch {
      // Assignment failed silently
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card-bg rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <span className="material-icons-two-tone text-[20px] text-text-muted">
            close
          </span>
        </button>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-4">
          <div
            className={`w-20 h-20 rounded-full ${getAvatarColor(signup.id)} flex items-center justify-center text-2xl font-bold text-white`}
          >
            {getInitials(signup.name)}
          </div>

          <h2 className="mt-3 text-lg font-bold text-text-primary">
            {signup.name}
          </h2>

          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            <img src="/nb-icon.png" alt="" className="w-4 h-4" />
            via NationBuilder
          </span>

          <span
            className={`mt-2 text-xs ${
              time.urgent ? "font-semibold text-red-500" : "text-text-muted"
            }`}
          >
            {time.text}
          </span>
        </div>

        {/* Urgency banner */}
        {urgent && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="material-icons-two-tone text-[18px] text-amber-600 mt-0.5">
                warning
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Contact them in the next 24 hours or assign to another member
                for better results.
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-black/5 my-4" />

        {/* Info rows */}
        <div className="space-y-3">
          {signup.email && (
            <div className="flex items-center gap-3">
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                mail
              </span>
              <span className="text-sm text-text-secondary">
                {signup.email}
              </span>
            </div>
          )}
          {signup.phone ? (
            <div className="flex items-center gap-3">
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                phone
              </span>
              <span className="text-sm text-text-secondary">
                {signup.phone}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                phone
              </span>
              <span className="text-sm text-text-muted italic">
                No phone available
              </span>
            </div>
          )}
          {assignment && (
            <div className="flex items-center gap-3">
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                person
              </span>
              <span className="text-sm text-text-secondary">
                Assigned to{" "}
                <strong>{assignment.assignee_name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/5 my-4" />

        {/* Action buttons */}
        <div className="flex gap-3">
          {signup.email && (
            <a
              href={`mailto:${signup.email}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent-purple rounded-xl hover:bg-purple-700 transition-colors"
            >
              <span className="material-icons-two-tone text-[16px]">mail</span>
              Contact
            </a>
          )}
          <a
            href={signup.phone ? `tel:${signup.phone}` : undefined}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              signup.phone
                ? "text-white bg-green-500 hover:bg-green-600 cursor-pointer"
                : "text-text-muted bg-black/5 cursor-not-allowed"
            }`}
            onClick={(e) => !signup.phone && e.preventDefault()}
          >
            <span className="material-icons-two-tone text-[16px]">call</span>
            Call
          </a>
        </div>

        {/* Assign section */}
        <div className="mt-4">
          {!showAssignDropdown ? (
            <button
              onClick={() => setShowAssignDropdown(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-accent-purple border border-accent-purple/30 rounded-xl hover:bg-accent-purple/5 transition-colors"
            >
              <span className="material-icons-two-tone text-[16px]">
                person_add
              </span>
              {assignment ? "Reassign to Another Person" : "Assign to a Person"}
            </button>
          ) : (
            <div className="border border-black/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-black/[0.02] border-b border-black/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Select a member
                </span>
                <button
                  onClick={() => setShowAssignDropdown(false)}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {assignableMembers.map((m) => (
                  <button
                    key={m.id}
                    disabled={isAssigning}
                    onClick={() => handleAssign(m.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent-purple/5 transition-colors disabled:opacity-50 text-left"
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.full_name || ""}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full ${getAvatarColor(m.id)} flex items-center justify-center text-[10px] font-bold text-white`}
                      >
                        {getInitials(m.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-text-primary block truncate">
                        {m.full_name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-text-muted capitalize">
                        {m.role}
                      </span>
                    </div>
                    {assignment?.assigned_to === m.id && (
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
