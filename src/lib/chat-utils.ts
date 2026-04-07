// Chat utilities — extracted from app/api/chat/route.ts
// Contains message preprocessing and conversation persistence logic
// used by the bot chat API route.

import { uploadBase64ToStorage } from "@/lib/image-tools";
import type { getOrgImageCredentials } from "@/lib/image-tools";
import type { createClient } from "@/lib/supabase/server";

// ────────────────────────────────────────────────────────────
// Image upload pre-processing
// ────────────────────────────────────────────────────────────

export async function preprocessMessages(
  messages: Array<{ role: string; content: string }>,
  imageCredentials: Awaited<ReturnType<typeof getOrgImageCredentials>>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  groupId: string | null
): Promise<{ messages: Array<{ role: string; content: string }>; uploadedImageUrl: string | null }> {
  if (!imageCredentials || !groupId) return { messages, uploadedImageUrl: null };

  let uploadedImageUrl: string | null = null;

  const processed = [];
  for (const msg of messages) {
    // Check if the message contains a base64 data URI
    if (
      msg.role === "user" &&
      msg.content.includes("data:image/")
    ) {
      // Extract base64 from data URI
      const match = msg.content.match(
        /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/
      );
      if (match) {
        try {
          // Upload to Supabase Storage instead of Railway
          const { url } = await uploadBase64ToStorage(
            match[1],
            supabase,
            groupId
          );

          // Replace base64 with signed URL in message
          uploadedImageUrl = url;
          const newContent = msg.content.replace(
            /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
            url
          );
          processed.push({ ...msg, content: newContent });
          continue;
        } catch {
          // If upload fails, proceed with original message (model may not handle base64 well)
        }
      }
    }
    // Check for image URLs from trusted sources in messages (from previous uploads).
    // Scoped to Supabase Storage signed URLs and FAL CDN URLs only.
    // A broader pattern (any https image URL) was previously used but risked matching
    // URLs mentioned conversationally, which would unintentionally inject them as
    // image references for tool calls like generate_image.
    if (msg.role === "user") {
      const urlMatch = msg.content.match(
        /https:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/sign\/[^\s]+|https:\/\/fal\.media\/[^\s]+/i
      );
      if (urlMatch) {
        uploadedImageUrl = urlMatch[0];
      }
    }
    processed.push(msg);
  }
  return { messages: processed, uploadedImageUrl };
}

// ────────────────────────────────────────────────────────────
// Conversation persistence
// ────────────────────────────────────────────────────────────

export async function persistConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  botId: string,
  messages: Array<{ role: string; content: string }>,
  assistantContent: string,
  conversationId?: string
): Promise<string | null> {
  try {
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    if (conversationId) {
      // Append to existing conversation
      await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          role: "user",
          content: lastUserMessage,
        },
        {
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
        },
      ]);
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      return conversationId;
    } else {
      // Create new conversation
      const title = lastUserMessage.slice(0, 60);
      const { data: conv } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          bot_id: botId,
          title,
        })
        .select("id")
        .single();

      if (conv) {
        await supabase.from("messages").insert([
          {
            conversation_id: conv.id,
            role: "user",
            content: lastUserMessage,
          },
          {
            conversation_id: conv.id,
            role: "assistant",
            content: assistantContent,
          },
        ]);
        return conv.id;
      }
    }
  } catch {
    console.warn("Failed to persist conversation — tables may not exist yet.");
  }
  return null;
}
