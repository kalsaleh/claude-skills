import { buildDemoItems } from "./demo/fixture";
import { DEMO_COMPANY, DEMO_ROSTER, DEMO_YOU } from "./demo/roster";
import { buildNetworkModel, buildSnapshot, findPaths, type Identity, type NetworkModel } from "./insights/engine";
import type { NetworkSnapshot } from "./insights/types";
import { collectRelationships, getProvider } from "./providers";
import { MATCH_ALL_QUERY, ProviderError, type AddPeopleResult } from "./providers/types";

export type SessionStatus = "mapping" | "ready" | "error";

export type PublicSession = {
  id: string;
  status: SessionStatus;
  mode: "demo" | "live";
  company: string;
  youName: string;
  polls: number;
  message: string;
  add: AddPeopleResult;
  totalCount: number | null;
  roster: { name: string; slug: string; you: boolean }[];
  demoNotice: string | null;
  snapshot?: NetworkSnapshot;
  error?: string;
};

type Session = {
  id: string;
  mode: "demo" | "live";
  company: string;
  youName: string;
  youSlug: string;
  colleagueSlugs: string[];
  roster: PublicSession["roster"];
  demoNotice: string | null;
  add: AddPeopleResult;
  polls: number;
  lastTotal: number | null;
  stable: number;
  message: string;
  model?: NetworkModel;
  snapshot?: NetworkSnapshot;
  error?: string;
  status: SessionStatus;
};

const globalStore = globalThis as typeof globalThis & {
  __groundwaterSessions?: Map<string, Session>;
};

function store(): Map<string, Session> {
  if (!globalStore.__groundwaterSessions) globalStore.__groundwaterSessions = new Map();
  return globalStore.__groundwaterSessions;
}

export type SetupInput = {
  mode: "demo" | "live";
  company: string;
  yourName: string;
  yourSlug: string;
  colleagueSlugs: string[];
  rawUsernames: string[];
};

export async function createSession(input: SetupInput): Promise<PublicSession> {
  const demo = input.mode === "demo";
  const identity = demo ? demoIdentity() : liveIdentity(input);
  const provider = getProvider(input.mode);
  const usernames = demo ? DEMO_ROSTER.map((person) => person.url) : input.rawUsernames;
  const add = await provider.addPeople({ linkedinUsernames: usernames, group: "employees" });
  const session: Session = {
    id: crypto.randomUUID(),
    mode: input.mode,
    company: identity.company,
    youName: identity.youName,
    youSlug: identity.youSlug,
    colleagueSlugs: identity.colleagueSlugs,
    roster: demo
      ? DEMO_ROSTER.map((person) => ({ name: person.name, slug: person.slug, you: person.slug === DEMO_YOU.slug }))
      : [
          { name: input.yourName, slug: input.yourSlug, you: true },
          ...input.colleagueSlugs.map((slug) => ({ name: slug, slug, you: false })),
        ],
    demoNotice: demo
      ? "Demo mode uses a fictional Harbourline team. Nothing was sent to The Swarm."
      : null,
    add,
    polls: 0,
    lastTotal: null,
    stable: 0,
    message: demo
      ? "Sample connectors queued. Mapping the fictional network."
      : "Connectors accepted. The Swarm maps them in the background — often one to three minutes.",
    status: "mapping",
  };
  store().set(session.id, session);
  return publish(session);
}

export async function pollSession(id: string): Promise<PublicSession | null> {
  const session = store().get(id);
  if (!session) return null;
  if (session.status === "ready" || session.status === "error") return publish(session);

  session.polls += 1;
  try {
    if (session.mode === "demo") await advanceDemo(session);
    else await advanceLive(session);
  } catch (error) {
    session.status = "error";
    session.error = error instanceof ProviderError ? error.message : "The network request failed.";
    session.message = session.error;
  }
  return publish(session);
}

export function searchSession(id: string, query: string) {
  const session = store().get(id);
  if (!session?.model) return null;
  return findPaths(session.model, query);
}

async function advanceDemo(session: Session) {
  if (session.polls === 1) {
    session.lastTotal = 0;
    session.message = "Connectors queued. Waiting for the first profiles.";
    return;
  }
  if (session.polls === 2) {
    session.message = "First profiles are in. Still mapping the rest of the team.";
    session.lastTotal = 36;
    return;
  }
  const items = buildDemoItems();
  finish(session, items, items.length);
  session.message = "Mapping finished. Hidden ties are ready to review.";
}

async function advanceLive(session: Session) {
  const provider = getProvider("live");
  const probe = await provider.fetchRelationships({ query: MATCH_ALL_QUERY, limit: 10 });
  const total = probe.total_count;
  if (total > 0 && total === session.lastTotal) session.stable += 1;
  else session.stable = total > 0 ? 1 : 0;
  session.lastTotal = total;
  session.message =
    total === 0
      ? "Still mapping. A new connector often takes a minute or two before relationships appear."
      : `${total.toLocaleString("en-GB")} profiles so far. Waiting until the count settles.`;

  const settled = session.stable >= 2 || (session.polls >= 8 && total > 0);
  if (!settled) return;

  session.message = "Count has settled. Reading the full network…";
  const all = await collectRelationships(provider, MATCH_ALL_QUERY, { limit: 1000, maxPages: 15 });
  finish(session, all.items, all.total_count);
  session.message = "Mapping finished. Hidden ties are ready to review.";
}

function finish(session: Session, items: Parameters<typeof buildNetworkModel>[1]["items"], total: number) {
  const identity: Identity = {
    company: session.company,
    youName: session.youName,
    youSlug: session.youSlug,
    colleagueSlugs: session.colleagueSlugs,
  };
  session.model = buildNetworkModel(identity, { items, count: items.length, total_count: total });
  session.snapshot = buildSnapshot(session.model, session.mode);
  session.status = "ready";
  session.lastTotal = total;
}

function demoIdentity(): Identity {
  return {
    company: DEMO_COMPANY,
    youName: DEMO_YOU.name,
    youSlug: DEMO_YOU.slug,
    colleagueSlugs: DEMO_ROSTER.map((person) => person.slug),
  };
}

function liveIdentity(input: SetupInput): Identity {
  const slugs = [input.yourSlug, ...input.colleagueSlugs.filter((slug) => slug !== input.yourSlug)];
  return {
    company: input.company,
    youName: input.yourName,
    youSlug: input.yourSlug,
    colleagueSlugs: slugs,
  };
}

function publish(session: Session): PublicSession {
  return {
    id: session.id,
    status: session.status,
    mode: session.mode,
    company: session.company,
    youName: session.youName,
    polls: session.polls,
    message: session.message,
    add: session.add,
    totalCount: session.snapshot?.stats.totalCount ?? session.lastTotal,
    roster: session.roster,
    demoNotice: session.demoNotice,
    snapshot: session.snapshot,
    error: session.error,
  };
}
