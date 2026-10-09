import type {
  AddPeopleResult,
  ConnectionSource,
  ProfileConnection,
  RelationshipItem,
  RelationshipsResponse,
} from "./types";

/**
 * Coerce a Relationships payload into the canonical shape.
 *
 * Doubts this absorbs (see README):
 * - Conceptual docs still show a bare array and `user_id` / `strength_normalized`
 *   / `overlap_length`. OpenAPI and a live calibration use `items` and `connector_*`.
 * - `social_engagement` is not in the published origin enum; it is preserved.
 * - `graduation_year` is a string in OpenAPI and sometimes a number in practice.
 * - Add Connector's schema only lists `usernames_not_found`; live calls also
 *   returned `users_added` and `users_exist`.
 */

export function normalizeRelationships(payload: unknown): RelationshipsResponse {
  const record = asRecord(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(record?.items)
      ? record.items
      : record?.profile
        ? [payload]
        : [];

  const items = rawItems.map(normalizeItem).filter((item): item is RelationshipItem => item !== null);
  const total = numberOr(record?.total_count, items.length);
  const token = typeof record?.pagination_token === "string" ? record.pagination_token.trim() : "";

  return {
    items,
    count: numberOr(record?.count, items.length),
    total_count: total,
    ...(token ? { pagination_token: token } : {}),
  };
}

export function normalizeAddPeople(payload: unknown, httpStatus: number): AddPeopleResult {
  const record = asRecord(payload) ?? {};
  return {
    httpStatus,
    usersAdded: numberOr(record.users_added, 0),
    usersExist: numberOr(record.users_exist, 0),
    usernamesNotFound: stringList(record.usernames_not_found),
  };
}

function normalizeItem(value: unknown): RelationshipItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const profileRaw = asRecord(record.profile) ?? record;
  const fullName = stringOr(profileRaw.full_name);
  if (!fullName) return null;
  const connectionsRaw = Array.isArray(record.connections) ? record.connections : [];
  return {
    profile: {
      id: stringOr(profileRaw.id) || stableId(fullName),
      full_name: fullName,
      current_title: stringOr(profileRaw.current_title) || undefined,
      linkedin_url:
        stringOr(profileRaw.linkedin_url) ||
        linkedInFromSlug(stringOr(profileRaw.linkedin_slug)) ||
        undefined,
      current_company_name: stringOr(profileRaw.current_company_name) || undefined,
      current_company_website: stringOr(profileRaw.current_company_website) || undefined,
    },
    connections: connectionsRaw
      .map(normalizeConnection)
      .filter((connection): connection is ProfileConnection => connection !== null),
  };
}

function normalizeConnection(value: unknown): ProfileConnection | null {
  const record = asRecord(value);
  if (!record) return null;
  const name = stringOr(record.connector_name) || stringOr(record.user_name);
  const id = stringOr(record.connector_id) || stringOr(record.user_id);
  if (!name || !id) return null;
  const sourcesRaw = Array.isArray(record.sources) ? record.sources : [];
  const slug =
    stringOr(record.user_linkedin_slug) ||
    (looksLikeSlug(stringOr(record.user_linkedin_name)) ? stringOr(record.user_linkedin_name) : "");
  const linkedin =
    stringOr(record.connector_linkedin_url) || linkedInFromSlug(slug) || undefined;
  const normalized = Math.round(
    numberOr(record.connection_strength_normalized, numberOr(record.strength_normalized, 1)),
  );
  return {
    connector_id: id,
    connector_name: name,
    connector_linkedin_url: linkedin,
    connector_current_title:
      stringOr(record.connector_current_title) || stringOr(record.user_current_title) || undefined,
    connector_current_company_name:
      stringOr(record.connector_current_company_name) ||
      stringOr(record.user_current_company_name) ||
      undefined,
    connection_strength_normalized: normalized,
    connection_strength:
      typeof record.connection_strength === "number" ? record.connection_strength : undefined,
    sources: sourcesRaw
      .map(normalizeSource)
      .filter((source): source is ConnectionSource => source !== null),
  };
}

function normalizeSource(value: unknown): ConnectionSource | null {
  const record = asRecord(value);
  if (!record) return null;
  const origin = stringOr(record.origin);
  if (!origin) return null;
  const months =
    numberOrUndefined(record.overlap_duration_months) ?? parseOverlapLength(record.overlap_length);
  const year = record.graduation_year;
  return {
    origin,
    shared_company: stringOr(record.shared_company) || undefined,
    shared_company_website: stringOr(record.shared_company_website) || undefined,
    overlap_start_date: stringOr(record.overlap_start_date) || undefined,
    overlap_end_date: stringOr(record.overlap_end_date) || undefined,
    overlap_duration_months: months,
    shared_school: stringOr(record.shared_school) || undefined,
    shared_major: stringOr(record.shared_major) || undefined,
    graduation_year:
      typeof year === "number" ? String(year) : stringOr(year) || undefined,
    investor: stringOr(record.investor) || undefined,
    portfolio_company: stringOr(record.portfolio_company) || undefined,
  };
}

function parseOverlapLength(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return undefined;
  const years = /(\d+)\s*Y/i.exec(value);
  const months = /(\d+)\s*M/i.exec(value);
  if (!years && !months) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(numeric) : undefined;
  }
  return (years ? Number(years[1]) * 12 : 0) + (months ? Number(months[1]) : 0);
}

function linkedInFromSlug(slug: string): string {
  if (!slug) return "";
  return `https://www.linkedin.com/in/${slug}`;
}

function looksLikeSlug(value: string): boolean {
  return /^[a-z0-9-]{3,}$/i.test(value);
}

function stableId(name: string): string {
  return `profile:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringOr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
