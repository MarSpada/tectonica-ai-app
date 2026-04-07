"use client";

import { useState, useCallback, useEffect } from "react";
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
import { useUserProfile } from "@/lib/UserProfileContext";

// Strip landing page trigger block from rendered content
const stripLandingPageTrigger = (content: string): string => {
  const triggerIndex = content.indexOf("GENERATE_LANDING_PAGE");
  if (triggerIndex === -1) return content;
  const jsonStart = content.indexOf("{", triggerIndex);
  if (jsonStart === -1) return content.slice(0, triggerIndex).trimEnd();
  // Find matching closing brace via brace counting
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }
  if (jsonEnd === -1) return content.slice(0, triggerIndex).trimEnd();
  return (content.slice(0, triggerIndex) + content.slice(jsonEnd + 1)).trimEnd();
};

interface ChatViewProps {
  bot: Bot;
  userName: string;
  recentConversations: Array<{ id: string; title: string; updated_at: string }>;
  totalConversationCount?: number;
  isImageBot?: boolean;
  isLandingPageBot?: boolean;
  orgSlug?: string;
}

export default function ChatView({
  bot,
  userName,
  recentConversations: initialConversations,
  totalConversationCount: initialTotalCount,
  isImageBot = false,
  isLandingPageBot = false,
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
  const [approvedImages, setApprovedImages] = useState<Map<string, string>>(new Map()); // imageUrl → approvalId
  const [imageEnergyData, setImageEnergyData] = useState<Map<string, { energyWh: number; width: number; height: number }>>(new Map());
  const [imageToolData, setImageToolData] = useState<Map<string, { toolName: string; toolArgs: Record<string, unknown> }>>(new Map());

  // Landing page state
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);

  // Credit balance state (image bots only)
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const { profile: userProfile } = useUserProfile();

  // Fetch initial credit balance on mount for image bots
  useEffect(() => {
    if (!isImageBot) return;
    fetch("/api/billing/balance")
      .then((res) => res.json())
      .then((json) => {
        if (json.credit_balance_usd !== undefined) {
          setCreditBalance(json.credit_balance_usd);
        }
      })
      .catch(() => {
        // Balance unavailable — leave as null
      });
  }, [isImageBot]);

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
              // Store energy data if available
              if (parsed.image.energyWh != null && parsed.image.imageWidth && parsed.image.imageHeight) {
                setImageEnergyData((prev) => {
                  const next = new Map(prev);
                  next.set(parsed.image.url, {
                    energyWh: parsed.image.energyWh,
                    width: parsed.image.imageWidth,
                    height: parsed.image.imageHeight,
                  });
                  return next;
                });
              }
              // Store tool call data for retry
              if (parsed.image.toolName && parsed.image.toolArgs) {
                setImageToolData((prev) => {
                  const next = new Map(prev);
                  next.set(parsed.image.url, {
                    toolName: parsed.image.toolName,
                    toolArgs: parsed.image.toolArgs,
                  });
                  return next;
                });
              }
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

            // Landing page generation status
            if (parsed.status === "generating_landing_page") {
              setIsGeneratingLandingPage(true);
              continue;
            }

            // Landing page result
            if (parsed.landingPage) {
              setIsGeneratingLandingPage(false);
              const { url, headline, type } = parsed.landingPage;
              const label = type === "donate" ? "Donate Page" : "Signup Page";
              const markdownLink = `\n\n**[${headline} — ${label}](${url})**\n`;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                // Replace all content with just the link — strip any trigger text that was streamed
                updated[updated.length - 1] = {
                  ...last,
                  content: markdownLink,
                };
                return updated;
              });
              continue;
            }

            // Credit balance update from debit_image_credit RPC
            if (parsed.creditBalance !== undefined) {
              setCreditBalance(parsed.creditBalance);
              continue;
            }

            if (parsed.content) {
              setIsGeneratingImage(false);
              setIsGeneratingLandingPage(false);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                // Remove thinking marker when real content arrives
                const cleanedContent = last.content.replace("__THINKING_STYLES__", "");
                const rawContent = cleanedContent + parsed.content;
                updated[updated.length - 1] = {
                  ...last,
                  content: stripLandingPageTrigger(rawContent),
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
      setIsGeneratingLandingPage(false);
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

  const [shareConfirmUrl, setShareConfirmUrl] = useState<string | null>(null);

  async function handleCancelApproval(imageUrl: string) {
    const approvalId = approvedImages.get(imageUrl);
    if (!approvalId) return;
    try {
      const supabase = createClient();
      await supabase.from("approval_requests").delete().eq("id", approvalId);
      setApprovedImages((prev) => {
        const next = new Map(prev);
        next.delete(imageUrl);
        return next;
      });
    } catch {
      // Silently fail
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

      // Show inline confirmation
      setShareConfirmUrl(imageUrl);
      setTimeout(() => setShareConfirmUrl(null), 3000);
    } catch {
      // Silently fail
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
          creditBalance={creditBalance}
          userRole={userProfile?.role}
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
              isGeneratingLandingPage={isGeneratingLandingPage}
              onOpenStudio={isImageBot ? (imageUrl) => {
                setMostRecentImageUrl(imageUrl);
                setShowStudio(true);
              } : undefined}
              onStyleSelect={isImageBot ? (styleName) => {
                sendMessage(`I'd like the ${styleName} style`);
              } : undefined}
              onTryAgain={isImageBot ? (imageUrl?: string) => {
                // If we have stored tool data for this image, re-execute directly
                const toolData = imageUrl ? imageToolData.get(imageUrl) : undefined;
                if (toolData) {
                  // Direct re-execution — bypass model, same parameters
                  (async () => {
                    setIsStreaming(true);
                    setIsGeneratingImage(true);
                    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
                    try {
                      const res = await fetch("/api/image-tools/execute", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          tool: toolData.toolName,
                          params: toolData.toolArgs,
                          botId: bot.id,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Generation failed");
                      setIsGeneratingImage(false);
                      setMostRecentImageUrl(data.url);
                      // Store tool data for the new image too
                      setImageToolData((prev) => {
                        const next = new Map(prev);
                        next.set(data.url, toolData);
                        return next;
                      });
                      // Re-fetch credit balance after execute route (no SSE for REST)
                      fetch("/api/billing/balance")
                        .then((r) => r.json())
                        .then((j) => {
                          if (j.credit_balance_usd !== undefined) setCreditBalance(j.credit_balance_usd);
                        })
                        .catch(() => {});
                      setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                          role: "assistant",
                          content: `![Generated Image](${data.url})\n\n✓ New version generated and saved to your Media Library`,
                        };
                        return updated;
                      });
                    } catch (err) {
                      setIsGeneratingImage(false);
                      setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                          role: "assistant",
                          content: err instanceof Error ? err.message : "Regeneration failed. Please try again.",
                        };
                        return updated;
                      });
                    }
                    setIsStreaming(false);
                  })();
                } else {
                  // Fallback: send as chat message
                  sendMessage("Generate another version of this image");
                }
              } : undefined}
              onRequestApproval={isImageBot ? (imageUrl) => {
                if (approvedImages.has(imageUrl)) {
                  // Cancel the existing approval
                  handleCancelApproval(imageUrl);
                } else {
                  setApprovalImageUrl(imageUrl);
                }
              } : undefined}
              approvedImageUrls={approvedImages}
              onShareToChat={isImageBot ? handleShareToChat : undefined}
              imageEnergyData={imageEnergyData}
            />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              isStreaming={isStreaming}
              isImageBot={isImageBot}
              onImageUpload={handleImageUpload}
              onFileAttach={isImageBot ? (content: string) => {
                sendMessage(content);
              } : undefined}
            />
          </>
        )}
      </div>

      {/* Recent conversations sidebar */}
      <RecentConversations
        conversations={conversations}
        totalCount={initialTotalCount ?? conversations.length}
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
          onCreated={(requestId) => {
            if (requestId && approvalImageUrl) {
              setApprovedImages((prev) => new Map(prev).set(approvalImageUrl, requestId));
            }
            setApprovalImageUrl(null);
          }}
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
