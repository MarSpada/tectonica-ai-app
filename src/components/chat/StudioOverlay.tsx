"use client";

import { useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";

interface StudioOverlayProps {
  imageUrl: string | null;
  orgClientId: string;
  onClose: () => void;
}

/**
 * Full-screen overlay that opens the Railway Studio visual editor in an iframe.
 *
 * Known limitation: Studio is a one-way integration. Members can edit images
 * in Studio but results are not automatically saved back to the chat or Media Library.
 * This requires a backend change on the Railway Studio side to support arbitrary
 * callback URLs.
 */
export default function StudioOverlay({
  imageUrl,
  orgClientId,
  onClose,
}: StudioOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!imageUrl) return null;

  const studioUrl = new URL(
    "https://qwen-image-editor-production-49d4.up.railway.app/standalone/studio"
  );
  studioUrl.searchParams.set("user_id", orgClientId);
  studioUrl.searchParams.set("imageUrl", imageUrl);

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.95)" }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[51] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        title="Close Studio (Esc)"
      >
        <Icon name="close" size={24} color="#ffffff" />
      </button>

      {/* Studio iframe */}
      <iframe
        src={studioUrl.toString()}
        className="w-full h-full border-0"
        allow="camera;microphone;clipboard-write;fullscreen"
        title="Image Studio"
      />
    </div>
  );
}
