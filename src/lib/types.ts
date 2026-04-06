import type { BotCategory } from "./bots";

export type UserRole = "super_admin" | "group_admin" | "member" | "supporter";

/** Leaders & Organizers chat contact */
export interface LeadersChatContact {
  name: string;
  initials: string;
  color: string;
  status: "online" | "away" | "offline";
  role: string;
}

/** Leaders & Organizers chat message */
export interface LeadersChatMessage {
  id: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  time: string;
}

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
  type: "signup_assignment" | "general" | "approval_request" | "reimbursement_request";
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

/* ── Volunteer Hours ── */

export interface HourEntry {
  id: string;
  user_id: string;
  hours: number;
  description: string | null;
  activity_date: string;
  created_at?: string;
  user_name?: string;
  user_avatar?: string | null;
}

/* ── Admin / Bots ── */

export interface AdminBot {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: BotCategory;
  description: string;
  system_prompt: string | null;
  model_id: string | null;
}

/* ── Org Integrations ── */

export type RunPodStatus = "connected" | "error" | "not_configured";

export interface OrgIntegration {
  id: string;
  org_id: string;
  runpod_endpoint_url: string | null;
  runpod_status: RunPodStatus;
  runpod_last_checked_at: string | null;
  updated_at: string;
}

/* ── Calendar ── */

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  description?: string | null;
  sourceName: string;
  sourceColor: string;
}

/* ── Groups ── */

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  member_count?: number;
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

// LEGACY — fundraising_goal and print_budget here are from the per-month fundraising_goals table.
// Source of truth for targets moved to GroupGoals (money_goal, money_budget).
// This type still tracks amount_raised per month.
export interface FundraisingGoal {
  id: string;
  group_id: string;
  month: string;
  fundraising_goal: number;
  amount_raised: number;
  print_budget: number;
  created_at: string;
  updated_at: string;
}

/* ── Group Goals ── */

export interface GroupGoals {
  id: string;
  group_id: string;
  money_goal: number;
  money_budget: number;
  money_raised_offline: number;
  members_goal: number;
  supporters_goal: number;
  updated_at: string;
  updated_by: string | null;
}

/* ── Media Library ── */

export type MediaCategory = "image" | "video" | "document" | "link" | "generated";
export type MediaItemStatus = "pending" | "ready" | "failed";
export type MediaVisibility = "group" | "admins_only" | "specific_members" | "private";

export interface MediaItem {
  id: string;
  group_id: string;
  uploaded_by: string;
  category: MediaCategory;
  file_name: string;
  storage_path: string | null;
  url: string | null;
  title: string | null;
  description: string | null;
  mime_type: string | null;
  file_size: number | null;
  thumbnail_path: string | null;
  status: MediaItemStatus;
  visibility: MediaVisibility;
  tags: string[];
  download_count: number;
  deleted_at: string | null;
  created_at: string;
  // Joined fields from API
  uploader_name?: string;
  uploader_avatar?: string | null;
  signed_url?: string;
}

/* ── Image Tools ── */

export type ImageToolName = "generate_image" | "edit_image" | "fuse_images" | "apply_branding";

export interface GenerateImageParams {
  tool: "generate_image";
  prompt: string;
  aspect_ratio?: string;
  platform?: string;
  publication_type?: string;
  with_branding?: boolean;
}

export interface EditImageParams {
  tool: "edit_image";
  instructions: string;
  image_url: string;
  aspect_ratio?: string;
}

export interface FuseImagesParams {
  tool: "fuse_images";
  image_url_1: string;
  image_url_2: string;
  instructions?: string;
  aspect_ratio?: string;
  use_style_reference?: boolean;
}

export interface ApplyBrandingParams {
  tool: "apply_branding";
  image_url: string;
  branding_style?: string;
  aspect_ratio?: string;
}

export type ImageToolParams =
  | GenerateImageParams
  | EditImageParams
  | FuseImagesParams
  | ApplyBrandingParams;

export interface ImageCredentialsStatus {
  configured: boolean;
  creditsAllocated?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
}

export type ImageToolErrorCode = "not_configured" | "no_credits" | "api_error" | "upload_error";

/* ── Dashboard Layout ── */

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

/* ── Dashboard Widget Data ── */

export interface FundraisingHistory {
  month: string;
  raised: number;
  goal: number;
}

export interface HoursWeekBucket {
  week: string;
  hours: number;
}

/* ── Reimbursements ── */

export interface ReimbursementRequest {
  id: string;
  group_id: string;
  submitter_id: string;
  reviewer_id: string;
  amount: number;
  description: string;
  status: ApprovalStatus;
  attachments: ApprovalAttachment[];
  created_at: string;
  updated_at: string;
  // Joined fields from API
  submitter_name?: string;
  submitter_avatar?: string | null;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
}

/* ── Actions ── */

export type ActionSource = "internal" | "nationbuilder" | "action_network" | "actblue" | "sosha" | "events";
export type ActionType = "petition" | "donation" | "event_rsvp" | "letter" | "phone_bank" | "canvass" | "social_share" | "custom";
export type ActionStatus = "active" | "completed" | "expired" | "archived";
export type ActionVisibility = "group" | "admins_only";
export type AssignmentScope = "all" | "targeted" | "self_assign";
export type CompletionMethod = "self_reported" | "api_verified" | "admin_confirmed";

export interface Action {
  id: string;
  group_id: string;
  source: ActionSource;
  source_id: string | null;
  source_data: Record<string, unknown> | null;
  type: ActionType;
  title: string;
  description: string | null;
  call_to_action: string | null;
  url: string | null;
  suggested_bot_slug: string | null;
  points_value: number;
  priority: number;
  assignment_scope: AssignmentScope;
  starts_at: string | null;
  ends_at: string | null;
  status: ActionStatus;
  visibility: ActionVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from API
  creator_name?: string;
  creator_avatar?: string | null;
  completion_count?: number;
  is_completed_by_me?: boolean;
}

export interface ActionAssignment {
  id: string;
  action_id: string;
  assigned_to_member_id: string | null;
  assigned_to_group_id: string | null;
  assigned_by: string;
  assigned_at: string;
}

export interface ActionCompletion {
  id: string;
  action_id: string;
  member_id: string;
  completed_at: string;
  completion_method: CompletionMethod;
  points_earned: number;
  source_confirmation_data: Record<string, unknown> | null;
  notes: string | null;
  // Joined fields from API
  member_name?: string;
  member_avatar?: string | null;
}

export interface MemberPointsLedger {
  id: string;
  member_id: string;
  group_id: string;
  action_completion_id: string;
  points: number;
  earned_at: string;
}
