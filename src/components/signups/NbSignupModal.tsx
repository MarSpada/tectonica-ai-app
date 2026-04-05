"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants/roles";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime, isUrgent } from "@/lib/signup-utils";
import type { NbSignup, Member, SignupAssignment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";

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
    (m) => m.role !== ROLES.SUPPORTER
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Avatar + Name header */}
        <div className="flex flex-col items-center pt-8 px-6 pb-4">
          <div
            className={`w-20 h-20 rounded-full ${getAvatarColor(signup.id)} flex items-center justify-center text-2xl font-bold text-white`}
          >
            {getInitials(signup.name)}
          </div>

          <DialogHeader className="items-center mt-3">
            <DialogTitle className="text-lg">{signup.name}</DialogTitle>
          </DialogHeader>

          <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 border-blue-200 border">
            <img src="/nb-icon.png" alt="" className="w-4 h-4" />
            via NationBuilder
          </Badge>

          <span
            className={`mt-2 text-xs ${
              time.urgent ? "font-semibold text-red-500" : "text-muted-foreground"
            }`}
          >
            {time.text}
          </span>
        </div>

        {/* Urgency banner */}
        {urgent && (
          <div className="mx-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <div className="flex items-start gap-2">
              <Icon name="warning" size={18} className="mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Contact them in the next 24 hours or assign to another member
                for better results.
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Info rows */}
        <div className="space-y-3 px-6 py-4">
          {signup.email && (
            <div className="flex items-center gap-3">
              <Icon name="email-action" size={18} className="opacity-60" />
              <span className="text-sm text-secondary-foreground">
                {signup.email}
              </span>
            </div>
          )}
          {signup.phone ? (
            <div className="flex items-center gap-3">
              <Icon name="phone-call" size={18} className="opacity-60" />
              <span className="text-sm text-secondary-foreground">
                {signup.phone}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Icon name="phone-call" size={18} className="opacity-60" />
              <span className="text-sm text-muted-foreground italic">
                No phone available
              </span>
            </div>
          )}
          {assignment && (
            <div className="flex items-center gap-3">
              <Icon name="members" size={18} className="opacity-60" />
              <span className="text-sm text-secondary-foreground">
                Assigned to{" "}
                <strong>{assignment.assignee_name}</strong>
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Action buttons + Assign */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex gap-3">
            {signup.email && (
              <Button
                className="flex-1"
                render={<a href={`mailto:${signup.email}`} />}
              >
                <Icon name="email-action" size={16} />
                Contact
              </Button>
            )}
            {signup.phone ? (
              <Button
                variant="outline"
                className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
                render={<a href={`tel:${signup.phone}`} />}
              >
                <Icon name="phone-call" size={16} />
                Call
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                disabled
              >
                <Icon name="phone-call" size={16} />
                Call
              </Button>
            )}
          </div>

          {/* Assign section */}
          {!showAssignDropdown ? (
            <Button
              variant="outline"
              onClick={() => setShowAssignDropdown(true)}
              className="w-full text-primary border-primary/30 hover:bg-primary/5"
            >
              <Icon name="person-add" size={16} />
              {assignment ? "Reassign to Another Person" : "Assign to a Person"}
            </Button>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Select a member
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowAssignDropdown(false)}
                >
                  Cancel
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {assignableMembers.map((m) => (
                  <button
                    key={m.id}
                    disabled={isAssigning}
                    onClick={() => handleAssign(m.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-primary/5 transition-colors disabled:opacity-50 text-left"
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
                      <span className="text-xs font-medium text-foreground block truncate">
                        {m.full_name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {m.role}
                      </span>
                    </div>
                    {assignment?.assigned_to === m.id && (
                      <Badge variant="secondary" className="bg-green-50 text-green-600 text-[10px]">
                        Current
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
