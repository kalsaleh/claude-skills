"use client";

import type { Insight, Verdict } from "@/lib/insights/types";

const KIND_LABEL: Record<Insight["kind"], string> = {
  colleague_tie: "Hidden colleague tie",
  shared_past: "Shared past",
  bridge: "Bridge",
  path: "Route",
};

export function InsightCard({
  insight,
  verdict,
  active,
  onVerdict,
  onFocus,
}: {
  insight: Insight;
  verdict?: Verdict;
  active: boolean;
  onVerdict: (id: string, verdict: Verdict | null) => void;
  onFocus: (insight: Insight) => void;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 ${active ? "border-copper bg-moss/80" : "border-line bg-moss/30"}`}
      aria-labelledby={`insight-${insight.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-copper">{KIND_LABEL[insight.kind]}</p>
        <p className="text-[11px] text-mist">
          Surprise {Math.round(insight.surprise * 100)} · Strength {Math.round(insight.strength * 100)}
          {verdict === "confirmed" ? " · Confirmed" : verdict === "unsure" ? " · Not sure" : ""}
        </p>
      </div>
      <h3 id={`insight-${insight.id}`} className="mt-2 font-display text-2xl text-chalk">
        <button type="button" className="text-left hover:text-aquifer" onClick={() => onFocus(insight)}>
          {insight.title}
        </button>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mist">{insight.body}</p>
      <ul className="mt-4 space-y-2">
        {insight.evidence.slice(0, 4).map((item) => (
          <li key={`${item.origin}-${item.text}`} className="rounded-2xl border border-line/80 px-3 py-2 text-sm text-chalk">
            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-copper">{labelOrigin(item.origin)}</span>
            {item.text}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <VerdictButton
          label="Confirm"
          pressed={verdict === "confirmed"}
          onClick={() => onVerdict(insight.id, verdict === "confirmed" ? null : "confirmed")}
          title={insight.title}
        />
        <VerdictButton
          label="Wrong"
          pressed={verdict === "wrong"}
          onClick={() => onVerdict(insight.id, verdict === "wrong" ? null : "wrong")}
          title={insight.title}
        />
        <VerdictButton
          label="Not sure"
          pressed={verdict === "unsure"}
          onClick={() => onVerdict(insight.id, verdict === "unsure" ? null : "unsure")}
          title={insight.title}
        />
      </div>
    </article>
  );
}

function VerdictButton({
  label,
  pressed,
  onClick,
  title,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${label}: ${title}`}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${
        pressed ? "bg-chalk text-peat" : "border border-line text-mist hover:text-chalk"
      }`}
    >
      {label}
    </button>
  );
}

function labelOrigin(origin: string) {
  return origin.replaceAll("_", " ");
}
