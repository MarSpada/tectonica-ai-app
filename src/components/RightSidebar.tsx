"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getInitials, getRoleLabel } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import NbSignupModal from "./signups/NbSignupModal";
import type { Member, GroupMessage, NbSignup, SignupAssignment } from "@/lib/types";

interface RightSidebarProps {
  groupMessages?: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function RightSidebar({ groupMessages = [], onOpenConversation }: RightSidebarProps) {
  const widgetGridRef = useRef<HTMLDivElement>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [signups, setSignups] = useState<NbSignup[]>([]);
  const [assignments, setAssignments] = useState<SignupAssignment[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<NbSignup | null>(null);
  const directoryMembers = allMembers.slice(0, 6);

  const memberCount = allMembers.filter((m) =>
    ["admin", "organizer", "leader", "member"].includes(m.role)
  ).length;
  const supporterCount = allMembers.filter((m) => m.role === "supporter").length;

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_group_members");
      if (data) setAllMembers(data as Member[]);
    }
    async function fetchSignups() {
      try {
        const res = await fetch("/api/nationbuilder/signups");
        const json = await res.json();
        if (json.signups) setSignups(json.signups);
        if (json.assignments) setAssignments(json.assignments);
      } catch {
        // NB unavailable — widget stays empty
      }
    }
    fetchMembers();
    fetchSignups();
  }, []);

  useEffect(() => {
    const el = widgetGridRef.current;
    if (!el) return;

    const children = Array.from(el.children);
    gsap.fromTo(children,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.3, ease: "power2.out" }
    );
  }, []);

  function getAssignment(signupId: string): SignupAssignment | null {
    return assignments.find((a) => a.nb_signup_id === signupId) || null;
  }

  function handleAssigned(newAssignment: SignupAssignment) {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.nb_signup_id !== newAssignment.nb_signup_id);
      return [...filtered, newAssignment];
    });
    setSelectedSignup(null);
  }

  return (
    <aside className="right-sidebar-responsive w-[var(--right-sidebar)] bg-bg border-l border-black/5 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-text-primary mb-4">
        Group Dashboard
      </h2>

      <div
        ref={widgetGridRef}
        className="widget-grid-responsive grid gap-2.5"
        style={{
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(34px, auto)",
        }}
      >
        {/* New Sign-Ups — cols 1-9, rows 1-2 */}
        <div
          className="rounded-xl p-4"
          style={{ gridColumn: "1 / 10", gridRow: "1 / 3", backgroundColor: "#fef3c7" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            New Sign-Ups
          </h3>
          <div className="space-y-2">
            {signups.length > 0 ? (
              signups.map((s) => {
                const time = formatSignupTime(s.created_at);
                const assignment = getAssignment(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSignup(s)}
                    className="w-full flex items-center justify-between hover:bg-amber-100/50 rounded-lg px-1 -mx-1 py-0.5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full shrink-0 ${getAvatarColor(s.id)} flex items-center justify-center text-[11px] font-bold text-white`}
                      >
                        {getInitials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-text-primary truncate">{s.name}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                            <img src="/nb-icon.png" alt="" className="w-4 h-4" />
                            via NB
                          </span>
                        </div>
                        {assignment && (
                          <span className="text-[9px] text-text-muted block truncate">
                            Assigned to {assignment.assignee_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ml-2 ${
                        time.urgent ? "font-semibold text-red-500" : "text-text-muted"
                      }`}
                    >
                      {time.text}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-[10px] text-text-muted">No recent sign-ups</p>
            )}
          </div>
          {signups.length > 0 && (
            <p className="text-[10px] text-text-muted mt-2">
              Click a sign-up to view details and assign to a team member.
            </p>
          )}
        </div>

        {/* Recruit More People — cols 10-12, rows 1-2 */}
        <div
          className="rounded-xl p-3 flex flex-col items-center justify-center text-center text-white"
          style={{ gridColumn: "10 / 13", gridRow: "1 / 3", backgroundColor: "#0EA5E9" }}
        >
          <span className="material-icons-two-tone text-[36px] mb-1">
            person_add
          </span>
          <span className="text-xs font-bold leading-tight uppercase">
            Recruit More People
          </span>
        </div>

        {/* Group Conversations — cols 1-6, rows 3-7 */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ gridColumn: "1 / 7", gridRow: "3 / 8", backgroundColor: "#f5f3ff" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Group Conversations
          </h3>
          <div className="space-y-1.5 flex-1">
            {groupMessages.length > 0 ? (
              groupMessages.slice(-3).map((msg) => (
                <p key={msg.id} className="text-[11px] text-text-primary truncate">
                  <span className="font-semibold text-accent-purple">
                    @{msg.sender_name || "Unknown"}
                  </span>{" "}
                  {msg.content}
                </p>
              ))
            ) : (
              <p className="text-[10px] text-text-muted">No messages yet</p>
            )}
          </div>
          <button
            onClick={onOpenConversation}
            className="mt-auto self-start px-4 py-1.5 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            Open Conversation
          </button>
        </div>

        {/* Group Actions — cols 7-12, rows 3-7 */}
        <div
          className="rounded-xl p-4"
          style={{ gridColumn: "7 / 13", gridRow: "3 / 8", backgroundColor: "#f0e6ff" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Group Actions to Take Today
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-accent-purple cursor-pointer hover:underline">
                Call New Supporters
              </span>
              <span className="text-[10px] text-text-muted">9 AM</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-accent-purple cursor-pointer hover:underline">
                Distribute Flyers at Campus
              </span>
              <span className="text-[10px] text-text-muted">11 AM</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-accent-purple cursor-pointer hover:underline">
                Host Community Meetup
              </span>
              <span className="text-[10px] text-text-muted">12 PM</span>
            </div>
          </div>
        </div>

        {/* Fundraising — cols 1-4, rows 8-14 */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ gridColumn: "1 / 5", gridRow: "8 / 15", backgroundColor: "#fff3e0" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Current Month Fundraising Goal
          </h3>
          <div className="text-2xl font-bold text-text-primary">
            $1,500 <span className="text-xs font-normal text-text-muted">of $1,900</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Total Raised: $12,340</p>
          <div className="mt-2 w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: "79%" }} />
          </div>
          <div className="mt-3 pt-3 border-t border-black/5">
            <p className="text-[10px] text-text-muted">Monthly Supply & Print Budget</p>
            <p className="text-lg font-bold text-text-primary">$150</p>
          </div>
          <button className="mt-auto self-stretch px-3 py-2 text-xs font-semibold text-white bg-orange-400 rounded-lg hover:bg-orange-500 transition-colors">
            Request Reimbursement
          </button>
        </div>

        {/* Recruitment Goal — cols 5-8, rows 8-11 */}
        <div
          className="rounded-xl p-4"
          style={{ gridColumn: "5 / 9", gridRow: "8 / 12", backgroundColor: "#e0f2fe" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
            Recruitment Goal
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-text-primary">{memberCount}</span>
                <span className="text-[11px] text-text-muted">Members of 18</span>
              </div>
              <div className="mt-1 w-full h-2 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.round((memberCount / 18) * 100))}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-text-primary">{supporterCount}</span>
                <span className="text-[11px] text-text-muted">Supporters of 25</span>
              </div>
              <div className="mt-1 w-full h-2 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.round((supporterCount / 25) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Request Approval — cols 9-12, rows 8-9 */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ gridColumn: "9 / 13", gridRow: "8 / 10", backgroundColor: "#fdf2f8" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">
            Request Approval
          </h3>
          <p className="text-[10px] text-text-muted">
            Send an idea or asset for approval
          </p>
          <button className="mt-auto self-stretch px-3 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
            Start
          </button>
        </div>

        {/* Connected Systems — cols 9-12, rows 10-14 */}
        <div
          className="rounded-xl p-4"
          style={{ gridColumn: "9 / 13", gridRow: "10 / 15", backgroundColor: "#e8e8e8" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Connected Systems
          </h3>
          <div className="space-y-2">
            <SystemBadge name="Action Network" status="issues" />
            <SystemBadge name="NationBuilder" status="functional" />
            <SystemBadge name="Mobilize" status="issues" />
          </div>
        </div>

        {/* Hours Volunteered — cols 5-9, rows 12-14 */}
        <div
          className="rounded-xl p-4"
          style={{ gridColumn: "5 / 9", gridRow: "12 / 15", backgroundColor: "#ecfdf5" }}
        >
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Hours Volunteered
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">23</span>
            <span className="text-xs font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-full">
              +9
            </span>
          </div>
        </div>

        {/* Group Directory — cols 1-8, rows 15-20 */}
        <div
          className="rounded-xl p-4 bg-white"
          style={{ gridColumn: "1 / 9", gridRow: "15 / 21" }}
        >
          <Link href="/members">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 hover:underline cursor-pointer">
              Group Directory
            </h3>
          </Link>
          <div className="space-y-2">
            {directoryMembers.length > 0
              ? directoryMembers.map((person) => (
                  <Link key={person.id} href={`/members/${person.id}`} className="flex items-center justify-between hover:bg-black/[0.03] -mx-1 px-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.full_name || ""}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-7 h-7 rounded-full ${getAvatarColor(person.id)} flex items-center justify-center text-[10px] font-bold text-white`}
                        >
                          {getInitials(person.full_name)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-text-primary">
                        {person.full_name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {getRoleLabel(person.role)}
                    </span>
                  </Link>
                ))
              : (
                <p className="text-[10px] text-text-muted">Loading members...</p>
              )}
          </div>
        </div>
      </div>

      {/* Signup Detail Modal */}
      <NbSignupModal
        signup={selectedSignup}
        assignment={selectedSignup ? getAssignment(selectedSignup.id) : null}
        members={allMembers}
        onClose={() => setSelectedSignup(null)}
        onAssigned={handleAssigned}
      />
    </aside>
  );
}

function SystemBadge({
  name,
  status = "functional",
}: {
  name: string;
  status?: "functional" | "issues";
}) {
  const isFunctional = status === "functional";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isFunctional ? "bg-green-400" : "bg-orange-400"}`}
        />
        <span className="text-xs text-text-primary">{name}</span>
      </div>
      <button
        className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
          isFunctional
            ? "text-green-700 bg-green-100 hover:bg-green-200"
            : "text-orange-700 bg-orange-100 hover:bg-orange-200"
        }`}
      >
        {isFunctional ? "Functional" : "Issues Found"}
      </button>
    </div>
  );
}
