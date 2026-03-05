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
