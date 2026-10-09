import type { Insight, NetworkGraph, Verdict } from "./types";

export function insightScore(insight: Insight, verdict?: Verdict): number {
  const base = insight.surprise * 0.62 + insight.strength * 0.38;
  if (verdict === "confirmed") return base + 2;
  if (verdict === "unsure") return base * 0.72;
  if (verdict === "wrong") return -1;
  return base;
}

export function rankInsights(insights: Insight[], verdicts: Record<string, Verdict>): Insight[] {
  return [...insights].sort(
    (a, b) => insightScore(b, verdicts[b.id]) - insightScore(a, verdicts[a.id]) || a.title.localeCompare(b.title),
  );
}

/** Drop bridges and contacts that only appeared in rejected insights. Colleagues stay. */
export function graphWithVerdicts(
  graph: NetworkGraph,
  verdicts: Record<string, Verdict>,
): NetworkGraph {
  const rejected = new Set(
    Object.entries(verdicts)
      .filter(([, verdict]) => verdict === "wrong")
      .map(([id]) => id),
  );
  const people = graph.people.filter(
    (person) =>
      person.kind === "you" ||
      person.kind === "colleague" ||
      person.insightIds.length === 0 ||
      person.insightIds.some((id) => !rejected.has(id)),
  );
  const ids = new Set(people.map((person) => person.id));
  const edges = graph.edges.filter((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) return false;
    if (edge.insightIds.length === 0) return true;
    return edge.insightIds.some((id) => !rejected.has(id));
  });
  return { people, edges };
}
