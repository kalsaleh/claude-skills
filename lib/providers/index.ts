import { mockProvider } from "./mock";
import { SwarmProvider } from "./swarm";
import { ProviderError, type RelationshipProvider, type RelationshipsResponse } from "./types";

export function liveKeyConfigured(): boolean {
  return Boolean(process.env.SWARM_API_KEY?.trim());
}

export function getProvider(mode: "demo" | "live"): RelationshipProvider {
  if (mode === "demo") return mockProvider;
  const key = process.env.SWARM_API_KEY?.trim();
  if (!key) {
    throw new ProviderError(
      "SWARM_API_KEY is not set on the server. Use demo mode, or add the key to the environment.",
      400,
    );
  }
  return new SwarmProvider(key);
}

/** Follow pagination_token until the API stops issuing one. Caps the page count. */
export async function collectRelationships(
  provider: RelationshipProvider,
  query: Record<string, unknown>,
  options?: { limit?: number; maxPages?: number },
): Promise<RelationshipsResponse> {
  const items: RelationshipsResponse["items"] = [];
  const seenTokens = new Set<string>();
  let token: string | undefined;
  let total = 0;
  const maxPages = options?.maxPages ?? 15;
  const limit = options?.limit ?? 1000;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await provider.fetchRelationships({ query, limit, paginationToken: token });
    total = response.total_count || total;
    items.push(...response.items);
    const next = response.pagination_token;
    if (!next || seenTokens.has(next) || response.items.length === 0) break;
    seenTokens.add(next);
    token = next;
  }

  return {
    items,
    count: items.length,
    total_count: total || items.length,
  };
}
