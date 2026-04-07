// Bot chat API route
// Flow:
// 1. Auth + bot resolution
// 2. Credential fetch (RunPod + image API)
// 3. Message preprocessing (lib/chat-utils.ts)
// 4. Tool injection (image tools only, via OpenAI function calling)
// 5. First ChangeAgent request (lib/stream-utils.ts)
// 6. Post-stream: text pattern detection for landing page trigger (GENERATE_LANDING_PAGE)
// 7. Tool execution if finish_reason === "tool_calls" (image tools → executeToolAndContinue)
// 8. Second ChangeAgent request with tool result (lib/stream-utils.ts)
// 9. Conversation persistence (lib/chat-utils.ts)
//
// Model provider: RunPod (OpenAI-compatible API).
// Credentials stored in org_integrations table, encrypted at rest.
// Each bot has a model_id configured by super admin in the Bot Editor.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBots, getSystemPrompt } from "@/lib/bot-resolver";
import { decrypt } from "@/lib/encryption";
import { IMAGE_TOOL_DEFINITIONS } from "@/lib/image-tool-definitions";
import { renderLandingPage } from "@/lib/landing-page-utils";
import type { LandingPageBrief } from "@/lib/landing-page-utils";
import {
  getOrgImageCredentials,
  executeImageTool,
  ImageToolError,
} from "@/lib/image-tools";
import { preprocessMessages, persistConversation } from "@/lib/chat-utils";
import { streamModelResponse, collectModelResponse } from "@/lib/stream-utils";
import { saveGeneratedImage } from "@/lib/image-save-utils";
import type { ImageToolName } from "@/lib/types";
import { getStyleGalleryResponse } from "@/lib/style-gallery-data";
import { calculateImageCost, countInputImages } from "@/lib/billing-utils";

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

  // Validate bot (DB-first, falls back to hardcoded) — scoped to user's org
  const allBots = await getBots(profile.org_id);
  const bot = allBots.find((b) => b.id === botId);
  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Get bot's model_id and image_tools_enabled from DB — scoped to user's org
  const { data: botRow } = await supabase
    .from("bots")
    .select("model_id, image_tools_enabled, landing_page_tools_enabled")
    .eq("slug", botId)
    .or(`org_id.eq.${profile.org_id},org_id.is.null`)
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
  // Old integer credit gate removed — billing now handled by debit_image_credit RPC after generation.
  const useImageTools = imageToolsEnabled && imageCredentials !== null;
  const landingPageToolsEnabled = !!botRow?.landing_page_tools_enabled;

  // Get system prompt (DB-first, falls back to hardcoded) — scoped to user's org
  const systemPrompt = await getSystemPrompt(botId, profile.org_id);
  if (!systemPrompt) {
    return NextResponse.json({ error: 'System prompt unavailable' }, { status: 500 });
  }

  // Pre-process messages: upload base64 images to Railway before sending to model
  const { messages: processedMessages, uploadedImageUrl } = await preprocessMessages(
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

        // Landing page tool: text pattern detection (not function calling —
        // Open WebUI does not support native function definitions for this bot).
        // The model outputs GENERATE_LANDING_PAGE followed by a JSON block.
        // This runs ONLY for landing page bots — skip entirely for other bots.
        const LANDING_PAGE_TRIGGER = "GENERATE_LANDING_PAGE";
        if (landingPageToolsEnabled && streamResult.content) {
          const triggerIndex = streamResult.content.indexOf(LANDING_PAGE_TRIGGER);
          if (triggerIndex !== -1) {
            const jsonStart = streamResult.content.indexOf("{", triggerIndex);
            const jsonEnd = streamResult.content.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              try {
                const toolArgs = JSON.parse(
                  streamResult.content.slice(jsonStart, jsonEnd + 1),
                );
                const syntheticToolCall = {
                  id: `lp-${crypto.randomUUID()}`,
                  function: {
                    name: "generate_landing_page",
                    arguments: JSON.stringify(toolArgs),
                  },
                };
                fullContent = await executeLandingPageTool(
                  syntheticToolCall,
                  supabase,
                  profile.org_id,
                  profile.group_id,
                  user.id,
                  chatMessages,
                  endpointUrl,
                  modelId,
                  token,
                  controller,
                  encoder,
                );
              } catch (e) {
                console.error("Failed to parse landing page tool args:", e);
              }
            }
          }
        }

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

            // Show thinking indicator while model generates recommendations
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ status: "thinking_styles" })}\n\n`
              )
            );

            if (galleryRes.ok) {
              // Collect the follow-up response WITHOUT streaming it — we need to
              // strip the gallery markdown the model repeats before sending to client
              const galleryResult = await collectModelResponse(galleryRes);

              // Strip gallery table/image markdown, keep only the model's text recommendations
              const cleanText = galleryResult.content
                .replace(/^\s*##\s+Available Styles.*$/m, "")
                .replace(/^\s*##\s+.*?—\s*Substyles.*$/m, "")
                .replace(/^\s*\|.*\|\s*$/gm, "")
                .replace(/^\s*[-|]+\s*$/gm, "")
                .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
                .replace(/\*\d+\s+substyles?\*/gi, "")
                .replace(/\n{3,}/g, "\n\n")
                .trim();

              if (cleanText) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: cleanText })}\n\n`
                  )
                );
              }
              fullContent = cleanText;
            }
          } catch {
            // If gallery follow-up fails, show whatever content we have
          }
        }

        if (imageToolCall && imageCredentials) {
          fullContent = await executeToolAndContinue(
            imageToolCall,
            imageCredentials,
            uploadedImageUrl,
            supabase,
            profile.org_id,
            profile.group_id,
            user.id,
            chatMessages,
            endpointUrl,
            modelId,
            token,
            controller,
            encoder
          );
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
// Image tool execution
// ────────────────────────────────────────────────────────────

// This function has 13 parameters because it closes over the request context.
// Future refactor: consolidate into a ChatRequestContext object.
async function executeToolAndContinue(
  toolCall: { id: string; function: { name: string; arguments: string } },
  imageCredentials: NonNullable<Awaited<ReturnType<typeof getOrgImageCredentials>>>,
  uploadedImageUrl: string | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  groupId: string | null,
  userId: string,
  chatMessages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string }>,
  endpointUrl: string,
  modelId: string,
  token: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<string> {
  const toolName = toolCall.function.name as ImageToolName;
  let toolArgs: Record<string, unknown>;
  try {
    toolArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    toolArgs = {};
  }

  // Auto-inject uploaded image URL if the model didn't pass one
  // The model uses @image1 syntax (Open WebUI convention) but our API needs an explicit URL
  if (
    toolName === "generate_image" &&
    !toolArgs.image_url &&
    uploadedImageUrl
  ) {
    toolArgs.image_url = uploadedImageUrl;
  }

  // check_and_increment_image_credits removed — replaced by debit_image_credit RPC (billing-utils).
  // Old columns retained for now, marked for deprecation.

  // Notify client that image generation is starting
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({ status: "generating_image" })}\n\n`
    )
  );

  try {
    // Execute the image tool
    const imageResult = await executeImageTool(
      toolName,
      toolArgs,
      imageCredentials
    );

    // Download, store, resolve dimensions, calculate energy, save to media_items
    const saved = await saveGeneratedImage(
      {
        externalUrl: imageResult.url,
        toolName,
        toolArgs,
        responseWidth: imageResult.width,
        responseHeight: imageResult.height,
      },
      supabase,
      userId,
      groupId
    );
    const displayUrl = saved.displayUrl;

    // Fire-and-forget: debit group credits and log generation
    if (groupId) {
      const inputCount = countInputImages(toolArgs);
      const cost = calculateImageCost(
        imageResult.width,
        imageResult.height,
        inputCount,
      );
      Promise.resolve(
        supabase.rpc("debit_image_credit", {
          p_group_id: groupId,
          p_org_id: orgId,
          p_user_id: userId,
          p_fal_request_id: imageResult.requestId ?? null,
          p_endpoint: imageCredentials.endpoint,
          p_output_width: imageResult.width || 1024,
          p_output_height: imageResult.height || 1024,
          p_input_image_count: inputCount,
          p_mp_total: cost.outputMp + cost.inputMp,
          p_cost_usd: cost.totalCost,
        })
      )
        .then(({ data: newBalance, error: debitErr }) => {
          if (debitErr) {
            console.error("debit_image_credit failed:", debitErr.message);
          } else {
            // Send updated balance to client so topbar can refresh
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ creditBalance: newBalance })}\n\n`
              )
            );
          }
        })
        .catch((err: unknown) => {
          console.error("debit_image_credit error:", err);
        });
    } else {
      console.warn("debit_image_credit skipped: groupId is null for user " + userId);
    }

    // Send image result to client (include energy data + tool info for retry)
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          image: {
            url: displayUrl,
            mediaItemId: saved.mediaItemId,
            energyWh: saved.energyWh,
            imageWidth: saved.imageWidth,
            imageHeight: saved.imageHeight,
            toolName: toolName,
            toolArgs: toolArgs,
          },
        })}\n\n`
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
          image_url: displayUrl,
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
      return `![Generated Image](${displayUrl})\n\n${followUpResult.content}\n\n✓ Saved to your Media Library`;
    } else {
      // If follow-up fails, still show the image
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ content: "\n\n✓ Saved to your Media Library" })}\n\n`
        )
      );
      return `![Generated Image](${displayUrl})\n\n✓ Saved to your Media Library`;
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
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ content: errorMessage })}\n\n`
      )
    );
    return errorMessage;
  }
}

// ────────────────────────────────────────────────────────────
// Landing page tool execution
// ────────────────────────────────────────────────────────────

async function executeLandingPageTool(
  toolCall: { id: string; function: { name: string; arguments: string } },
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  groupId: string | null,
  userId: string,
  chatMessages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string }>,
  endpointUrl: string,
  modelId: string,
  token: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
): Promise<string> {
  let toolArgs: Record<string, unknown>;
  try {
    toolArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    toolArgs = {};
  }

  if (!groupId) {
    const errMsg = "Landing page generation requires a group assignment. Please contact your administrator.";
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ content: errMsg })}\n\n`)
    );
    return errMsg;
  }

  // Notify client that landing page generation is starting
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({ status: "generating_landing_page" })}\n\n`
    )
  );

  try {
    const headline = (toolArgs.headline as string) || "";
    const type = (toolArgs.type as string) === "donate" ? "donate" : "signup";
    const ctaLabel = (toolArgs.cta_label as string) || "";
    const keyMessages = Array.isArray(toolArgs.key_messages)
      ? (toolArgs.key_messages as string[]).filter((m) => typeof m === "string" && m.trim().length > 0)
      : [];
    const urgency = typeof toolArgs.urgency === "string" ? toolArgs.urgency : undefined;

    // Fetch group branding
    const { data: branding } = await supabase
      .from("group_branding")
      .select("*")
      .eq("group_id", groupId)
      .maybeSingle();

    // cta_url falls back to '#' if default not configured — admin should set default_cta_url in Branding tab
    const resolvedCtaUrl = branding?.default_cta_url || "#";

    const brief: LandingPageBrief = {
      headline,
      type,
      cta_label: ctaLabel,
      cta_url: resolvedCtaUrl,
      key_messages: keyMessages,
      urgency,
      branding: {
        logo_url: branding?.logo_url ?? null,
        hero_image_url: branding?.hero_image_url ?? null,
        primary_color: branding?.primary_color ?? null,
        secondary_color: branding?.secondary_color ?? null,
        social_facebook: branding?.social_facebook ?? null,
        social_instagram: branding?.social_instagram ?? null,
        social_twitter: branding?.social_twitter ?? null,
        social_bluesky: branding?.social_bluesky ?? null,
      },
    };

    // Render HTML
    const html = renderLandingPage(brief);

    // Upload to Supabase Storage
    const pageId = crypto.randomUUID();
    const storagePath = `${groupId}/${pageId}.html`;

    const { error: uploadErr } = await supabase.storage
      .from("landing-pages")
      .upload(storagePath, html, {
        contentType: "text/html",
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("landing-pages")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Insert record into group_landing_pages
    const { data: landingPage, error: dbError } = await supabase
      .from("group_landing_pages")
      .insert({
        group_id: groupId,
        org_id: orgId,
        created_by: userId,
        headline,
        type,
        public_url: publicUrl,
        status: "live",
      })
      .select("id")
      .single();

    if (dbError) {
      throw new Error(`DB insert failed: ${dbError.message}`);
    }

    // Send landing page result to client
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          landingPage: {
            url: publicUrl,
            landing_page_id: landingPage.id,
            headline,
            type,
          },
        })}\n\n`
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
              name: toolCall.function.name,
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
          url: publicUrl,
          headline,
          type,
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
      return followUpResult.content;
    } else {
      // If follow-up fails, still confirm the page was created
      const fallbackMsg = `\n\nYour landing page is ready: ${publicUrl}`;
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ content: fallbackMsg })}\n\n`
        )
      );
      return fallbackMsg;
    }
  } catch (err) {
    const errorMessage = err instanceof Error
      ? `Landing page generation failed: ${err.message}`
      : "Landing page generation failed. Please try again.";
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ content: errorMessage })}\n\n`
      )
    );
    return errorMessage;
  }
}

