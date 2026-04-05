/**
 * Action Source Adapter System
 *
 * This is the entry point for all external action source adapters.
 * Each external source gets its own file in this directory:
 *   - nationbuilder.ts
 *   - action-network.ts
 *   - actblue.ts
 *   - sosha.ts
 *
 * Adapters are the ONLY place in the codebase that knows about a
 * source's data shape. They receive a raw payload and return a
 * canonical action object. The rest of the codebase works exclusively
 * with the CanonicalAction type.
 *
 * This mirrors the pattern of lib/media-storage.ts — a single
 * abstraction layer that the rest of the app calls through.
 *
 * ────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW ADAPTER
 * ────────────────────────────────────────────────────────────
 * 1. Create a new file: src/lib/action-adapters/<source-name>.ts
 * 2. Implement the ActionSourceAdapter interface
 * 3. Register it in this file:
 *      import { MyAdapter } from './<source-name>'
 *      registerAdapter('source_name', new MyAdapter())
 * 4. The adapter's fetchActions() method receives the group's
 *    configuration (API keys, endpoints) and returns an array
 *    of CanonicalAction objects ready for upsert into the
 *    actions table with source = '<source_name>'.
 * 5. The optional verifyCompletion() method checks with the
 *    external system whether a member has completed an action,
 *    for sources that support API-verified completions.
 * ────────────────────────────────────────────────────────────
 */

import type { ActionSource, ActionType } from "@/lib/types";

/** The normalized shape every adapter must produce */
export interface CanonicalAction {
  source: ActionSource;
  source_id: string;
  source_data: Record<string, unknown>;
  type: ActionType;
  title: string;
  description: string | null;
  call_to_action: string | null;
  url: string | null;
  points_value: number;
  starts_at: string | null;
  ends_at: string | null;
}

/** Configuration passed to an adapter (API keys, endpoints, etc.) */
export interface AdapterConfig {
  api_key?: string;
  api_url?: string;
  slug?: string;
  [key: string]: unknown;
}

/** Interface every external source adapter must implement */
export interface ActionSourceAdapter {
  /** Fetch actions from the external source and return canonical objects */
  fetchActions(groupId: string, config: AdapterConfig): Promise<CanonicalAction[]>;

  /** Optional: verify with the external system that a member completed an action */
  verifyCompletion?(
    actionSourceId: string,
    memberExternalId: string,
    config: AdapterConfig
  ): Promise<boolean>;
}

/* ── Adapter Registry ── */

const adapters = new Map<ActionSource, ActionSourceAdapter>();

export function registerAdapter(source: ActionSource, adapter: ActionSourceAdapter): void {
  adapters.set(source, adapter);
}

export function getAdapter(source: ActionSource): ActionSourceAdapter | undefined {
  return adapters.get(source);
}

export function getRegisteredSources(): ActionSource[] {
  return Array.from(adapters.keys());
}
