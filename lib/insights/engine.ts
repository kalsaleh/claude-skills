import { formatMonth } from "../dates";
import { humaniseSlug, linkedInSlug } from "../linkedin";
import { normaliseOrg, orgsMatch } from "../org";
import { isHiddenOrigin, type ConnectionSource, type RelationshipsResponse } from "../providers/types";
import type {
  Evidence,
  GraphEdge,
  GraphPerson,
  Insight,
  NetworkGraph,
  NetworkSnapshot,
  NetworkStats,
  PathResult,
} from "./types";

export type Identity = {
  company: string;
  youName: string;
  youSlug: string;
  colleagueSlugs: string[];
};

type PersonNode = {
  key: string;
  profileId: string;
  name: string;
  title: string;
  company: string;
  website: string;
  slug: string | null;
  colleague: boolean;
  you: boolean;
};

type RelEdge = {
  id: string;
  a: string;
  b: string;
  strengthNormalized: number;
  sources: ConnectionSource[];
};

export type NetworkModel = {
  company: string;
  youName: string;
  youKey: string;
  people: PersonNode[];
  edges: RelEdge[];
  totalCount: number;
  profileCount: number;
};

const TIE_CAP = 10;
const CLUSTER_CAP = 6;
const BRIDGE_CAP = 8;

export function buildNetworkModel(identity: Identity, response: RelationshipsResponse): NetworkModel {
  const colleagueSlugs = new Set(identity.colleagueSlugs.map((slug) => slug.toLowerCase()));
  const people = new Map<string, PersonNode>();

  for (const slug of colleagueSlugs) {
    people.set(slug, {
      key: slug,
      profileId: "",
      name: slug === identity.youSlug ? identity.youName : humaniseSlug(slug),
      title: "",
      company: identity.company,
      website: "",
      slug,
      colleague: true,
      you: slug === identity.youSlug,
    });
  }

  const edges = new Map<string, RelEdge>();

  for (const item of response.items) {
    const profileKey = keyForProfile(item.profile, people, identity);
    const person = people.get(profileKey) ?? blankPerson(profileKey, item.profile.full_name);
    person.profileId = item.profile.id || person.profileId;
    person.name = item.profile.full_name || person.name;
    person.title = item.profile.current_title || person.title;
    person.company = item.profile.current_company_name || person.company;
    person.website = item.profile.current_company_website || person.website;
    person.slug = linkedInSlug(item.profile.linkedin_url) ?? person.slug;
    if (person.slug && colleagueSlugs.has(person.slug)) person.colleague = true;
    if (person.slug === identity.youSlug || namesEqual(person.name, identity.youName)) person.you = true;
    if (person.you) person.colleague = true;
    people.set(profileKey, person);

    for (const connection of item.connections) {
      const connectorKey = keyForConnector(connection, people, identity, colleagueSlugs);
      if (connectorKey === profileKey) continue;
      addEdge(edges, profileKey, connectorKey, connection.connection_strength_normalized, connection.sources);
    }
  }

  const you = [...people.values()].find((person) => person.you);
  return {
    company: identity.company,
    youName: you?.name || identity.youName,
    youKey: you?.key || identity.youSlug,
    people: [...people.values()],
    edges: [...edges.values()],
    totalCount: response.total_count,
    profileCount: response.items.length,
  };
}

export function buildSnapshot(model: NetworkModel, mode: "demo" | "live"): NetworkSnapshot {
  const insights = [
    ...colleagueTies(model).slice(0, TIE_CAP),
    ...sharedPast(model).slice(0, CLUSTER_CAP),
    ...bridges(model).slice(0, BRIDGE_CAP),
  ];
  return {
    mode,
    company: model.company,
    youName: model.youName,
    stats: statsFor(model),
    insights,
    graph: graphFor(model, insights),
  };
}

