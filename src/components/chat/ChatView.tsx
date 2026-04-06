"use client";

import { useState, useCallback } from "react";
import { type Bot } from "@/lib/bots";
import { type Message } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import RecentConversations from "./RecentConversations";
import StudioOverlay from "./StudioOverlay";
import { Icon } from "@/components/ui/icon";
import { parseRequirements } from "./CreativeBrief";
import CreateApprovalModal from "@/components/approvals/CreateApprovalModal";

interface ChatViewProps {
  bot: Bot;
  userName: string;
  recentConversations: Array<{ id: string; title: string; updated_at: string }>;
  isImageBot?: boolean;
  orgSlug?: string;
}

export default function ChatView({
  bot,
  userName,
  recentConversations: initialConversations,
  isImageBot = false,
  orgSlug = "",
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [notConfigured, setNotConfigured] = useState(false);

  // Image-specific state
  const [mostRecentImageUrl, setMostRecentImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [approvalImageUrl, setApprovalImageUrl] = useState<string | null>(null);

  const sendMessage = useCallback(async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isStreaming) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!messageContent) setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: bot.id,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          try {
            const errJson = await response.json();
            if (errJson.error === "not_configured") {
              setNotConfigured(true);
              setMessages([]);
              setIsStreaming(false);
              return;
            }
          } catch {
            // Fall through to generic error
          }
        }
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: `Sorry, something went wrong: ${parsed.error}`,
                };
                return updated;
              });
              continue;
            }

            if (parsed.conversationId) {
              setConversationId(parsed.conversationId);
              continue;
            }

            // Style gallery — render directly without streaming
            if (parsed.gallery) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                // Store gallery data as a special JSON marker in the content
                const galleryMarker = `__GALLERY__${JSON.stringify(parsed.gallery)}__END_GALLERY__`;
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + galleryMarker,
                };
                return updated;
              });
              continue;
            }

            // Thinking about style recommendations
            if (parsed.status === "thinking_styles") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + "\n\n__THINKING_STYLES__",
                };
                return updated;
              });
              continue;
            }

            // Image generation status
            if (parsed.status === "generating_image") {
              setIsGeneratingImage(true);
              continue;
            }

            // Image result
            if (parsed.image) {
              setIsGeneratingImage(false);
              setMostRecentImageUrl(parsed.image.url);
              // Insert image markdown into assistant message
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + `![Generated Image](${parsed.image.url})`,
                };
                return updated;
              });
              continue;
            }

            if (parsed.content) {
              setIsGeneratingImage(false);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                // Remove thinking marker when real content arrives
                const cleanedContent = last.content.replace("__THINKING_STYLES__", "");
                updated[updated.length - 1] = {
                  ...last,
                  content: cleanedContent + parsed.content,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }
    } catch (err) {
      setIsGeneratingImage(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            err instanceof Error
              ? `Connection error: ${err.message}`
              : "Something went wrong. Please try again.",
        };
        return updated;
      });
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, bot.id, conversationId]);

  const handleImageUpload = useCallback(
    (base64: string) => {
      // Send the base64 as the message content — the chat route handles upload
      sendMessage(base64);
    },
    [sendMessage]
  );

  async function loadConversation(convId: string) {
    setConversationId(convId);
    setMostRecentImageUrl(null);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (data) {
        const loadedMessages = data.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(loadedMessages);

        // Find most recent image URL in loaded conversation
        for (let i = loadedMessages.length - 1; i >= 0; i--) {
          const match = loadedMessages[i].content.match(
            /!\[[^\]]*\]\(([^)]+)\)/
          );
          if (match) {
            setMostRecentImageUrl(match[1]);
            break;
          }
        }
      }
    } catch {
      // Tables may not exist
    }
  }

  async function handleShareToChat(imageUrl: string) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();
      if (!profile?.group_id) return;

      await supabase.from("group_messages").insert({
        group_id: profile.group_id,
        sender_id: user.id,
        content: `![Shared from Graphics Creation](${imageUrl})`,
      });

      // Brief visual feedback
      alert("Image shared to group chat!");
    } catch {
      alert("Failed to share image. Please try again.");
    }
  }

  async function handleDeleteConversation(convId: string) {
    try {
      const supabase = createClient();
      // Delete messages first (FK constraint), then conversation
      await supabase.from("messages").delete().eq("conversation_id", convId);
      await supabase.from("conversations").delete().eq("id", convId);
      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      // If the deleted conversation is the current one, start fresh
      if (conversationId === convId) {
        setMessages([]);
        setConversationId(null);
        setMostRecentImageUrl(null);
      }
    } catch {
      // Silently fail — conversation may already be gone
    }
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setMostRecentImageUrl(null);
    setIsGeneratingImage(false);
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-content-bg">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-bg">
        <ChatHeader
          bot={bot}
          isImageBot={isImageBot}
          mostRecentImageUrl={mostRecentImageUrl}
          onOpenStudio={() => setShowStudio(true)}
        />
        {notConfigured ? (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="info" size={24} className="text-amber-600" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                This bot is not yet configured
              </p>
              <p className="text-xs text-text-muted">
                Please contact your administrator to set up the AI model connection.
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              bot={bot}
              userName={userName}
              isStreaming={isStreaming}
              isGeneratingImage={isGeneratingImage}
              onOpenStudio={isImageBot ? (imageUrl) => {
                setMostRecentImageUrl(imageUrl);
                setShowStudio(true);
              } : undefined}
              onStyleSelect={isImageBot ? (styleName) => {
                sendMessage(`I'd like the ${styleName} style`);
              } : undefined}
              onTryAgain={isImageBot ? () => {
                sendMessage("Generate another version of this image");
              } : undefined}
              onRequestApproval={isImageBot ? (imageUrl) => {
                setApprovalImageUrl(imageUrl);
              } : undefined}
              onShareToChat={isImageBot ? handleShareToChat : undefined}
            />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              isStreaming={isStreaming}
              isImageBot={isImageBot}
              onImageUpload={handleImageUpload}
            />
          </>
        )}
      </div>

      {/* Recent conversations sidebar */}
      <RecentConversations
        conversations={conversations}
        currentConversationId={conversationId}
        onSelect={loadConversation}
        onNewChat={startNewChat}
        onDeleteConversation={handleDeleteConversation}
        onUseBrief={(briefContent) => sendMessage(briefContent)}
        briefRequirements={parseRequirements(messages)}
        isImageBot={isImageBot}
      />

      {/* Approval modal — pre-filled with image */}
      {approvalImageUrl && (
        <CreateApprovalModal
          onClose={() => setApprovalImageUrl(null)}
          onCreated={() => setApprovalImageUrl(null)}
          prefilledTitle={`Generated image — ${bot.name}`}
          prefilledImageUrl={approvalImageUrl}
        />
      )}

      {/* Studio overlay */}
      {showStudio && (
        <StudioOverlay
          imageUrl={mostRecentImageUrl}
          orgClientId={orgSlug}
          onClose={() => setShowStudio(false)}
        />
      )}
    </div>
  );
}
