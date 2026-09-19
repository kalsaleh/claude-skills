"use client";

import Link from "next/link";
import { INSIGHTS_MIN, namedRoleCount } from "@/lib/builder";
import { insightsFor } from "@/lib/network";
import type { Workplace } from "@/lib/types";

export function InsightsPanel({
  workplace,
  onOpenPeople,
  onOpenFold,
}: {
  workplace: Workplace;
  onOpenPeople: (ids: string[], label: string) => void;
  onOpenFold: () => void;
}) {
  const named = namedRoleCount(workplace.people);
  const unlocked = named >= INSIGHTS_MIN;
  const insights = unlocked ? insightsFor(workplace) : [];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-copper">What the map is saying</p>
        <h2 className="font-display text-2xl text-chalk">Insights</h2>
        <p className="mt-1 text-sm text-mist">{workplace.workplaceBlurb}</p>
      </div>

      {!unlocked ? (
        <div className="rounded-2xl border border-line bg-peat/60 p-4">
          <p className="font-medium text-chalk">
            {workplace.enrichmentSkipped
              ? "The map is quiet because nobody is named yet."
              : `${named} of ${INSIGHTS_MIN} named roles`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            LinkedIn proves the link. You name what it means. Insights unlock when at least{" "}
            {INSIGHTS_MIN} people have a role other than “Not sure yet”.
          </p>
          <Link
            href="/enrich"
            className="mt-3 inline-block text-sm text-copper hover:underline"
          >
            {workplace.enrichmentSkipped ? "Name a few people" : "Keep naming people"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-2xl border border-line bg-peat/60 p-4"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-aquifer">
                {insight.kind.replace("-", " ")}
              </p>
              <h3 className="mt-1 font-medium text-chalk">{insight.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-mist">{insight.body}</p>
              <button
                type="button"
                className="mt-3 text-sm text-copper hover:underline"
                onClick={() => onOpenPeople(insight.personIds, insight.title)}
              >
                Light them on the map
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-copper/40 bg-copper/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-copper">
          Structural fold
        </p>
        <p className="mt-1 text-sm text-chalk">
          Managers pay to see who sits in two dense rooms at once. This IC prototype will not.
        </p>
        <button
          type="button"
          onClick={onOpenFold}
          className="mt-3 rounded-full bg-copper px-3 py-1.5 text-sm font-medium text-peat"
        >
          Peek at the manager pack
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/playbooks/cross-dept" className="rounded-full border border-line px-3 py-1.5 text-mist hover:text-chalk">
          Cross-dept ask
        </Link>
        <Link href="/playbooks/promotion" className="rounded-full border border-line px-3 py-1.5 text-mist hover:text-chalk">
          Promotion + sponsor
        </Link>
      </div>
    </div>
  );
}