export function findPaths(model: NetworkModel, rawQuery: string): PathResult {
  const query = rawQuery.trim();
  if (query.length < 2) {
    return { query, insights: [], people: [], edges: [], note: "Type at least two characters." };
  }
  const needle = query.toLowerCase();
  const nameHits = model.people.filter(
    (person) => !person.you && person.name.toLowerCase().includes(needle),
  );
  const companyHits = model.people.filter(
    (person) => !person.colleague && person.company.toLowerCase().includes(needle),
  );
  const companyMode = companyHits.length >= 2 && (nameHits.length === 0 || companyHits.length > nameHits.length);
  const targets = companyMode ? companyHits : nameHits;
  if (targets.length === 0) {
    return {
      query,
      insights: [],
      people: [],
      edges: [],
      note: `No mapped profile matches “${query}”.`,
    };
  }

  const ranked = targets
    .map((target) => {
      const routes = routesTo(model, target.key);
      const best = routes[0];
      return { target, routes, best, score: best ? routeScore(model, best) : 0 };
    })
    .filter((row) => row.best)
    .sort((a, b) => b.score - a.score || b.best!.edge.strengthNormalized - a.best!.edge.strengthNormalized);

  const worthy = ranked.filter((row) => row.score >= 0.7);
  const chosen = (worthy.length > 0 ? worthy : ranked.slice(0, 1)).slice(0, 3);
  if (chosen.length === 0) {
    return {
      query,
      insights: [],
      people: [],
      edges: [],
      note: `People at that name are in the network, but none of your colleagues reach them.`,
    };
  }

  const linkedinFootnote = companyMode ? linkedinOnlyDoor(model, companyHits) : null;
  const insights = chosen.map((row, index) =>
    pathInsight(model, row.target, row.best!, index === 0 ? linkedinFootnote : null),
  );
  const graph = graphFor(model, insights, chosen.map((row) => row.target.key));
  return { query, insights, people: graph.people, edges: graph.edges };
}

function colleagueTies(model: NetworkModel): Insight[] {
  const insights: Insight[] = [];
  for (const edge of model.edges) {
    const a = person(model, edge.a);
    const b = person(model, edge.b);
    if (!a || !b || !a.colleague || !b.colleague) continue;
    if (!edge.sources.some((source) => isHiddenOrigin(source.origin))) continue;
    const userInvolved = a.you || b.you;
    if (userInvolved && edge.sources.some((source) => source.origin === "linkedin_connection")) continue;

    const origins = new Set(edge.sources.map((source) => source.origin));
    let surprise = 0.42;
    if (origins.has("social_engagement") && !origins.has("work_overlap") && !origins.has("linkedin_connection")) {
      surprise += 0.46;
    }
    if (origins.has("work_overlap") && !origins.has("linkedin_connection")) surprise += 0.28;
    if (origins.has("education_overlap") && !origins.has("linkedin_connection")) surprise += 0.22;
    if (!origins.has("linkedin_connection")) surprise += 0.1;
    const strength = edgeStrength(edge);
    const left = short(a, [a, b]);
    const right = short(b, [a, b]);
    insights.push({
      id: `tie:${[a.key, b.key].sort().join(":")}`,
      kind: "colleague_tie",
      title: tieTitle(left, right, origins),
      body: tieBody(a, b, edge),
      surprise: clamp(surprise),
      strength,
      evidence: evidenceFor(edge, a.name, b.name),
      personIds: [a.key, b.key],
      edgeIds: [edge.id],
    });
  }
  return insights.sort(byScore);
}

