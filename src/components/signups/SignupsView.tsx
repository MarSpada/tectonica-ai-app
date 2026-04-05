"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import NbSignupModal from "./NbSignupModal";
import type { NbSignup, SignupAssignment, Member, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface SignupsViewProps {
  userRole: UserRole;
}

export default function SignupsView({ userRole }: SignupsViewProps) {
  const [signups, setSignups] = useState<NbSignup[]>([]);
  const [assignments, setAssignments] = useState<SignupAssignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSignup, setSelectedSignup] = useState<NbSignup | null>(null);
  const [nbStatus, setNbStatus] = useState<"connected" | "error" | "not_configured" | "loading">("loading");

  useEffect(() => {
    async function fetchData() {
      try {
        const [signupsRes] = await Promise.all([
          fetch("/api/nationbuilder/signups"),
        ]);
        const signupsJson = await signupsRes.json();
        if (signupsJson.signups) setSignups(signupsJson.signups);
        if (signupsJson.assignments) setAssignments(signupsJson.assignments);
        if (signupsJson.status) setNbStatus(signupsJson.status);
        else setNbStatus("connected");

        // Fetch members for assignment modal
        const supabase = createClient();
        const { data } = await supabase.rpc("get_group_members");
        if (data) setMembers(data as Member[]);
      } catch {
        setNbStatus("error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function getAssignment(signupId: string): SignupAssignment | null {
    return assignments.find((a) => a.nb_signup_id === signupId) || null;
  }

  function handleAssigned(newAssignment: SignupAssignment) {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.nb_signup_id !== newAssignment.nb_signup_id);
      return [...filtered, newAssignment];
    });
  }

  const filtered = signups.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Page title */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="widget-signups" size={28} />
          <h1 className="text-2xl font-bold text-foreground">New Sign-Ups</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="search" size={18} className="opacity-60" />
            </span>
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="ml-auto text-muted-foreground">
            {filtered.length} signup{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : nbStatus === "error" ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="warning" size={48} className="opacity-60" />
            <p className="text-sm font-medium text-foreground mt-3">Error connecting to NationBuilder</p>
            <p className="text-xs text-muted-foreground mt-1">Check your API configuration and try again.</p>
          </div>
        ) : nbStatus === "not_configured" ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="status-disconnected" size={48} className="opacity-60" />
            <p className="text-sm font-medium text-foreground mt-3">NationBuilder not configured</p>
            <p className="text-xs text-muted-foreground mt-1">Connect NationBuilder in the Integrations tab to see signups.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="widget-signups" size={48} className="opacity-60" />
            <p className="text-sm font-medium text-foreground mt-3">
              {search ? "No signups match your search" : "No recent sign-ups"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_140px_140px_160px] gap-4 px-4 py-2.5 bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span>Name</span>
              <span>Email / Phone</span>
              <span>Signed Up</span>
              <span>Status</span>
              <span>Assigned To</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map((s) => {
                const time = formatSignupTime(s.created_at);
                const assignment = getAssignment(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSignup(s)}
                    className="w-full grid grid-cols-[1fr_1fr_140px_140px_160px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    {/* Name + avatar */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 ${getAvatarColor(s.id)} flex items-center justify-center text-[10px] font-bold text-white`}
                      >
                        {getInitials(s.name)}
                      </div>
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
                        <img src="/nb-icon.png" alt="" className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-xs text-foreground truncate">{s.email || "—"}</span>
                      {s.phone && (
                        <span className="text-[10px] text-muted-foreground truncate">{s.phone}</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex items-center">
                      <span
                        className={`text-xs ${time.urgent ? "font-semibold text-red-500" : "text-muted-foreground"}`}
                      >
                        {time.text}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      {assignment ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            assignment.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : assignment.status === "contacted"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {assignment.status === "completed"
                            ? "Completed"
                            : assignment.status === "contacted"
                            ? "Contacted"
                            : "Pending"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Unassigned</Badge>
                      )}
                    </div>

                    {/* Assigned to */}
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground truncate">
                        {assignment?.assignee_name || "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Signup detail modal */}
      <NbSignupModal
        signup={selectedSignup}
        assignment={selectedSignup ? getAssignment(selectedSignup.id) : null}
        members={members}
        onClose={() => setSelectedSignup(null)}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
