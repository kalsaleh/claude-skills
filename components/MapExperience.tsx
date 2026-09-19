"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ForceMap } from "@/components/ForceMap";
import { InsightsPanel } from "@/components/InsightsPanel";
import { PersonDrawer } from "@/components/PersonDrawer";
import { DEPARTMENT_COLOURS, DEPARTMENT_ORDER } from "@/lib/departments";
import { pathEdgeIds } from "@/lib/network";
import { useWorkplace } from "@/lib/workplace-context";

export function MapExperience() {
  const {
    ready,
    workplace,
    highlight,
    selectedId,
    setHighlight,
    setSelectedId,
    setFoldOpen,
  } = useWorkplace();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ brokers: true, weak: true, you: true });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        setHighlight(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setHighlight, setSelectedId]);

  if (!ready) {
    return <p className="px-6 py-20 text-mist">Reading the local map…</p>;
  }
  if (!workplace?.onboarded) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="font-display text-3xl text-chalk">No workplace loaded</p>
        <p className="mt-2 text-mist">Start with the three-step onboarding. It takes a minute.</p>
        <Link
          href="/onboarding"
          className="mt-6 inline-block rounded-full bg-aquifer px-5 py-2 text-peat"
        >
          Open onboarding
        </Link>
      </div>
    );
  }

  const visiblePeople = workplace.people.filter((person) => {
    if (person.you) return filters.you;
    if (person.tags?.includes("broker") && !filters.brokers) return false;
    if (person.tags?.includes("weak-tie") && !filters.weak) return person.tags.includes("broker") || person.you;
    return true;
  });
  const visibleIds = new Set(visiblePeople.map((person) => person.id));
  const filtered = {
    ...workplace,
    people: visiblePeople,
    edges: workplace.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
    ),
  };

  return (
    <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 gap-4 px-3 pb-4 lg:grid-cols-[18rem_1fr_20rem]">
      <aside className="rounded-2xl border border-line bg-moss/70 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-copper">
          {workplace.workplaceName}
        </p>
        <h1 className="font-display text-2xl text-chalk">Informal chart</h1>
        <p className="mt-2 text-xs text-mist">
          Drag the peat to pan. Scroll to zoom. Click a person. Copper rings are brokers; dashed
          lines are weak ties; mist dashed rings are the personal layer.
        </p>
        {workplace.enrichmentSkipped ? (
          <p className="mt-3 rounded-xl border border-line bg-peat px-3 py-2 text-xs text-chalk">
            Soft empty state: LinkedIn proved the links. Name five people on{" "}
            <Link href="/enrich" className="text-aquifer underline">
              the enrich queue
            </Link>{" "}
            and insights will speak.
          </p>
        ) : null}
        <fieldset className="mt-4 space-y-2 text-sm text-mist">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.brokers}
              onChange={(event) => setFilters({ ...filters, brokers: event.target.checked })}
            />
            Brokers
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.weak}
              onChange={(event) => setFilters({ ...filters, weak: event.target.checked })}
            />
            Weak ties
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.you}
              onChange={(event) => setFilters({ ...filters, you: event.target.checked })}
            />
            You
          </label>
        </fieldset>
        <div className="mt-5 space-y-1.5">
          {DEPARTMENT_ORDER.filter((dept) =>
            workplace.people.some((person) => person.department === dept),
          ).map((dept) => (
            <div key={dept} className="flex items-center gap-2 text-xs text-mist">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: DEPARTMENT_COLOURS[dept] }}
              />
              {dept}
            </div>
          ))}
        </div>
        <Link href="/enrich" className="mt-5 inline-block text-xs text-mist hover:text-chalk">
          Name more people
        </Link>
        <Link href="/import" className="mt-2 block text-xs text-mist hover:text-chalk">
          Replace with Connections.csv
        </Link>
        {highlight ? (
          <button
            type="button"
            className="mt-3 block text-xs text-copper hover:underline"
            onClick={() => setHighlight(null)}
          >
            Clear path
          </button>
        ) : null}
      </aside>

      <div className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-line">
        <ForceMap
          workplace={filtered}
          highlight={highlight}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hoverId={hoverId}
          onHover={setHoverId}
        />
        <PersonDrawer
          workplace={workplace}
          personId={selectedId}
          onClose={() => setSelectedId(null)}
          onFocus={setSelectedId}
        />
      </div>

      <aside className="rounded-2xl border border-line bg-moss/70 p-4">
        <InsightsPanel
          workplace={workplace}
          onOpenFold={() => setFoldOpen(true)}
          onOpenPeople={(ids, label) => {
            setHighlight({
              nodeIds: ids,
              edgeIds: pathEdgeIds(workplace, ids),
              label,
            });
            if (ids[0]) setSelectedId(ids[0]);
          }}
        />
      </aside>
    </div>
  );
}
