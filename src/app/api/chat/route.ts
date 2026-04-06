// Model provider: RunPod (OpenAI-compatible API).
// Credentials stored in org_integrations table, encrypted at rest.
// Each bot has a model_id configured by super admin in the Bot Editor.
//
// Image tool calling: when a bot has image_tools_enabled = true in the bots table
// and the org has image API credentials configured, this route injects
// IMAGE_TOOL_DEFINITIONS into the API request. Tool calls are executed server-side
// and results are streamed back as special SSE events.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBots, getSystemPrompt } from "@/lib/bot-resolver";
import { decrypt } from "@/lib/encryption";
import { IMAGE_TOOL_DEFINITIONS } from "@/lib/image-tool-definitions";
import {
  getOrgImageCredentials,
  executeImageTool,
  incrementImageCredits,
  uploadImageToRailway,
  ImageToolError,
} from "@/lib/image-tools";
import type { ImageToolName } from "@/lib/types";
import { getStyleGalleryResponse } from "@/lib/style-gallery-data";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, group_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { botId, messages, conversationId } = await req.json();

  // Validate bot (DB-first, falls back to hardcoded)
  const allBots = await getBots();
  const bot = allBots.find((b) => b.id === botId);
  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Get bot's model_id and image_tools_enabled from DB
  const { data: botRow } = await supabase
    .from("bots")
    .select("model_id, image_tools_enabled")
    .eq("slug", botId)
    .single();

  const modelId = botRow?.model_id;
  if (!modelId) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  // Get org RunPod credentials
  const { data: integration } = await supabase
    .from("org_integrations")
    .select("runpod_endpoint_url, runpod_bearer_token, runpod_status")
    .eq("org_id", profile.org_id)
    .single();

  if (
    !integration?.runpod_endpoint_url ||
    !integration.runpod_bearer_token
  ) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  let token: string;
  try {
    token = decrypt(integration.runpod_bearer_token);
  } catch {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  const endpointUrl = integration.runpod_endpoint_url.replace(/\/+$/, "").replace(/\/v1$/, "");

  // Check if image tools should be enabled for this bot
  const imageToolsEnabled = !!botRow?.image_tools_enabled;
  let imageCredentials: Awaited<ReturnType<typeof getOrgImageCredentials>> = null;
  if (imageToolsEnabled) {
    imageCredentials = await getOrgImageCredentials(profile.org_id);
  }
  const useImageTools =
    imageToolsEnabled &&
    imageCredentials !== null &&
    imageCredentials.creditsUsed < imageCredentials.creditsAllocated;

  // Get system prompt (DB-first, falls back to hardcoded)
  const systemPrompt = await getSystemPrompt(botId);

  // Pre-process messages: upload base64 images to Railway before sending to model
  const processedMessages = await preprocessMessages(
    messages,
    imageCredentials,
    supabase,
    user.id,
    profile.group_id
  );

  // Build request body for OpenAI-compatible API
  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...processedMessages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";

      try {
        // Build API request — inject tools if image tools enabled
        const apiBody: Record<string, unknown> = {
          model: modelId,
          stream: true,
          messages: chatMessages,
        };
        if (useImageTools) {
          apiBody.tools = IMAGE_TOOL_DEFINITIONS;
          apiBody.tool_choice = "auto";
        }

        const res = await fetch(`${endpointUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiBody),
        });

        if (!res.ok) {
          // If auth failed, mark RunPod as errored
          if (res.status === 401) {
            await supabase
              .from("org_integrations")
              .update({ runpod_status: "error" })
              .eq("org_id", profile.org_id);
          }

          const errText = await res.text().catch(() => res.statusText);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: `Model error (${res.status}): ${errText}` })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        // Stream and handle response — may contain tool_calls
        const streamResult = await streamModelResponse(
          res,
          controller,
          encoder
        );
        fullContent = streamResult.content;

        // Handle tool calls if the model requested one
        const KNOWN_IMAGE_TOOLS = ["generate_image", "edit_image", "fuse_images", "apply_branding"];
        const imageToolCall = streamResult.toolCalls.find(
          (tc) => KNOWN_IMAGE_TOOLS.includes(tc.function.name)
        );

        // Handle style_galery tool call — return gallery data to the model
        const styleGalleryCall = streamResult.toolCalls.find(
          (tc) => tc.function.name === "style_galery"
        );
        if (styleGalleryCall && !imageToolCall) {
          try {
            // Parse style argument to return the right gallery (main or substyle)
            let galleryArgs: Record<string, unknown> = {};
            try {
              galleryArgs = JSON.parse(styleGalleryCall.function.arguments);
            } catch {
              // No args = main gallery
            }
            const galleryContent = getStyleGalleryResponse(galleryArgs);

            // Extract images from gallery markdown and send as a special SSE event
            // This avoids streaming raw markdown — client renders gallery instantly
            const galleryImages: Array<{ alt: string; url: string }> = [];
            const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            let imgMatch;
            while ((imgMatch = imgRegex.exec(galleryContent)) !== null) {
              galleryImages.push({ alt: imgMatch[1], url: imgMatch[2] });
            }

            const isSubstyle = !!galleryArgs.style;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  gallery: {
                    images: galleryImages,
                    title: isSubstyle
                      ? `Choose a substyle for ${galleryArgs.style}:`
                      : "Choose a style for your image:",
                  },
                })}\n\n`
              )
            );

            // Make follow-up request to get the model's text recommendation
            const galleryMessages = [
              ...chatMessages,
              {
                role: "assistant" as const,
                content: null,
                tool_calls: [
                  {
                    id: styleGalleryCall.id,
                    type: "function",
                    function: {
                      name: "style_galery",
                      arguments: styleGalleryCall.function.arguments,
                    },
                  },
                ],
              },
              {
                role: "tool" as const,
                tool_call_id: styleGalleryCall.id,
                content: galleryContent,
              },
            ];

            const galleryRes = await fetch(
              `${endpointUrl}/v1/chat/completions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  model: modelId,
                  stream: true,
                  messages: galleryMessages,
                  ...(useImageTools && {
                    tools: IMAGE_TOOL_DEFINITIONS,
                    tool_choice: "auto",
                  }),
                }),
              }
            );

            if (galleryRes.ok) {
              const galleryResult = await streamModelResponse(
                galleryRes,
                controller,
                encoder
              );
              // Store only the text part (gallery images already sent via SSE event)
              fullContent = galleryResult.content;
            }
          } catch {
            // If gallery follow-up fails, show whatever content we have
          }
        }

        if (imageToolCall && imageCredentials) {
          const toolCall = imageToolCall;
          const toolName = toolCall.function.name as ImageToolName;
          let toolArgs: Record<string, unknown>;
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            toolArgs = {};
          }

          // Notify client that image generation is starting
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "generating_image" })}\n\n`
            )
          );

          try {
            // Execute the image tool
            const { url: imageUrl } = await executeImageTool(
              toolName,
              toolArgs,
              imageCredentials
            );

            // Increment credits
            await incrementImageCredits(profile.org_id);

            // Save to media_items
            const toolLabel = toolName.replace(/_/g, " ");
            const { data: mediaItem } = await supabase
              .from("media_items")
              .insert({
                group_id: profile.group_id,
                uploaded_by: user.id,
                category: "generated",
                file_name: `${toolName}-${Date.now()}.png`,
                url: imageUrl,
                title: `${toolLabel} — ${new Date().toLocaleDateString()}`,
                status: "ready",
                visibility: "private",
              })
              .select("id")
              .single();

            // Send image result to client
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ image: { url: imageUrl, mediaItemId: mediaItem?.id ?? null } })}\n\n`
              )
            );

            // Make second request to model with tool result for natural language response
            const followUpMessages = [
              ...chatMessages,
              {
                role: "assistant" as const,
                content: null,
                tool_calls: [
                  {
                    id: toolCall.id,
                    type: "function",
                    function: {
                      name: toolName,
                      arguments: toolCall.function.arguments,
                    },
                  },
                ],
              },
              {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: true,
                  image_url: imageUrl,
                }),
              },
            ];

            const followUpRes = await fetch(
              `${endpointUrl}/v1/chat/completions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  model: modelId,
                  stream: true,
                  messages: followUpMessages,
                }),
              }
            );

            if (followUpRes.ok) {
              const followUpResult = await streamModelResponse(
                followUpRes,
                controller,
                encoder
              );
              // Build final content with image markdown
              fullContent = `![Generated Image](${imageUrl})\n\n${followUpResult.content}\n\n✓ Saved to your Media Library`;
            } else {
              // If follow-up fails, still show the image
              fullContent = `![Generated Image](${imageUrl})\n\n✓ Saved to your Media Library`;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: "\n\n✓ Saved to your Media Library" })}\n\n`
                )
              );
            }
          } catch (err) {
            // Image tool failed — send appropriate error message
            let errorMessage: string;
            if (err instanceof ImageToolError) {
              switch (err.code) {
                case "no_credits":
                  errorMessage =
                    "Image generation is currently unavailable. Your organisation has reached its image credit limit. Please contact your administrator.";
                  break;
                case "not_configured":
                  errorMessage =
                    "Image generation is not yet configured for your organisation. Please contact your administrator.";
                  break;
                default:
                  errorMessage =
                    "Image generation failed. Please try again.";
              }
            } else {
              errorMessage = "Image generation failed. Please try again.";
            }
            fullContent = errorMessage;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: errorMessage })}\n\n`
              )
            );
          }
        }

        // Persist conversation (fire-and-forget)
        const newConvId = await persistConversation(
          supabase,
          user.id,
          botId,
          messages,
          fullContent,
          conversationId
        );
        if (newConvId) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId: newConvId })}\n\n`
            )
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: message })}\n\n`
          )
        );
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ────────────────────────────────────────────────────────────
// Stream processing
// ────────────────────────────────────────────────────────────

