"use client";

import { DEPARTMENT_COLOURS } from "@/lib/departments";
import { neighbours, youOf } from "@/lib/network";
import type { Workplace } from "@/lib/types";
import { MATTER_LABELS, TIE_LABELS } from "@/lib/types";

export function PersonDrawer({
  workplace,
  personId,
  onClose,
  onFocus,
}: {
  workplace: Workplace;
  personId: string | null;
  onClose: () => void;
  onFocus: (id: string) => void;
}) {
  const person = workplace.people.find((entry) => entry.id === personId);
  if (!person) return null;
  const you = youOf(workplace);
  const tied = [...neighbours(person.id, workplace.edges)]
    .map((id) => workplace.people.find((entry) => entry.id === id))
    .filter(Boolean)
    .slice(0, 8);
  const edgeFromYou = workplace.edges.find(
    (edge) =>
      (edge.source === you.id && edge.target === person.id) ||
      (edge.target === you.id && edge.source === person.id),
  );

  return (
    <aside className="absolute inset-y-3 right-3 z-20 flex w-[min(100%-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-line bg-moss/95 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-copper">
            {person.you ? "You" : person.department}
          </p>
          <h2 className="font-display text-2xl text-chalk">{person.name}</h2>
          <p className="text-sm text-mist">
            {person.role}
            {person.team ? ` · ${person.team}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-line px-2 py-1 text-xs text-mist hover:text-chalk"
        >
          Close
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: DEPARTMENT_COLOURS[person.department] }}
          />
          <span className="text-mist">
            {person.location ?? "Location unlisted"}
          </span>
        </div>
        {person.bio ? <p className="text-chalk/90 leading-relaxed">{person.bio}</p> : null}
        {person.enrichment ? (
          <p className="rounded-xl bg-peat px-3 py-2 text-mist">
            You named them: {person.enrichment.team} · {MATTER_LABELS[person.enrichment.matter]} ·{" "}
            {TIE_LABELS[person.enrichment.tie]} tie
            {person.layer === "personal" ? " · personal layer" : ""}
          </p>
        ) : person.layer === "personal" ? (
          <p className="rounded-xl bg-peat px-3 py-2 text-mist">Personal layer — outside the workplace match.</p>
        ) : null}
        {person.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-mist"
              >
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>
        ) : null}
        {edgeFromYou && !person.you ? (
          <p className="rounded-xl bg-peat px-3 py-2 text-mist">
            Your tie: {edgeFromYou.label ?? edgeFromYou.kind} · strength {edgeFromYou.strength}/5
          </p>
        ) : null}
        {person.groups?.length ? (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-mist">Rooms they sit in</p>
            <ul className="space-y-1 text-chalk/90">
              {person.groups.map((groupId) => {
                const group = workplace.groups.find((entry) => entry.id === groupId);
                return <li key={groupId}>{group?.name ?? groupId}</li>;
              })}
            </ul>
          </div>
        ) : null}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-mist">Adjacent people</p>
          <ul className="space-y-1">
            {tied.map((entry) =>
              entry ? (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="text-left text-aquifer hover:underline"
                    onClick={() => onFocus(entry.id)}
                  >
                    {entry.name}
                  </button>
                  <span className="text-mist"> · {entry.role}</span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
