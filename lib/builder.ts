import { enrichmentAssistant } from "./enrichment-assistant";
import { suggestTeam } from "./suggest";
import type {
  ConnectionRow,
  Edge,
  Enrichment,
  MatterRole,
  Person,
  PersonTag,
  Profile,
  TieStrength,
  Workplace,
} from "./types";
import { annotateNetwork } from "./network";

export function normaliseCompany(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(the|ltd|limited|llc|inc|plc|co|corp|corporation)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function isSameCompany(a: string, b: string) {
  const left = normaliseCompany(a);
  const right = normaliseCompany(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function slug(value: string, index: number) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base ? `${base}-${index}` : `person-${index}`;
}

function matterTag(matter: MatterRole): PersonTag[] {
  if (matter === "sponsor") return ["sponsor"];
  if (matter === "broker") return ["broker"];
  if (matter === "decision_maker") return ["manager"];
  return [];
}

function tieEdge(tie: TieStrength): { strength: Edge["strength"]; kind: Edge["kind"] } {
  if (tie === "strong") return { strength: 5, kind: "collaborates" };
  if (tie === "working") return { strength: 3, kind: "collaborates" };
  return { strength: 2, kind: "weak" };
}

export function peopleFromConnections(rows: ConnectionRow[], profile: Profile): Person[] {
  const youDept = suggestTeam(`${profile.role} ${profile.team}`).team;
  const you: Person = {
    id: "you",
    name: profile.name,
    role: profile.role,
    team: profile.team,
    department: youDept,
    company: profile.company,
    layer: "workplace",
    you: true,
    bio: "You. LinkedIn proved the links; you name what they mean.",
    groups: ["imported-you"],
  };

  const others = rows.map((row, index) => {
    const workplace = isSameCompany(row.company, profile.company);
    const department = suggestTeam(row.role).team;
    const person: Person = {
      id: slug(row.name, index + 1),
      name: row.name,
      role: row.role,
      team: row.company,
      department,
      company: row.company,
      layer: workplace ? "workplace" : "personal",
      bio: row.email
        ? `Imported contact · ${row.email}`
        : `Imported from ${row.company}.`,
      groups: [workplace ? "workplace" : "personal"],
    };
    return person;
  });

  return [you, ...others];
}

export function layerCounts(people: Person[]) {
  const workplace = people.filter((person) => !person.you && person.layer === "workplace").length;
  const personal = people.filter((person) => !person.you && person.layer === "personal").length;
  return { workplace, personal, total: workplace + personal };
}

export function namedRoleCount(people: Person[]) {
  return people.filter(
    (person) =>
      !person.you &&
      person.enrichment?.matter &&
      person.enrichment.matter !== "skip",
  ).length;
}

export const INSIGHTS_MIN = 5;

export function applyEnrichment(
  person: Person,
  enrichment: Enrichment,
  profile: Profile,
): Person {
  const suggestion = enrichment.suggestion ?? enrichmentAssistant.suggest(person, profile);
  const tags: PersonTag[] = [
    ...matterTag(enrichment.matter),
    ...(enrichment.tie === "weak" ? (["weak-tie"] as PersonTag[]) : []),
  ];
  return {
    ...person,
    department: enrichment.team,
    team: enrichment.team,
    tags,
    enrichment: { ...enrichment, suggestion },
  };
}

function remember(
  edges: Edge[],
  source: string,
  target: string,
  strength: Edge["strength"],
  kind: Edge["kind"],
  label?: string,
) {
  const [a, b] = source < target ? [source, target] : [target, source];
  const id = `${a}__${b}__${kind}`;
  if (edges.some((edge) => edge.id === id)) return;
  edges.push({ id, source, target, strength, kind, label });
}

export function workplaceFromBuilder(
  people: Person[],
  profile: Profile,
  options: {
    includeWorkplace: boolean;
    includePersonal: boolean;
    skipped: boolean;
  },
): Workplace {
  const visible = people.filter((person) => {
    if (person.you) return true;
    if (person.layer === "workplace") return options.includeWorkplace;
    return options.includePersonal;
  });

  const edges: Edge[] = [];
  const workplaceIds = visible
    .filter((person) => person.layer === "workplace" && !person.you)
    .map((person) => person.id);

  for (const person of visible) {
    if (person.you) continue;
    const tie = person.enrichment?.tie ?? "weak";
    const spec = tieEdge(tie);
    const label =
      person.layer === "personal"
        ? "personal layer"
        : person.enrichment
          ? `${person.enrichment.matter} · ${tie}`
          : "un-named tie";
    remember(edges, "you", person.id, spec.strength, spec.kind, label);
  }

  for (let i = 0; i < workplaceIds.length; i += 1) {
    const next = workplaceIds[(i + 1) % workplaceIds.length];
    if (workplaceIds.length > 1) {
      remember(edges, workplaceIds[i], next, 3, "collaborates", profile.company);
    }
    if (i + 2 < workplaceIds.length) {
      remember(edges, workplaceIds[i], workplaceIds[i + 2], 2, "collaborates", profile.company);
    }
  }

  const named = namedRoleCount(visible);
  const workplace: Workplace = {
    version: 1,
    onboarded: true,
    source: "csv",
    workplaceName: profile.company || "Imported connections",
    workplaceBlurb: options.skipped
      ? "You skipped naming people. LinkedIn proved the links; the map is quiet until you say what they mean."
      : `Built from Connections.csv. ${named} colleague${named === 1 ? " has" : "s have"} a named role.`,
    profile,
    people: visible,
    edges,
    groups: [
      {
        id: "workplace",
        name: profile.company || "Workplace",
        blurb: "Same-company layer from the export.",
        memberIds: visible.filter((person) => person.layer === "workplace").map((person) => person.id),
      },
      {
        id: "personal",
        name: "Personal layer",
        blurb: "Connections outside the onboarding company.",
        memberIds: visible.filter((person) => person.layer === "personal").map((person) => person.id),
      },
    ],
    company: profile.company,
    includePersonal: options.includePersonal,
    includeWorkplace: options.includeWorkplace,
    enrichmentSkipped: options.skipped,
  };

  return annotateNetwork(workplace);
}

export function defaultEnrichment(person: Person, profile: Profile): Enrichment {
  const suggestion = enrichmentAssistant.suggest(person, profile);
  return {
    team: suggestion.team,
    matter: suggestion.role,
    tie: "weak",
    suggestion,
    acceptedSuggestion: false,
  };
}

