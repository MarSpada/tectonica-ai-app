export type UserRole = "super_admin" | "group_admin" | "member" | "supporter";

export interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  bot_id: string;
  updated_at: string;
  created_at: string;
}

export interface Member {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  email: string;
  created_at: string;
  group_id?: string;
  group_name?: string;
}

export interface GroupMessage {
  id: string;
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  content: string;
  created_at: string;
}

export interface NbSignup {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface SignupAssignment {
  id: string;
  nb_signup_id: string;
  nb_signup_name: string;
  assigned_to: string;
  assigned_by: string;
  status: "pending" | "contacted" | "completed";
  created_at: string;
  assignee_name?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: "signup_assignment" | "general" | "approval_request";
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface ProfileData {
  fullName: string;
  avatarUrl: string | null;
  bio: string;
  role: string;
  orgName: string;
  groupName: string;
}

/* ── Approval Workflow ── */

export type ApprovalStatus = "pending" | "approved" | "changes_requested";

export interface ApprovalAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface ApprovalRequest {
  id: string;
  group_id: string;
  submitter_id: string;
  reviewer_id: string;
  title: string;
  description: string | null;
  status: ApprovalStatus;
  attachments: ApprovalAttachment[];
  conversation_id: string | null;
  bot_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from API
  submitter_name?: string;
  submitter_avatar?: string | null;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
}

export interface ApprovalComment {
  id: string;
  request_id: string;
  author_id: string;
  content: string;
  attachments: ApprovalAttachment[];
  created_at: string;
  // Joined fields from API
  author_name?: string;
  author_avatar?: string | null;
}