function sharedPast(model: NetworkModel): Insight[] {
  const groups = new Map<
    string,
    {
      company: string;
      members: Set<string>;
      sources: ConnectionSource[];
      colleagueSources: ConnectionSource[];
      edgeIds: string[];
    }
  >();

  for (const edge of model.edges) {
    const left = person(model, edge.a);
    const right = person(model, edge.b);
    const bothColleagues = Boolean(left?.colleague && right?.colleague);
    for (const source of edge.sources) {
      if (source.origin !== "work_overlap" || !source.shared_company) continue;
      if (orgsMatch(source.shared_company, model.company)) continue;
      const key = normaliseOrg(source.shared_company);
      const group = groups.get(key) ?? {
        company: source.shared_company,
        members: new Set<string>(),
        sources: [],
        colleagueSources: [],
        edgeIds: [],
      };
      group.members.add(edge.a);
      group.members.add(edge.b);
      group.sources.push(source);
      if (bothColleagues) group.colleagueSources.push(source);
      if (!group.edgeIds.includes(edge.id)) group.edgeIds.push(edge.id);
      groups.set(key, group);
    }
  }

  const insights: Insight[] = [];
  for (const [key, group] of groups) {
    const members = [...group.members].map((id) => person(model, id)).filter((item): item is PersonNode => !!item);
    const colleagues = members.filter((item) => item.colleague);
    if (colleagues.length < 2) continue;
    const externals = members.filter((item) => !item.colleague);
    const youIn = members.some((item) => item.you);
    const dated = group.colleagueSources.length > 0 ? group.colleagueSources : group.sources;
    const months = Math.max(...dated.map((source) => source.overlap_duration_months ?? 0));
    const strength = clamp(0.35 + Math.min(months / 60, 1) * 0.65);
    const surprise = youIn ? 0.4 : 0.78;
    const colleagueNames = colleagues.map((item) => item.name);
    const externalNames = externals.map((item) => item.name);
    const span = dateSpan(dated);
    insights.push({
      id: `cluster:${key}`,
      kind: "shared_past",
      title: `${group.company} alumni bloc`,
      body: clusterBody(group.company, colleagueNames, externalNames, span, months, youIn),
      surprise,
      strength,
      evidence: [
        {
          origin: "work_overlap",
          text: span
            ? `Colleagues overlapped at ${group.company}, ${span}${months ? ` (${months} months)` : ""}.`
            : `Shared employer: ${group.company}.`,
        },
        ...colleagues.slice(0, 4).map((item) => ({
          origin: "work_overlap",
          text: `${item.name} is one of the colleagues in this bloc.`,
        })),
      ],
      personIds: members.map((item) => item.key),
      edgeIds: group.edgeIds,
    });
  }
  return insights.sort(byScore);
}

function bridges(model: NetworkModel): Insight[] {
  const insights: Insight[] = [];
  for (const node of model.people) {
    if (node.you) continue;
    const links = colleagueLinks(model, node.key);
    if (links.length < 2) continue;
    const hidden = links.filter((link) => link.edge.sources.some((source) => isHiddenOrigin(source.origin)));
    if (node.colleague && hidden.length === 0) continue;

    const linkedinToYou = links.some(
      (link) => link.other.you && link.edge.sources.some((source) => source.origin === "linkedin_connection"),
    );
    let surprise = node.colleague ? 0.36 : 0.58;
    surprise += 0.12 * Math.min(hidden.length, 3);
    if (!node.colleague && hidden.length >= 2 && !linkedinToYou) surprise += 0.14;
    if (linkedinToYou) surprise -= 0.1;
    const strength =
      hidden.length > 0
        ? hidden.reduce((sum, link) => sum + edgeStrength(link.edge), 0) / hidden.length
        : links.reduce((sum, link) => sum + edgeStrength(link.edge), 0) / links.length;

    const named = [...hidden, ...links.filter((link) => !hidden.includes(link))];
    const shown = named.slice(0, 3);
    const titleNames = shown.map((link) => short(link.other, [node, ...shown.map((item) => item.other)]));
    insights.push({
      id: `bridge:${node.key}`,
      kind: "bridge",
      title: `${node.name} sits between ${joinNames(titleNames)}`,
      body: bridgeBody(model, node, links, linkedinToYou),
      surprise: clamp(surprise),
      strength: clamp(strength),
      evidence: links.slice(0, 4).flatMap((link) => evidenceFor(link.edge, node.name, link.other.name).slice(0, 1)),
      personIds: [node.key, ...links.map((link) => link.other.key)],
      edgeIds: links.map((link) => link.edge.id),
    });
  }
  return insights.sort(byScore);
}

