"use client";

import { useEffect } from "react";
import { useWorkplace } from "@/lib/workplace-context";

export function FoldModal() {
  const { foldOpen, setFoldOpen, workplace, setHighlight, setSelectedId } = useWorkplace();

  useEffect(() => {
    if (!foldOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFoldOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [foldOpen, setFoldOpen]);

  if (!foldOpen || !workplace) return null;

  const maya = workplace.people.find((person) => person.id === "maya") ??
    workplace.people.find((person) => person.tags?.includes("fold"));
  const eng = workplace.groups.find((group) => group.id === "eng-platform") ?? workplace.groups[1];
  const guild = workplace.groups.find((group) => group.id === "shipping-guild") ?? workplace.groups[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-labelledby="fold-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-moss p-6 shadow-2xl sm:p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-copper">
          Manager pack · not for sale here
        </p>
        <h2 id="fold-title" className="mt-2 font-display text-3xl text-chalk">
          Structural folds
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          A broker introduces two groups. A fold <em>belongs</em> to both. Vedres and Stark called
          it overlapping cohesive membership — the person who is in two rooms that do not otherwise
          share a roll-call. That is usually a manager&apos;s problem, or a manager&apos;s advantage.
        </p>

        <div className="my-6 flex items-center justify-center">
          <svg viewBox="0 0 320 180" className="h-40 w-full max-w-md">
            <circle cx="125" cy="90" r="70" fill="rgba(107,143,212,0.35)" stroke="#6b8fd4" />
            <circle cx="195" cy="90" r="70" fill="rgba(74,163,146,0.35)" stroke="#4aa392" />
            <text x="90" y="88" fill="#e8e4d9" fontSize="11">
              {eng?.name ?? "Engineering"}
            </text>
            <text x="188" y="88" fill="#e8e4d9" fontSize="11">
              {guild?.name ?? "Shipping guild"}
            </text>
            <text x="132" y="118" fill="#d4895a" fontSize="12" fontWeight="600">
              {maya?.name ?? "The fold"}
            </text>
          </svg>
        </div>

        {maya ? (
          <p className="text-sm leading-relaxed text-chalk/90">
            In the Harbourline demo, {maya.name} manages Platform engineering and also sits in the
            shipping guild with Product and CS. If you only watch the official chart, she is an
            engineering manager. If you watch the fold, she is how launches actually leave the
            building.
          </p>
        ) : (
          <p className="text-sm text-chalk/90">
            On an imported map we mark folds where someone belongs to two dense organisation
            clusters. Treat it as a hypothesis, not a verdict.
          </p>
        )}

        <p className="mt-4 rounded-2xl border border-line bg-peat px-4 py-3 text-sm text-mist">
          This prototype will not pretend to bill you. There is no checkout, no seat, no &ldquo;upgrade
          to see the rest&rdquo;. The manager pack is a later conversation for people who already have
          a duty of care. You are looking at an IC map.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {maya ? (
            <button
              type="button"
              className="rounded-full bg-aquifer px-4 py-2 text-sm font-medium text-peat"
              onClick={() => {
                setHighlight({
                  nodeIds: maya.groups
                    ? workplace.people
                        .filter((person) =>
                          person.groups?.some((group) => maya.groups?.includes(group)),
                        )
                        .map((person) => person.id)
                    : [maya.id],
                  edgeIds: [],
                  label: `Fold around ${maya.name}`,
                });
                setSelectedId(maya.id);
                setFoldOpen(false);
              }}
            >
              Show {maya.name.split(" ")[0]} on the map
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm text-mist hover:text-chalk"
            onClick={() => setFoldOpen(false)}
          >
            Back to the IC view
          </button>
        </div>
      </div>
    </div>
  );
}
