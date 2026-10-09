/**
 * Provider-agnostic relationship graph.
 *
 * Swarm is the first implementation. A later People Data Labs or Coresignal
 * provider would fetch raw career histories and call `computeOverlaps` itself,
 * then adapt the result into this same response shape.
 *
 * Field names follow the v3 Relationships response the product was calibrated
 * against (`connector_*`, `connection_strength_normalized`). The normaliser
 * also accepts the older conceptual-doc names (`user_id`, `strength_normalized`).
 */

export const CONNECTION_ORIGINS = [
  "linkedin_connection",
  "work_overlap",
  "education_overlap",
  "shared_investor",
  "email_contact",
  "calendar_events",
  "manual_import",
  "social_engagement",
] as const;

export type KnownOrigin = (typeof CONNECTION_ORIGINS)[number];

/**
 * Origins the user already experiences directly. Everything else — including
 * `social_engagement`, which showed up in a live response but is absent from
 * the published enum — counts as a hidden signal.
 */
export const KNOWN_DIRECT_ORIGINS = new Set<string>([
  "linkedin_connection",
  "email_contact",
  "calendar_events",
  "manual_import",
]);

export function isHiddenOrigin(origin: string): boolean {
  return !KNOWN_DIRECT_ORIGINS.has(origin);
}

export type ConnectionSource = {
  origin: string;
  shared_company?: string;
  shared_company_website?: string;
  overlap_start_date?: string;
  overlap_end_date?: string;
  overlap_duration_months?: number;
  shared_school?: string;
  shared_major?: string;
  graduation_year?: string;
  investor?: string;
  portfolio_company?: string;
};

export type ProfileConnection = {
  connector_id: string;
  connector_name: string;
  connector_linkedin_url?: string;
  connector_current_title?: string;
  connector_current_company_name?: string;
  connection_strength_normalized: number;
  connection_strength?: number;
  sources: ConnectionSource[];
};

export type ConnectedProfile = {
  id: string;
  full_name: string;
  current_title?: string;
  linkedin_url?: string;
  current_company_name?: string;
  current_company_website?: string;
};

export type RelationshipItem = {
  profile: ConnectedProfile;
  connections: ProfileConnection[];
};

export type RelationshipsResponse = {
  items: RelationshipItem[];
  count: number;
  total_count: number;
  pagination_token?: string;
};

export type AddPeopleInput = {
  linkedinUsernames: string[];
  group?: "employees" | "investors" | "customers" | "portfolio" | "advisors" | "others";
};

export type AddPeopleResult = {
  httpStatus: number;
  usersAdded: number;
  usersExist: number;
  usernamesNotFound: string[];
};

export type FetchRelationshipsInput = {
  query: Record<string, unknown>;
  limit?: number;
  paginationToken?: string;
};

export interface RelationshipProvider {
  readonly id: "swarm" | "mock";
  addPeople(input: AddPeopleInput): Promise<AddPeopleResult>;
  fetchRelationships(input: FetchRelationshipsInput): Promise<RelationshipsResponse>;
}

export class ProviderError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

/** Default query: every profile connected to the team that owns the key. */
export const MATCH_ALL_QUERY: Record<string, unknown> = { match_all: {} };
