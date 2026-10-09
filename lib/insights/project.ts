import type { Edge, Highlight, Person, Workplace } from "../types";
import type { GraphEdge, GraphPerson, NetworkGraph } from "./types";

export function toWorkplace(company: string, youName: string, graph: NetworkGraph): Workplace {
  const people: Person[] = graph.people.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    team: person.company || company,
    department: person.kind === "you" ? "Leadership" : person.kind === "colleague" ? "Product" : person.kind === "bridge" ? "Sales" : "Other",
    you: person.kind === "you",
    company: person.company,
    tags: person.kind === "bridge" ? ["broker"] : undefined,
    layer: "workplace",
    bio: person.kind === "you" ? `${youName} · ${company}` : `${person.role} · ${person.company}`,
  }));

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    strength: edge.strength,
    kind: edge.hidden ? "collaborates" : "weak",
    label: edge.label,
  }));

  return {
    version: 1,
    onboarded: true,
    source: "demo",
    workplaceName: company,
    workplaceBlurb: "Hidden network",
    profile: {
      name: youName,
      role: people.find((person) => person.you)?.role ?? "",
      team: company,
      company,
      intent: "see-the-room",
    },
    people,
    edges,
    groups: [],
  };
}

export function highlightFor(
  personIds: string[],
  edgeIds: string[],
  label: string,
  edges: GraphEdge[],
): Highlight {
  const present = new Set(edges.map((edge) => edge.id));
  return {
    nodeIds: personIds,
    edgeIds: edgeIds.filter((id) => present.has(id)),
    label,
  };
}

export function personById(people: GraphPerson[], id: string | null): GraphPerson | undefined {
  if (!id) return undefined;
  return people.find((person) => person.id === id);
}
