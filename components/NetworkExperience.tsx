"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ForceMap } from "@/components/ForceMap";
import { InsightCard } from "@/components/InsightCard";
import { loadStoredSession, loadVerdicts, saveStoredSession, saveVerdicts } from "@/lib/client-store";
import { graphWithVerdicts, rankInsights } from "@/lib/insights/rank";
import { highlightFor, toWorkplace } from "@/lib/insights/project";
import type { Insight, NetworkGraph, NetworkSnapshot, PathResult, Verdict } from "@/lib/insights/types";
import type { PublicSession } from "@/lib/sessions";

const SECTIONS: { kind: Insight["kind"]; title: string; lede: string }[] = [
  {
    kind: "colleague_tie",
    title: "Colleague ties you may not know",
    lede: "Pairs inside the company linked by a shared past, a school, or public interaction — not by a LinkedIn connection you already have.",
  },
  {
    kind: "shared_past",
    title: "Shared-past clusters",
    lede: "Former employers where two or more colleagues overlapped, plus the outside people who were there too.",
  },
  {
    kind: "bridge",
    title: "Bridges",
    lede: "Someone connected to at least two colleagues. The useful ones are the people you do not already have on LinkedIn.",
  },
];

export function NetworkExperience() {
  const params = useSearchParams();
  const sessionId = params.get("session") || loadStoredSession() || "";
  const [session, setSession] = useState<PublicSession | null>(null);
  const [missing, setMissing] = useState(false);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [paths, setPaths] = useState<PathResult | null>(null);
  const [pathError, setPathError] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setVerdicts(loadVerdicts());
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setMissing(true);
      return;
    }
    saveStoredSession(sessionId);
    let stop = false;
    fetch(`/api/network/session/${sessionId}`, { cache: "no-store" })
      .then(async (response) => {
        if (stop) return;
        if (response.status === 404) {
          setMissing(true);
          return;
        }
        const body = (await response.json()) as PublicSession;
        if (body.status !== "ready" || !body.snapshot) {
          window.location.href = `/mapping?session=${sessionId}`;
          return;
        }
        setSession(body);
      })
      .catch(() => {
        if (!stop) setMissing(true);
      });
    return () => {
      stop = true;
    };
  }, [sessionId]);

  const snapshot = session?.snapshot;

  function setVerdict(id: string, verdict: Verdict | null) {
    setVerdicts((current) => {
      const next = { ...current };
      if (!verdict) delete next[id];
      else next[id] = verdict;
      saveVerdicts(next);
      return next;
    });
    setActiveId(id);
  }

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionId) return;
    setSearching(true);
    setPathError("");
    try {
      const response = await fetch(`/api/network/session/${sessionId}/paths`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = (await response.json()) as PathResult & { error?: string };
      if (!response.ok) {
        setPathError(body.error || "Could not search routes.");
        setPaths(null);
      } else {
        setPaths(body);
        if (body.insights[0]) setActiveId(body.insights[0].id);
      }
    } catch {
      setPathError("Could not search routes.");
    } finally {
      setSearching(false);
    }
  }

  if (missing || !sessionId) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-4xl text-chalk">No network loaded</h1>
        <p className="mt-3 text-sm text-mist">Map a team first. Demo mode needs no API key.</p>
        <a href="/setup" className="mt-6 inline-block rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat">
          Start setup
        </a>
      </div>
    );
  }

  if (!snapshot || !session) {
    return (
      <p className="px-5 py-16 text-sm text-mist" role="status">
        Opening the hidden network…
      </p>
    );
  }

  return (
    <NetworkView
      session={session}
      snapshot={snapshot}
      verdicts={verdicts}
      activeId={activeId}
      selectedId={selectedId}
      hoverId={hoverId}
      query={query}
      paths={paths}
      pathError={pathError}
      searching={searching}
      onQuery={setQuery}
      onSearch={onSearch}
      onVerdict={setVerdict}
      onFocus={(insight) => {
        setActiveId(insight.id);
        setSelectedId(insight.personIds[0] ?? null);
      }}
      onSelect={setSelectedId}
      onHover={setHoverId}
    />
  );
}

