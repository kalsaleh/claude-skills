import { normalizeAddPeople, normalizeRelationships } from "./normalize";
import { ProviderError } from "./types";
import type {
  AddPeopleInput,
  AddPeopleResult,
  FetchRelationshipsInput,
  RelationshipProvider,
  RelationshipsResponse,
} from "./types";

const RELATIONSHIPS_URL = "https://bee.theswarm.com/v3/relationships";
const ADD_CONNECTOR_URL = "https://bee.theswarm.com/team/add-connector";

export class SwarmProvider implements RelationshipProvider {
  readonly id = "swarm" as const;

  constructor(private readonly apiKey: string) {
    if (!apiKey.trim()) {
      throw new ProviderError("SWARM_API_KEY is empty.", 500);
    }
  }

  async addPeople(input: AddPeopleInput): Promise<AddPeopleResult> {
    const response = await swarmFetch(ADD_CONNECTOR_URL, this.apiKey, {
      linkedin_usernames: input.linkedinUsernames,
      group: input.group ?? "employees",
    });
    return normalizeAddPeople(response.body, response.status);
  }

  async fetchRelationships(input: FetchRelationshipsInput): Promise<RelationshipsResponse> {
    const limit = Math.min(Math.max(input.limit ?? 1000, 1), 1000);
    const response = await swarmFetch(RELATIONSHIPS_URL, this.apiKey, {
      query: input.query,
      limit,
      ...(input.paginationToken ? { pagination_token: input.paginationToken } : {}),
    });
    if (response.status !== 200) {
      throw new ProviderError(errorMessage(response.status, response.body), response.status);
    }
    return normalizeRelationships(response.body);
  }
}

async function swarmFetch(
  url: string,
  apiKey: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new ProviderError(`The Swarm request failed: ${message}`, 502);
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { errors: [text.slice(0, 180)] };
    }
  }

  if (url === ADD_CONNECTOR_URL && response.status !== 200 && response.status !== 202) {
    throw new ProviderError(errorMessage(response.status, parsed), response.status);
  }
  return { status: response.status, body: parsed };
}

function errorMessage(status: number, body: unknown): string {
  if (status === 401 || status === 403) {
    return "The Swarm rejected the API key (401/403). Check SWARM_API_KEY on the server.";
  }
  if (status === 409) {
    return "The Swarm connector limit for this team has been reached.";
  }
  const record = body && typeof body === "object" ? (body as { errors?: unknown }) : null;
  const errors = Array.isArray(record?.errors) ? record.errors.map(String).join("; ") : "";
  const detail = errors ? ` ${errors.slice(0, 180)}` : "";
  return `The Swarm returned ${status}.${detail}`;
}