function pathInsight(
  model: NetworkModel,
  target: PersonNode,
  best: { edge: RelEdge; colleague: PersonNode },
  footnote: { name: string; company: string } | null,
): Insight {
  const viaYou = best.colleague.you;
  const evidence = evidenceFor(best.edge, best.colleague.name, target.name);
  const where = target.company ? ` at ${target.company}` : "";
  let body = viaYou
    ? `The only strong route on file is your own tie to ${target.name}${where}.`
    : `Strongest route to ${target.name}${where} runs through ${best.colleague.name}, not through a direct line of yours.`;
  body = `${body} ${evidence[0]?.text ?? ""}`.trim();
  if (footnote && footnote.name !== target.name) {
    body += ` You already have a LinkedIn connection to ${footnote.name} at ${footnote.company}. It is the obvious door, and a thinner one.`;
  }
  const youEdge = model.edges.find(
    (edge) =>
      (edge.a === model.youKey && edge.b === best.colleague.key) ||
      (edge.b === model.youKey && edge.a === best.colleague.key),
  );
  const edgeIds = [best.edge.id, ...(youEdge && !viaYou ? [youEdge.id] : [])];
  const personIds = [target.key, best.colleague.key];
  if (!viaYou) personIds.push(model.youKey);
  return {
    id: `path:${target.key}`,
    kind: "path",
    title: viaYou ? `You already reach ${target.name}` : `Route to ${target.name} through ${short(best.colleague, [best.colleague, target])}`,
    body,
    surprise: viaYou ? 0.2 : clamp(0.55 + (best.edge.sources.some((source) => isHiddenOrigin(source.origin)) ? 0.3 : 0)),
    strength: edgeStrength(best.edge),
    evidence,
    personIds,
    edgeIds,
  };
}

function graphFor(model: NetworkModel, insights: Insight[], extraIds: string[] = []): NetworkGraph {
  const bridgeSubjects = new Set(
    insights.filter((insight) => insight.kind === "bridge").map((insight) => insight.personIds[0]),
  );
  const include = new Set<string>(model.people.filter((person) => person.colleague).map((person) => person.key));
  for (const insight of insights) for (const id of insight.personIds) include.add(id);
  for (const id of extraIds) include.add(id);

  const people: GraphPerson[] = [...include]
    .map((id) => person(model, id))
    .filter((node): node is PersonNode => !!node)
    .map((node) => ({
      id: node.key,
      name: node.name,
      role: node.title || (node.colleague ? "Colleague" : "Profile"),
      company: node.company,
      kind: node.you ? "you" : node.colleague ? "colleague" : bridgeSubjects.has(node.key) ? "bridge" : "contact",
      insightIds: insights.filter((insight) => insight.personIds.includes(node.key)).map((insight) => insight.id),
    }));

  const edges: GraphEdge[] = model.edges
    .filter((edge) => include.has(edge.a) && include.has(edge.b))
    .map((edge) => {
      const hidden = edge.sources.some((source) => isHiddenOrigin(source.origin));
      const insightIds = insights.filter((insight) => insight.edgeIds.includes(edge.id)).map((insight) => insight.id);
      return {
        id: edge.id,
        source: edge.a,
        target: edge.b,
        strength: visualStrength(edge.strengthNormalized, hidden),
        hidden,
        label: edge.sources.map((source) => originLabel(source.origin)).join(" · "),
        insightIds,
      };
    });

  return { people, edges };
}

