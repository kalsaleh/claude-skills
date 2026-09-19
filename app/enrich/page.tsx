"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BuilderStepper } from "@/components/BuilderStepper";
import { namedRoleCount } from "@/lib/builder";
import { DEPARTMENT_ORDER } from "@/lib/departments";
import { enrichmentAssistant } from "@/lib/enrichment-assistant";
import { suggestQueueRank } from "@/lib/suggest";
import type { Department, Enrichment, MatterRole, TieStrength } from "@/lib/types";
import { MATTER_LABELS, TIE_LABELS } from "@/lib/types";
import { useWorkplace } from "@/lib/workplace-context";

const MATTERS: MatterRole[] = [
  "sponsor",
  "broker",
  "decision_maker",
  "peer",
  "mentor",
  "blocker",
  "skip",
];

const TIES: TieStrength[] = ["weak", "working", "strong"];

export default function EnrichPage() {
  const router = useRouter();
  const {
    ready,
    builder,
    savePersonEnrichment,
    setQueueIndex,
    skipEnrichment,
    commitToMap,
  } = useWorkplace();

  const person = useMemo(() => {
    if (!builder) return null;
    const id = builder.queueIds[builder.queueIndex];
    return builder.people.find((entry) => entry.id === id) ?? null;
  }, [builder]);

  const suggestion = useMemo(() => {
    if (!person || !builder) return null;
    return person.enrichment?.suggestion ?? enrichmentAssistant.suggest(person, builder.profile);
  }, [person, builder]);

  const [team, setTeam] = useState<Department>("Other");
  const [matter, setMatter] = useState<MatterRole>("skip");
  const [tie, setTie] = useState<TieStrength>("weak");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!builder?.queueIds.length && builder?.people.length) {
      return;
    }
    if (ready && !builder?.people.length) router.replace("/import");
  }, [ready, builder, router]);

  useEffect(() => {
    if (!person || !suggestion) return;
    const existing = person.enrichment;
    setTeam(existing?.team ?? suggestion.team);
    setMatter(existing?.matter ?? suggestion.role);
    setTie(existing?.tie ?? "weak");
    setAccepted(existing?.acceptedSuggestion ?? false);
  }, [person, suggestion]);

  if (!builder) {
    return <p className="px-6 py-16 text-mist">Loading the queue…</p>;
  }

  const queuePeople = builder.queueIds
    .map((id) => builder.people.find((entry) => entry.id === id))
    .filter(Boolean);
  const named = namedRoleCount(builder.people);
  const position = builder.queueIndex;
  const total = builder.queueIds.length;

  const persistCurrent = (nextIndex?: number) => {
    if (!person || !suggestion) return;
    const enrichment: Enrichment = {
      team,
      matter,
      tie,
      suggestion,
      acceptedSuggestion: accepted,
    };
    savePersonEnrichment(person.id, enrichment);
    if (typeof nextIndex === "number") setQueueIndex(nextIndex);
  };

  const goNext = () => {
    persistCurrent(Math.min(position + 1, total - 1));
    if (position + 1 >= total) {
      commitToMap();
      router.push("/map");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <BuilderStepper current="enrich" />
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-copper">
        Step 3 · Enrich · {total ? position + 1 : 0} of {total || 12}
      </p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Name the useful ten</h1>
      <p className="mt-3 text-lg text-chalk/90">
        Three taps: team · how they matter · how real the tie is.
      </p>
      <p className="mt-2 text-sm text-mist">
        Ranked by seniority titles, then other-team keywords, then peer/cohort. Cap 12. {named}{" "}
        named so far — insights unlock at five.
      </p>

      {total === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-moss p-6">
          <p className="text-chalk">No same-company people to queue.</p>
          <p className="mt-2 text-sm text-mist">
            You can still open the map with the personal layer, or go back and check the company
            name.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="rounded-full bg-aquifer px-4 py-2 text-sm text-peat"
              onClick={() => {
                skipEnrichment();
                router.push("/map");
              }}
            >
              Open the quiet map
            </button>
          </div>
        </div>
      ) : null}

      {person && suggestion ? (
        <article className="mt-8 rounded-3xl border border-line bg-moss/80 p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">
            {person.company} · {suggestQueueRank(person, builder.profile).rationale}
          </p>
          <h2 className="mt-1 font-display text-3xl text-chalk">{person.name}</h2>
          <p className="text-sm text-mist">{person.role}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-aquifer/40 bg-peat px-3 py-3">
            <p className="text-sm text-chalk">
              Suggested: {suggestion.team} · {MATTER_LABELS[suggestion.role]} — from title
              <span className="text-mist"> ({Math.round(suggestion.confidence * 100)}%)</span>
            </p>
            <button
              type="button"
              className="rounded-full bg-aquifer px-3 py-1 text-xs font-medium text-peat"
              onClick={() => {
                setTeam(suggestion.team);
                setMatter(suggestion.role);
                setAccepted(true);
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:text-chalk"
              onClick={() => setAccepted(false)}
            >
              Override
            </button>
          </div>
          <p className="mt-2 text-xs text-mist">{suggestion.rationale}</p>
          {accepted ? (
            <p className="mt-1 text-xs text-aquifer">Accepted the title read. You can still edit.</p>
          ) : (
            <p className="mt-1 text-xs text-mist">Override is the point — you name what it means.</p>
          )}

          <label className="mt-6 block text-sm text-mist">
            1. Team
            <select
              className="mt-1 w-full rounded-xl border border-line bg-peat px-3 py-2 text-chalk"
              value={team}
              onChange={(event) => {
                setTeam(event.target.value as Department);
                setAccepted(false);
              }}
            >
              {DEPARTMENT_ORDER.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="mt-6">
            <legend className="text-sm text-mist">2. How they matter</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMatter(item);
                    setAccepted(false);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    matter === item
                      ? "border-aquifer bg-aquifer/15 text-chalk"
                      : "border-line text-mist hover:text-chalk"
                  }`}
                >
                  {MATTER_LABELS[item]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm text-mist">3. Tie strength</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTie(item)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    tie === item
                      ? "border-copper bg-copper/15 text-chalk"
                      : "border-line text-mist hover:text-chalk"
                  }`}
                >
                  {TIE_LABELS[item]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-mist">Default is weak — LinkedIn is a thin proof.</p>
          </fieldset>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={position === 0}
              className="text-sm text-mist hover:text-chalk disabled:opacity-30"
              onClick={() => persistCurrent(Math.max(0, position - 1))}
            >
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-4 py-2 text-sm text-mist"
                onClick={() => {
                  persistCurrent();
                  commitToMap();
                  router.push("/map");
                }}
              >
                Skip remaining
              </button>
              <button
                type="button"
                className="rounded-full bg-chalk px-4 py-2 text-sm font-medium text-peat"
                onClick={goNext}
              >
                {position + 1 >= total ? "Save and open map" : "Save and next"}
              </button>
            </div>
          </div>
        </article>
      ) : null}

      {queuePeople.length ? (
        <ol className="mt-8 flex flex-wrap gap-2 text-xs text-mist">
          {queuePeople.map((entry, index) =>
            entry ? (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`rounded-full border px-2 py-1 ${
                    index === position
                      ? "border-aquifer text-chalk"
                      : entry.enrichment && entry.enrichment.matter !== "skip"
                        ? "border-line text-aquifer"
                        : "border-line"
                  }`}
                  onClick={() => {
                    persistCurrent(index);
                  }}
                >
                  {index + 1}. {entry.name.split(" ")[0]}
                </button>
              </li>
            ) : null,
          )}
        </ol>
      ) : null}
    </div>
  );
}
