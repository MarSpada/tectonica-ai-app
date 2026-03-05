"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupMessage } from "@/lib/types";

const PAGE_SIZE = 50;

export function useGroupMessages() {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch initial messages + subscribe to Realtime
  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch initial messages via RPC
      const { data, error } = await supabase.rpc("get_group_messages", {
        msg_limit: PAGE_SIZE,
      });

      if (!error && data) {
        const msgs = data as GroupMessage[];
        setMessages(msgs);
        setHasMore(msgs.length === PAGE_SIZE);
      }
      setIsLoading(false);

      // Get caller's group_id for Realtime filter
      const { data: profile } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (!profile?.group_id) return;

      // Subscribe to new messages via Realtime
      channel = supabase
        .channel("group-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `group_id=eq.${profile.group_id}`,
          },
          async (payload) => {
            const newRow = payload.new as {
              id: string;
              sender_id: string;
              content: string;
              created_at: string;
            };

            // Skip if we already have this message (optimistic insert)
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              // Need to look up sender info — but for optimistic messages from
              // the current user, we already added them. For messages from others,
              // fetch sender profile.
              return prev; // will be updated below
            });

            // Fetch sender profile for the new message
            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", newRow.sender_id)
              .single();

            const fullMsg: GroupMessage = {
              id: newRow.id,
              sender_id: newRow.sender_id,
              sender_name: sender?.full_name ?? null,
              sender_avatar: sender?.avatar_url ?? null,
              content: newRow.content,
              created_at: newRow.created_at,
            };

            setMessages((prev) => {
              // Replace optimistic version or append
              const withoutOptimistic = prev.filter(
                (m) => m.id !== newRow.id && m.id !== `optimistic-${newRow.id}`
              );
              // Also remove any optimistic message with matching content from same sender
              const cleaned = withoutOptimistic.filter(
                (m) =>
                  !(
                    m.id.startsWith("optimistic-") &&
                    m.sender_id === newRow.sender_id &&
                    m.content === newRow.content
                  )
              );
              return [...cleaned, fullMsg];
            });
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) {
        supabaseRef.current.removeChannel(channel);
      }
    };
  }, []);

  // Send a message with optimistic UI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentUserId || !content.trim()) return;

      const supabase = supabaseRef.current;

      // Get user's group_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("group_id, full_name, avatar_url")
        .eq("id", currentUserId)
        .single();

      if (!profile?.group_id) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: GroupMessage = {
        id: optimisticId,
        sender_id: currentUserId,
        sender_name: profile.full_name,
        sender_avatar: profile.avatar_url,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      // Add optimistically
      setMessages((prev) => [...prev, optimisticMsg]);

      // Insert into database
      const { error } = await supabase.from("group_messages").insert({
        group_id: profile.group_id,
        sender_id: currentUserId,
        content: content.trim(),
      });

      if (error) {
        // Mark as failed — remove optimistic message
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticId)
        );
        console.error("Failed to send message:", error);
      }
      // On success, the Realtime subscription will replace the optimistic message
    },
    [currentUserId]
  );

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;

    const supabase = supabaseRef.current;
    const oldestTimestamp = messages[0].created_at;

    const { data, error } = await supabase.rpc("get_group_messages", {
      msg_limit: PAGE_SIZE,
      before_ts: oldestTimestamp,
    });

    if (!error && data) {
      const olderMsgs = data as GroupMessage[];
      setHasMore(olderMsgs.length === PAGE_SIZE);
      setMessages((prev) => [...olderMsgs, ...prev]);
    }
  }, [hasMore, messages]);

  return { messages, sendMessage, loadMore, hasMore, isLoading, currentUserId };
}
