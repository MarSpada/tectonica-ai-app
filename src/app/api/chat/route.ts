import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getBots, getSystemPrompt } from "@/lib/bot-resolver";

export async function POST(req: Request) {
  const { botId, messages, conversationId } = await req.json();

  // Validate bot (DB-first, falls back to hardcoded)
  const allBots = await getBots();
  const bot = allBots.find((b) => b.id === botId);
  if (!bot) {
    return new Response("Bot not found", { status: 404 });
  }

  // Get authenticated user for persistence
  let userId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Auth not available — chat still works, just no persistence
  }

  // Get system prompt (DB-first, falls back to hardcoded)
  const systemPrompt = await getSystemPrompt(botId);

  // Stream from OpenAI
  const openai = new OpenAI();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
            );
          }
        }

        // Persist conversation (fire-and-forget)
        if (userId && supabase) {
          const newConvId = await persistConversation(
            supabase,
            userId,
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
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
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