function statsFor(model: NetworkModel): NetworkStats {
  const sourceCounts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const edge of model.edges) {
    for (const source of edge.sources) {
      const key = `${edge.id}|${source.origin}|${source.shared_company ?? ""}|${source.shared_school ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sourceCounts[source.origin] = (sourceCounts[source.origin] ?? 0) + 1;
    }
  }
  const companies = new Map<string, number>();
  for (const node of model.people) {
    if (node.colleague || !node.company) continue;
    companies.set(node.company, (companies.get(node.company) ?? 0) + 1);
  }
  const topCompanies = [...companies.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);
  return {
    totalCount: model.totalCount,
    profileCount: model.profileCount,
    connectorCount: model.people.filter((person) => person.colleague).length,
    sourceCounts,
    topCompanies,
  };
}

function routesTo(model: NetworkModel, targetKey: string) {
  const routes: { edge: RelEdge; colleague: PersonNode }[] = [];
  for (const edge of model.edges) {
    const otherKey = edge.a === targetKey ? edge.b : edge.b === targetKey ? edge.a : null;
    if (!otherKey) continue;
    const colleague = person(model, otherKey);
    if (!colleague?.colleague) continue;
    routes.push({ edge, colleague });
  }
  return routes.sort((a, b) => routeScore(model, b) - routeScore(model, a));
}

function routeScore(model: NetworkModel, route: { edge: RelEdge; colleague: PersonNode }): number {
  const hidden = route.edge.sources.some((source) => isHiddenOrigin(source.origin));
  const linkedinOnly = route.edge.sources.every((source) => source.origin === "linkedin_connection");
  let score = edgeStrength(route.edge);
  if (hidden) score += 0.35;
  if (route.edge.strengthNormalized >= 3) score += 0.15;
  const months = maxMonths(route.edge);
  if (hidden && months > 0 && months < 12) score *= 0.55;
  if (linkedinOnly && route.colleague.you) score *= 0.35;
  else if (linkedinOnly) score *= 0.7;
  if (route.colleague.key === model.youKey && linkedinOnly) score *= 0.8;
  return score;
}

function linkedinOnlyDoor(model: NetworkModel, companyHits: PersonNode[]) {
  for (const target of companyHits) {
    for (const edge of model.edges) {
      const otherKey = edge.a === target.key ? edge.b : edge.b === target.key ? edge.a : null;
      if (otherKey !== model.youKey) continue;
      if (!edge.sources.every((source) => source.origin === "linkedin_connection")) continue;
      return { name: target.name, company: target.company };
    }
  }
  return null;
}

function colleagueLinks(model: NetworkModel, key: string) {
  const links: { edge: RelEdge; other: PersonNode }[] = [];
  for (const edge of model.edges) {
    const otherKey = edge.a === key ? edge.b : edge.b === key ? edge.a : null;
    if (!otherKey) continue;
    const other = person(model, otherKey);
    if (!other?.colleague) continue;
    links.push({ edge, other });
  }
  return links.sort((a, b) => edgeStrength(b.edge) - edgeStrength(a.edge));
}

function evidenceFor(edge: RelEdge, aName: string, bName: string): Evidence[] {
  return edge.sources.map((source) => ({ origin: source.origin, text: describeSource(source, aName, bName) }));
}

function describeSource(source: ConnectionSource, aName: string, bName: string): string {
  if (source.origin === "work_overlap") {
    const start = formatMonth(source.overlap_start_date);
    const end = formatMonth(source.overlap_end_date);
    const span = start && end ? ` from ${start} to ${end}` : "";
    const months = source.overlap_duration_months ? ` (${source.overlap_duration_months} months)` : "";
    const company = source.shared_company ?? "a shared employer";
    return `${aName} and ${bName} overlapped at ${company}${span}${months}.`;
  }
  if (source.origin === "education_overlap") {
    const major = source.shared_major ? `, ${source.shared_major}` : "";
    const year = source.graduation_year ? `, classes ${source.graduation_year}` : "";
    return `${aName} and ${bName} both attended ${source.shared_school ?? "the same school"}${major}${year}.`;
  }
  if (source.origin === "social_engagement") {
    return `${aName} and ${bName} engage with each other in public. There is no LinkedIn connection on this tie.`;
  }
  if (source.origin === "linkedin_connection") {
    return `${aName} and ${bName} are already connected on LinkedIn.`;
  }
  if (source.origin === "shared_investor") {
    return `${aName} and ${bName} share an investor${source.investor ? ` (${source.investor})` : ""}.`;
  }
  return `${originLabel(source.origin)} links ${aName} and ${bName}.`;
}

function tieTitle(left: string, right: string, origins: Set<string>): string {
  if (origins.has("social_engagement") && !origins.has("work_overlap")) {
    return `${left} and ${right} interact in public`;
  }
  if (origins.has("work_overlap") && origins.has("education_overlap")) {
    return `${left} and ${right} share work and a school`;
  }
  if (origins.has("education_overlap")) return `${left} and ${right} share a school`;
  return `${left} and ${right} share a past employer`;
}

function tieBody(a: PersonNode, b: PersonNode, edge: RelEdge): string {
  const origins = new Set(edge.sources.map((source) => source.origin));
  if (origins.has("social_engagement") && !origins.has("work_overlap") && !origins.has("linkedin_connection")) {
    return `${a.name} and ${b.name} are not LinkedIn connections. The signal is public social engagement — the kind of tie that never shows up in an all-hands.`;
  }
  const work = edge.sources.find((source) => source.origin === "work_overlap");
  const school = edge.sources.find((source) => source.origin === "education_overlap");
  const parts = [`${a.name} and ${b.name} are colleagues now, and they are not on each other's LinkedIn.`];
  if (work?.shared_company) {
    parts.push(
      `They overlapped at ${work.shared_company}${
        work.overlap_duration_months ? ` for ${work.overlap_duration_months} months` : ""
      }.`,
    );
  }
  if (school?.shared_school) parts.push(`They also share ${school.shared_school}.`);
  return parts.join(" ");
}

function clusterBody(
  company: string,
  colleagues: string[],
  externals: string[],
  span: string | null,
  months: number,
  youIn: boolean,
): string {
  const who = joinNames(colleagues);
  const extra =
    externals.length === 0
      ? ""
      : ` Also in the bloc: ${joinNames(externals.slice(0, 5))}${externals.length > 5 ? `, and ${externals.length - 5} more` : ""}.`;
  const you = youIn ? " You are in this one, so part of it will feel familiar." : " You were not there.";
  const when = span ? ` (${span}${months ? `, ${months} months` : ""})` : "";
  return `${who} overlapped at ${company}${when}.${you}${extra}`;
}

function bridgeBody(
  model: NetworkModel,
  node: PersonNode,
  links: { edge: RelEdge; other: PersonNode }[],
  linkedinToYou: boolean,
): string {
  const hidden = links.filter((link) => link.edge.sources.some((source) => isHiddenOrigin(source.origin)));
  const focus = (hidden.length > 0 ? hidden : links).slice(0, 3);
  const via = focus
    .map((link) => {
      const source = link.edge.sources.find((item) => isHiddenOrigin(item.origin)) ?? link.edge.sources[0];
      return `${link.other.name} (${originLabel(source?.origin ?? "connection").toLowerCase()})`;
    })
    .join(", ");
  const place = node.company ? ` ${node.name} is at ${node.company}.` : "";
  const known = linkedinToYou
    ? " You already have them on LinkedIn; the hidden part is which other colleagues they also reach."
    : " You do not have a LinkedIn connection to them.";
  const role = node.colleague ? `${node.name} is inside the company and still sits on a hidden seam.` : `${node.name} is outside the company.`;
  return `${role}${place} Connected to ${via}.${known}`.replace(/\s+/g, " ").trim();
}

function dateSpan(sources: ConnectionSource[]): string | null {
  const starts = sources.map((source) => source.overlap_start_date).filter((value): value is string => !!value).sort();
  const ends = sources.map((source) => source.overlap_end_date).filter((value): value is string => !!value).sort();
  if (starts.length === 0 || ends.length === 0) return null;
  const start = formatMonth(starts[0]);
  const end = formatMonth(ends[ends.length - 1]);
  if (!start || !end) return null;
  return `${start} – ${end}`;
}

function edgeStrength(edge: RelEdge): number {
  const norm = Math.min(Math.max(edge.strengthNormalized, 1), 3) / 3;
  const months = maxMonths(edge);
  const monthScore = months > 0 ? Math.min(months / 48, 1) : 0.35;
  const hidden = edge.sources.some((source) => isHiddenOrigin(source.origin)) ? 1 : 0.25;
  return clamp(0.45 * norm + 0.35 * monthScore + 0.2 * hidden);
}

function maxMonths(edge: RelEdge): number {
  return edge.sources.reduce((max, source) => Math.max(max, source.overlap_duration_months ?? 0), 0);
}

function visualStrength(normalized: number, hidden: boolean): 1 | 2 | 3 | 4 | 5 {
  if (hidden && normalized >= 3) return 5;
  if (normalized >= 3) return 4;
  if (normalized === 2) return 3;
  if (hidden) return 3;
  return 2;
}

function byScore(a: Insight, b: Insight): number {
  const score = (insight: Insight) => insight.surprise * 0.62 + insight.strength * 0.38;
  return score(b) - score(a) || a.title.localeCompare(b.title);
}

function person(model: NetworkModel, key: string): PersonNode | undefined {
  return model.people.find((item) => item.key === key);
}

function short(node: PersonNode, peers: PersonNode[]): string {
  const first = node.name.split(" ")[0] || node.name;
  const collision = peers.some((peer) => peer.key !== node.key && (peer.name.split(" ")[0] || peer.name) === first);
  return collision ? node.name : first;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function originLabel(origin: string): string {
  switch (origin) {
    case "linkedin_connection":
      return "LinkedIn";
    case "work_overlap":
      return "Work overlap";
    case "education_overlap":
      return "Education overlap";
    case "social_engagement":
      return "Social engagement";
    case "shared_investor":
      return "Shared investor";
    case "email_contact":
      return "Email";
    case "calendar_events":
      return "Calendar";
    case "manual_import":
      return "Manual import";
    default:
      return origin.replaceAll("_", " ");
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function namesEqual(a: string, b: string): boolean {
  return normaliseOrg(a) === normaliseOrg(b) && normaliseOrg(a).length > 0;
}

function keyForProfile(
  profile: RelationshipsResponse["items"][number]["profile"],
  people: Map<string, PersonNode>,
  identity: Identity,
): string {
  const slug = linkedInSlug(profile.linkedin_url);
  if (slug && people.has(slug)) return slug;
  const match = [...people.values()].find(
    (personNode) =>
      personNode.colleague &&
      (namesEqual(personNode.name, profile.full_name) ||
        (personNode.slug ? namesEqual(humaniseSlug(personNode.slug), profile.full_name) : false)),
  );
  if (match) return match.key;
  if (namesEqual(profile.full_name, identity.youName)) {
    const you = [...people.values()].find((personNode) => personNode.you);
    if (you) return you.key;
  }
  return slug || profile.id;
}

function keyForConnector(
  connection: RelationshipsResponse["items"][number]["connections"][number],
  people: Map<string, PersonNode>,
  identity: Identity,
  colleagueSlugs: Set<string>,
): string {
  const slug = linkedInSlug(connection.connector_linkedin_url);
  if (slug && (people.has(slug) || colleagueSlugs.has(slug))) {
    if (!people.has(slug)) {
      people.set(slug, blankColleague(slug, connection.connector_name, identity));
    }
    return slug;
  }
  const byName = [...people.values()].find(
    (personNode) => personNode.colleague && namesEqual(personNode.name, connection.connector_name),
  );
  if (byName) return byName.key;
  const key = `connector:${connection.connector_id}`;
  if (!people.has(key)) {
      const you = namesEqual(connection.connector_name, identity.youName);
    people.set(key, {
      key,
      profileId: connection.connector_id,
      name: connection.connector_name,
      title: connection.connector_current_title ?? "",
      company: connection.connector_current_company_name ?? "",
      website: "",
      slug,
      colleague: you,
      you,
    });
  }
  return key;
}

function blankPerson(key: string, name: string): PersonNode {
  return {
    key,
    profileId: "",
    name,
    title: "",
    company: "",
    website: "",
    slug: linkedInSlug(key) ? key : null,
    colleague: false,
    you: false,
  };
}

function blankColleague(slug: string, name: string, identity: Identity): PersonNode {
  return {
    key: slug,
    profileId: "",
    name: name || (slug === identity.youSlug ? identity.youName : humaniseSlug(slug)),
    title: "",
    company: identity.company,
    website: "",
    slug,
    colleague: true,
    you: slug === identity.youSlug || namesEqual(name, identity.youName),
  };
}

function addEdge(
  edges: Map<string, RelEdge>,
  a: string,
  b: string,
  strengthNormalized: number,
  sources: ConnectionSource[],
) {
  const [left, right] = a < b ? [a, b] : [b, a];
  const id = `${left}__${right}`;
  const existing = edges.get(id);
  if (!existing) {
    edges.set(id, { id, a: left, b: right, strengthNormalized, sources: dedupeSources(sources) });
    return;
  }
  existing.strengthNormalized = Math.max(existing.strengthNormalized, strengthNormalized);
  existing.sources = dedupeSources([...existing.sources, ...sources]);
}

function dedupeSources(sources: ConnectionSource[]): ConnectionSource[] {
  const seen = new Set<string>();
  const result: ConnectionSource[] = [];
  for (const source of sources) {
    const key = [source.origin, source.shared_company, source.shared_school, source.overlap_start_date, source.graduation_year].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}
