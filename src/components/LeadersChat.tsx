"use client";

import { useState, useRef, useEffect } from "react";

interface Contact {
  name: string;
  initials: string;
  color: string;
  status: "online" | "away" | "offline";
  role: string;
}

interface Message {
  id: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  time: string;
}

const contacts: Contact[] = [
  { name: "Sara Chen", initials: "SC", color: "#7C3AED", status: "online", role: "Organizer" },
  { name: "Marcus Rivera", initials: "MR", color: "#0EA5E9", status: "online", role: "Leader" },
  { name: "Jasmine Okafor", initials: "JO", color: "#F59E0B", status: "away", role: "Leader" },
  { name: "David Park", initials: "DP", color: "#10B981", status: "offline", role: "Organizer" },
  { name: "Lucia Torres", initials: "LT", color: "#EC4899", status: "offline", role: "Leader" },
];

const statusColors: Record<string, string> = {
  online: "#22C55E",
  away: "#F59E0B",
  offline: "#9CA3AF",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "Sara Chen",
    initials: "SC",
    color: "#7C3AED",
    text: "Hey everyone! Just finished the outreach plan for next week. I'll share it in the doc later today.",
    time: "10:32 AM",
  },
  {
    id: "2",
    sender: "Marcus Rivera",
    initials: "MR",
    color: "#0EA5E9",
    text: "Great work Sara. Can we also discuss the volunteer schedule for the weekend event?",
    time: "10:45 AM",
  },
  {
    id: "3",
    sender: "Jasmine Okafor",
    initials: "JO",
    color: "#F59E0B",
    text: "I have 12 confirmed volunteers so far. Will check in with a few more today.",
    time: "11:02 AM",
  },
  {
    id: "4",
    sender: "Sara Chen",
    initials: "SC",
    color: "#7C3AED",
    text: "Perfect. Let's sync tomorrow morning to finalize everything.",
    time: "11:15 AM",
  },
];

interface LeadersChatProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

export default function LeadersChat({ open, onClose, userName = "Ned" }: LeadersChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "contacts">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function handleSend() {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: userName,
      initials: userName.slice(0, 2).toUpperCase(),
      color: "#6B3FA0",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  if (!open) return null;

  const onlineContacts = contacts.filter((c) => c.status === "online");
  const awayContacts = contacts.filter((c) => c.status === "away");
  const offlineContacts = contacts.filter((c) => c.status === "offline");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed left-[var(--sidebar-width)] top-[52px] bottom-0 w-[360px] bg-white z-50 flex flex-col shadow-2xl"
        style={{ borderRight: "1px solid rgba(0,0,0,.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <h2 className="text-sm font-bold text-text-primary">
            Leaders and Supporters Chat
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <span className="material-icons-two-tone text-[18px] text-text-muted">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/5">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "chat"
                ? "text-accent-purple border-b-2 border-accent-purple"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Group Chat
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "contacts"
                ? "text-accent-purple border-b-2 border-accent-purple"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Contacts ({contacts.length})
          </button>
        </div>

        {activeTab === "contacts" ? (
          /* Contacts list */
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* Online */}
            {onlineContacts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
                  Online — {onlineContacts.length}
                </p>
                <div className="space-y-0.5">
                  {onlineContacts.map((c) => (
                    <ContactRow key={c.name} contact={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Away */}
            {awayContacts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
                  Away — {awayContacts.length}
                </p>
                <div className="space-y-0.5">
                  {awayContacts.map((c) => (
                    <ContactRow key={c.name} contact={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline */}
            {offlineContacts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
                  Offline — {offlineContacts.length}
                </p>
                <div className="space-y-0.5">
                  {offlineContacts.map((c) => (
                    <ContactRow key={c.name} contact={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chat messages */
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2.5">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: msg.color }}
                  >
                    {msg.initials}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-text-primary">
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-text-muted">{msg.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-black/5">
              <div className="flex items-center gap-2 bg-black/[.03] rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Message your group..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-muted"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-30"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9B5CF6)",
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-black/[.03] transition-colors cursor-pointer">
      {/* Avatar with status dot */}
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: contact.color }}
        >
          {contact.initials}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: statusColors[contact.status] }}
        />
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{contact.name}</p>
        <p className="text-[10px] text-text-muted">{contact.role}</p>
      </div>

      {/* Status label */}
      <span className="text-[10px] text-text-muted">{statusLabels[contact.status]}</span>
    </div>
  );
}
