"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BuilderStepper } from "@/components/BuilderStepper";
import { layerCounts } from "@/lib/builder";
import { useWorkplace } from "@/lib/workplace-context";

export default function FilterPage() {
  const router = useRouter();
  const { ready, builder, setLayers } = useWorkplace();
  const [workplaceOn, setWorkplaceOn] = useState(true);
  const [personalOn, setPersonalOn] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!builder?.people.length) router.replace("/import");
  }, [ready, builder, router]);

  useEffect(() => {
    if (!builder) return;
    setWorkplaceOn(builder.includeWorkplace);
    setPersonalOn(builder.includePersonal);
  }, [builder]);

  if (!builder?.people.length) {
    return <p className="px-6 py-16 text-mist">Loading import…</p>;
  }

  const counts = layerCounts(builder.people);
  const company = builder.profile.company || "your company";

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <BuilderStepper current="filter" />
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-copper">Step 2 · Filter</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Same company, or the whole book?</h1>
      <p className="mt-3 text-sm text-mist">
        {counts.total} people parsed. We matched <strong className="text-chalk">{company}</strong>{" "}
        against the Company column.
      </p>

      <div className="mt-8 space-y-4">
        <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-line bg-moss/70 p-5">
          <input
            type="checkbox"
            className="mt-1"
            checked={workplaceOn}
            onChange={(event) => setWorkplaceOn(event.target.checked)}
          />
          <span>
            <span className="block font-display text-2xl text-chalk">Workplace layer</span>
            <span className="text-sm text-mist">
              {counts.workplace} colleague{counts.workplace === 1 ? "" : "s"} at {company}. These
              enter the enrich queue.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-line bg-moss/70 p-5">
          <input
            type="checkbox"
            className="mt-1"
            checked={personalOn}
            onChange={(event) => setPersonalOn(event.target.checked)}
          />
          <span>
            <span className="block font-display text-2xl text-chalk">Personal layer</span>
            <span className="text-sm text-mist">
              {counts.personal} connection{counts.personal === 1 ? "" : "s"} outside {company}.
              They sit on the map as weak outer ties unless you turn them off.
            </span>
          </span>
        </label>
      </div>

      {counts.workplace === 0 ? (
        <p className="mt-6 rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm text-chalk">
          Nobody matched {company}. Check the company name from onboarding, or include the personal
          layer and skip enrichment.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!workplaceOn && !personalOn}
          className="rounded-full bg-aquifer px-5 py-2 text-sm font-medium text-peat disabled:opacity-40"
          onClick={() => {
            setLayers({ includeWorkplace: workplaceOn, includePersonal: personalOn });
            router.push("/enrich");
          }}
        >
          Continue to three questions
        </button>
        <Link href="/import" className="rounded-full border border-line px-5 py-2 text-sm text-mist">
          Back
        </Link>
      </div>
    </div>
  );
}