function NetworkView({
  session,
  snapshot,
  verdicts,
  activeId,
  selectedId,
  hoverId,
  query,
  paths,
  pathError,
  searching,
  onQuery,
  onSearch,
  onVerdict,
  onFocus,
  onSelect,
  onHover,
}: {
  session: PublicSession;
  snapshot: NetworkSnapshot;
  verdicts: Record<string, Verdict>;
  activeId: string | null;
  selectedId: string | null;
  hoverId: string | null;
  query: string;
  paths: PathResult | null;
  pathError: string;
  searching: boolean;
  onQuery: (value: string) => void;
  onSearch: (event: React.FormEvent) => void;
  onVerdict: (id: string, verdict: Verdict | null) => void;
  onFocus: (insight: Insight) => void;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const allInsights = useMemo(() => {
    const extra = paths?.insights ?? [];
    const seen = new Set(snapshot.insights.map((insight) => insight.id));
    return [...snapshot.insights, ...extra.filter((insight) => !seen.has(insight.id))];
  }, [paths, snapshot.insights]);

  const active = allInsights.find((insight) => insight.id === activeId) ?? null;
  const graph = useMemo(() => {
    const merged = mergeGraph(snapshot.graph, paths ? { people: paths.people, edges: paths.edges } : undefined);
    return graphWithVerdicts(merged, verdicts);
  }, [paths, snapshot.graph, verdicts]);

  const workplace = useMemo(
    () => toWorkplace(snapshot.company, snapshot.youName, graph),
    [graph, snapshot.company, snapshot.youName],
  );
  const highlight = active
    ? highlightFor(active.personIds, active.edgeIds, active.title, graph.edges)
    : null;

  const dismissed = rankInsights(
    allInsights.filter((insight) => verdicts[insight.id] === "wrong"),
    verdicts,
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-copper">
            {snapshot.mode === "demo" ? "Demo · fictional team" : "Live · The Swarm"} · {snapshot.company}
          </p>
          <h1 className="mt-2 font-display text-4xl text-chalk sm:text-5xl">Hidden network</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
            {snapshot.youName}, these are ties the map found on its own. Confirm the ones that are real.
            Mark the rest wrong and they drop down the list.
          </p>
        </div>
        {session.demoNotice ? <p className="max-w-sm text-sm text-mist">{session.demoNotice}</p> : null}
      </div>

      <dl className="mt-6 flex flex-wrap gap-3 text-sm">
        <Stat label="Profiles" value={snapshot.stats.profileCount.toLocaleString("en-GB")} />
        <Stat label="Colleagues" value={String(snapshot.stats.connectorCount)} />
        {Object.entries(snapshot.stats.sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([origin, count]) => (
            <Stat key={origin} label={origin.replaceAll("_", " ")} value={String(count)} />
          ))}
      </dl>
      <p className="mt-3 text-xs text-mist">
        Where connected profiles work now:{" "}
        {snapshot.stats.topCompanies.map((company) => `${company.name} ${company.count}`).join(" · ")}
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div>
          <form onSubmit={onSearch} className="rounded-3xl border border-line p-4">
            <label htmlFor="route-query" className="text-sm text-chalk">
              Strongest route to a person or company
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="route-query"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Pinetrail, or Nora Voss"
                className="w-full rounded-full border border-line bg-peat px-4 py-2 text-sm text-chalk outline-none focus:border-aquifer"
              />
              <button
                type="submit"
                disabled={searching}
                className="rounded-full bg-chalk px-4 py-2 text-sm font-medium text-peat disabled:opacity-60"
              >
                {searching ? "Searching…" : "Find a route"}
              </button>
            </div>
            {pathError ? (
              <p role="alert" className="mt-2 text-sm text-copper">
                {pathError}
              </p>
            ) : null}
            {paths?.note ? <p className="mt-2 text-sm text-mist">{paths.note}</p> : null}
          </form>

          {paths && paths.insights.length > 0 ? (
            <Section
              title="Routes"
              lede={`Paths through colleagues for “${paths.query}”.`}
              insights={rankInsights(paths.insights, verdicts).filter((insight) => verdicts[insight.id] !== "wrong")}
              verdicts={verdicts}
              activeId={activeId}
              onVerdict={onVerdict}
              onFocus={onFocus}
            />
          ) : null}

          {SECTIONS.map((section) => (
            <Section
              key={section.kind}
              title={section.title}
              lede={section.lede}
              insights={rankInsights(
                snapshot.insights.filter((insight) => insight.kind === section.kind),
                verdicts,
              ).filter((insight) => verdicts[insight.id] !== "wrong")}
              verdicts={verdicts}
              activeId={activeId}
              onVerdict={onVerdict}
              onFocus={onFocus}
            />
          ))}

          {dismissed.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl text-chalk">Marked wrong</h2>
              <p className="mt-2 text-sm text-mist">These stay out of the ranking until you clear them. Saved in this browser.</p>
              <div className="mt-4 space-y-4">
                {dismissed.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    verdict="wrong"
                    active={activeId === insight.id}
                    onVerdict={onVerdict}
                    onFocus={onFocus}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="mb-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.14em] text-mist">
            <span>You · pale</span>
            <span>Colleagues · green</span>
            <span>Bridges · copper</span>
          </div>
          <div className="h-[460px] overflow-hidden rounded-3xl border border-line lg:h-[680px]">
            <ForceMap
              workplace={workplace}
              highlight={highlight}
              selectedId={selectedId}
              onSelect={onSelect}
              hoverId={hoverId}
              onHover={onHover}
            />
          </div>
          <p className="mt-3 text-xs text-mist">
            Drag a person, or the background to pan. Scroll to zoom. Choose a title to light that tie.
            {active ? ` Showing ${active.title}.` : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  lede,
  insights,
  verdicts,
  activeId,
  onVerdict,
  onFocus,
}: {
  title: string;
  lede: string;
  insights: Insight[];
  verdicts: Record<string, Verdict>;
  activeId: string | null;
  onVerdict: (id: string, verdict: Verdict | null) => void;
  onFocus: (insight: Insight) => void;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-3xl text-chalk">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-mist">{lede}</p>
      {insights.length === 0 ? (
        <p className="mt-4 text-sm text-mist">Nothing in this group survived the surprise filter.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              verdict={verdicts[insight.id]}
              active={activeId === insight.id}
              onVerdict={onVerdict}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-line px-3 py-1.5">
      <dt className="inline text-mist">{label} </dt>
      <dd className="inline text-chalk">{value}</dd>
    </div>
  );
}

function mergeGraph(base: NetworkGraph, extra?: NetworkGraph): NetworkGraph {
  if (!extra) return base;
  const people = new Map(base.people.map((person) => [person.id, person]));
  for (const person of extra.people) {
    const existing = people.get(person.id);
    if (!existing) {
      people.set(person.id, person);
      continue;
    }
    people.set(person.id, {
      ...existing,
      insightIds: [...new Set([...existing.insightIds, ...person.insightIds])],
    });
  }
  const edges = new Map(base.edges.map((edge) => [edge.id, edge]));
  for (const edge of extra.edges) {
    const existing = edges.get(edge.id);
    if (!existing) edges.set(edge.id, edge);
    else {
      edges.set(edge.id, {
        ...existing,
        insightIds: [...new Set([...existing.insightIds, ...edge.insightIds])],
      });
    }
  }
  return { people: [...people.values()], edges: [...edges.values()] };
}
