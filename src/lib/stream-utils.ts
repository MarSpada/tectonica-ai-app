// Stream utilities — extracted from app/api/chat/route.ts
//
// Two-phase streaming:
//   The chat route uses a two-phase approach when the model calls tools.
//   Phase 1: Stream the model's initial response to the client. If the model
//   decides to call a tool (e.g. generate_image, style_galery), the response
//   ends with finish_reason "tool_calls" instead of "stop".
//   Phase 2: After executing the tool server-side, append the tool result to
//   the conversation and make a second request. Stream that follow-up response
//   to the client so the model can provide a natural language summary.
//
// Tool call delta accumulation:
//   OpenAI-compatible streaming sends tool calls as incremental deltas across
//   multiple SSE chunks. Each chunk contains a partial function name or partial
//   arguments string. We accumulate these into ToolCallAccumulator objects
//   indexed by tc.index, building the complete function name and JSON arguments
//   string across all chunks before the tool can be executed.
//
// Reasoning field stripping:
//   The ChangeAgent model (via Open WebUI) sometimes includes a "reasoning"
//   field in its deltas — internal chain-of-thought that should never be shown
//   to users. We strip it from every delta before forwarding to the client.

export interface ToolCallAccumulator {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamResult {
  content: string;
  toolCalls: ToolCallAccumulator[];
}

/** Collect full model response WITHOUT streaming to client. Used for gallery follow-ups. */
export async function collectModelResponse(res: Response): Promise<StreamResult> {
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
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.reasoning) delete delta.reasoning;
        if (delta.content) content += delta.content;
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: tc.id || "", function: { name: "", arguments: "" } };
            }
            if (tc.id) toolCalls[idx].id = tc.id;
            if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
            if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
          }
        }
      } catch { /* skip */ }
    }
  }
  return { content, toolCalls };
}

export async function streamModelResponse(
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
