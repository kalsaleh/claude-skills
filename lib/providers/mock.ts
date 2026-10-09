import { linkedInSlug } from "../linkedin";
import { DEMO_ROSTER } from "../demo/roster";
import { buildDemoItems } from "../demo/fixture";
import type {
  AddPeopleInput,
  AddPeopleResult,
  FetchRelationshipsInput,
  RelationshipProvider,
  RelationshipsResponse,
} from "./types";

const PAGE_SIZE = 40;

let cachedItems: ReturnType<typeof buildDemoItems> | null = null;

function items() {
  if (!cachedItems) cachedItems = buildDemoItems();
  return cachedItems;
}

/** Demo provider. Speaks the Swarm response shape and never calls the network. */
export const mockProvider: RelationshipProvider = {
  id: "mock",
  async addPeople(input: AddPeopleInput): Promise<AddPeopleResult> {
    const known = new Set(DEMO_ROSTER.map((person) => person.slug));
    const missing = input.linkedinUsernames.filter((value) => {
      const slug = linkedInSlug(value);
      return !slug || !known.has(slug);
    });
    const found = input.linkedinUsernames.length - missing.length;
    return {
      httpStatus: found > 0 ? 202 : 200,
      usersAdded: found,
      usersExist: 0,
      usernamesNotFound: missing,
    };
  },
  async fetchRelationships(input: FetchRelationshipsInput): Promise<RelationshipsResponse> {
    const all = items();
    const offset = input.paginationToken ? Number(input.paginationToken) || 0 : 0;
    const limit = Math.min(Math.max(input.limit ?? PAGE_SIZE, 1), 1000);
    const page = all.slice(offset, offset + Math.min(limit, PAGE_SIZE));
    const next = offset + page.length < all.length ? String(offset + page.length) : undefined;
    return {
      items: page,
      count: page.length,
      total_count: all.length,
      ...(next ? { pagination_token: next } : {}),
    };
  },
};
