import type { Edge, Insight, Person, Workplace } from "./types";

export function otherId(edge: Edge, id: string) {
  if (edge.source === id) return edge.target;
  if (edge.target === id) return edge.source;
  return null;
}

export function neighbours(id: string, edges: Edge[]) {
  const ids = new Set<string>();
  for (const edge of edges) {
    const other = otherId(edge, id);
    if (other) ids.add(other);
  }
  return ids;
}

export function edgeBetween(edges: Edge[], a: string, b: string) {
  return edges.find(
    (edge) =>
      (edge.source === a && edge.target === b) ||
      (edge.source === b && edge.target === a),
  );
}

export function shortestPath(edges: Edge[], start: string, goal: string) {
  if (start === goal) return [start];
  const queue: string[][] = [[start]];
  const seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    if (!path) break;
    const tail = path[path.length - 1];
    for (const edge of edges) {
      const next = otherId(edge, tail);
      if (!next || seen.has(next)) continue;
      const nextPath = [...path, next];
      if (next === goal) return nextPath;
      seen.add(next);
      queue.push(nextPath);
    }
  }
  return null;
}

function betweenness(people: Person[], edges: Edge[]) {
  const scores = new Map<string, number>();
  for (const person of people) scores.set(person.id, 0);
  const ids = people.map((person) => person.id);

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const path = shortestPath(edges, ids[i], ids[j]);
      if (!path || path.length < 3) continue;
      for (let k = 1; k < path.length - 1; k += 1) {
        scores.set(path[k], (scores.get(path[k]) ?? 0) + 1);
      }
    }
  }
  return scores;
}

export function departmentSpan(personId: string, workplace: Workplace) {
  const person = workplace.people.find((entry) => entry.id === personId);
  const depts = new Set<string>();
  if (person) depts.add(person.department);
  for (const neighbourId of neighbours(personId, workplace.edges)) {
    const neighbour = workplace.people.find((entry) => entry.id === neighbourId);
    if (neighbour) depts.add(neighbour.department);
  }
  return depts;
}

export function annotateNetwork(workplace: Workplace): Workplace {
  const scores = betweenness(workplace.people, workplace.edges);
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const brokerCutoff = ranked[Math.max(0, Math.floor(ranked.length * 0.12))]?.[1] ?? 0;
  const you = workplace.people.find((person) => person.you);

  const people = workplace.people.map((person) => {
    const tags = new Set(person.tags ?? []);
    const score = scores.get(person.id) ?? 0;
    if (!person.you && score >= brokerCutoff && score > 0) tags.add("broker");

    if (you) {
      const edge = edgeBetween(workplace.edges, you.id, person.id);
      if (edge && (edge.kind === "weak" || edge.strength <= 2)) tags.add("weak-tie");
    }

    const groupCount = (person.groups ?? []).length;
    if (groupCount >= 2 && departmentSpan(person.id, workplace).size >= 3) {
      tags.add("fold");
    }

    return { ...person, tags: [...tags] };
  });

  return { ...workplace, people };
}

export function youOf(workplace: Workplace) {
  return workplace.people.find((person) => person.you) ?? workplace.people[0];
}

export function insightsFor(workplace: Workplace): Insight[] {
  const you = youOf(workplace);
  const brokers = workplace.people
    .filter(
      (person) =>
        !person.you &&
        (person.tags?.includes("broker") || person.enrichment?.matter === "broker"),
    )
    .slice(0, 3);
  const weak = workplace.people.filter(
    (person) =>
      !person.you &&
      (person.tags?.includes("weak-tie") || person.enrichment?.tie === "weak"),
  );
  const folds = workplace.people.filter(
    (person) => person.tags?.includes("fold") && !person.you,
  );
  const sponsors = workplace.people.filter(
    (person) =>
      person.tags?.includes("sponsor") || person.enrichment?.matter === "sponsor",
  );

  const insights: Insight[] = [];

  if (brokers[0]) {
    insights.push({
      id: "broker",
      kind: "broker",
      title: `${brokers[0].name.split(" ")[0]} carries the corridor`,
      body: brokers
        .map((person) => `${person.name} (${person.role})`)
        .join("; ")
        .concat(
          ". Brokers sit between clusters. A request that goes through them arrives already translated.",
        ),
      personIds: brokers.map((person) => person.id),
    });
  }

  if (weak.length) {
    insights.push({
      id: "weak",
      kind: "weak-tie",
      title: "Your weak ties are the useful ones",
      body: `${weak
        .slice(0, 3)
        .map((person) => person.name)
        .join(", ")} sit outside your daily cluster. Granovetter was right: novelty travels on thin lines.`,
      personIds: weak.slice(0, 3).map((person) => person.id),
    });
  }

  const legal = workplace.people.find((person) => person.department === "Legal");
  if (legal) {
    const path = shortestPath(workplace.edges, you.id, legal.id);
    insights.push({
      id: "hole",
      kind: "hole",
      title: `No direct line to ${legal.department.toLowerCase()}`,
      body: path
        ? `Shortest walk to ${legal.name}: ${path
            .map((id) => workplace.people.find((person) => person.id === id)?.name ?? id)
            .join(" → ")}. Cold-asking the end of that chain is how IC requests die.`
        : `${legal.name} is off your map entirely. That is a structural hole, not a personal failing.`,
      personIds: path ?? [legal.id],
    });
  }

  if (folds[0]) {
    insights.push({
      id: "fold",
      kind: "fold",
      title: `${folds[0].name.split(" ")[0]} sits in two rooms at once`,
      body: "A structural fold is overlapping membership in two dense groups — not merely a useful introduction. Managers pay for that view. ICs can still see the person.",
      personIds: folds.map((person) => person.id),
    });
  }

  if (sponsors.length && workplace.profile.intent === "promotion") {
    insights.push({
      id: "sponsor",
      kind: "sponsor",
      title: "Sponsors speak when you are not there",
      body: `${sponsors
        .map((person) => person.name)
        .join(", ")} sit in calibration. Your manager can write the packet. They cannot be the only voice.`,
      personIds: sponsors.map((person) => person.id),
    });
  }

  return insights;
}

export function pathEdgeIds(workplace: Workplace, nodeIds: string[]) {
  const ids: string[] = [];
  for (let i = 0; i < nodeIds.length - 1; i += 1) {
    const edge = edgeBetween(workplace.edges, nodeIds[i], nodeIds[i + 1]);
    if (edge) ids.push(edge.id);
  }
  return ids;
}
