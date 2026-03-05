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
  role: string;
  email: string;
  created_at: string;
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
  type: "signup_assignment" | "general";
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