interface ToolCallAccumulator {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface StreamResult {
  content: string;
  toolCalls: ToolCallAccumulator[];
}

async function streamModelResponse(
  res: Response,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<StreamResult> {
  let content = "";
  const toolCalls: ToolCallAccumulator[] = [];

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const choice = parsed.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        if (!delta) continue;

        // Strip reasoning field — internal model thinking, never shown to users
        if (delta.reasoning) {
          delete delta.reasoning;
        }

        // Accumulate tool calls
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCalls[idx]) {
              toolCalls[idx] = {
                id: tc.id || "",
                function: { name: "", arguments: "" },
              };
            }
            if (tc.id) toolCalls[idx].id = tc.id;
            if (tc.function?.name) {
              toolCalls[idx].function.name += tc.function.name;
            }
            if (tc.function?.arguments) {
              toolCalls[idx].function.arguments += tc.function.arguments;
            }
          }
          continue;
        }

        // Stream content
        const deltaContent = delta.content || "";
        if (deltaContent) {
          content += deltaContent;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: deltaContent })}\n\n`
            )
          );
        }
      } catch {
        // Skip malformed SSE chunks
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith("data: ") && trimmed.slice(6) !== "[DONE]") {
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: delta.content })}\n\n`
            )
          );
        }
      } catch {
        // Skip
      }
    }
  }

  return { content, toolCalls };
}

// ────────────────────────────────────────────────────────────
// Image upload pre-processing
// ────────────────────────────────────────────────────────────

async function preprocessMessages(
  messages: Array<{ role: string; content: string }>,
  imageCredentials: Awaited<ReturnType<typeof getOrgImageCredentials>>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  groupId: string | null
): Promise<Array<{ role: string; content: string }>> {
  if (!imageCredentials) return messages;

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
          const { url } = await uploadImageToRailway(
            match[1],
            imageCredentials
          );

          // Save uploaded image to media
          await supabase.from("media_items").insert({
            group_id: groupId,
            uploaded_by: userId,
            category: "generated",
            file_name: `upload-${Date.now()}.png`,
            url,
            title: `Uploaded image — ${new Date().toLocaleDateString()}`,
            status: "ready",
            visibility: "private",
          });

          // Replace base64 with URL in message
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
    processed.push(msg);
  }
  return processed;
}

// ────────────────────────────────────────────────────────────
// Conversation persistence
// ────────────────────────────────────────────────────────────

async function persistConversation(
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
