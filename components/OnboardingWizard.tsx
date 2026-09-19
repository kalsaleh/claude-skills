"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseConnectionsCsv, workplaceFromConnections } from "@/lib/csv";
import type { Intent, Profile } from "@/lib/types";
import { useWorkplace } from "@/lib/workplace-context";

const STEPS = [
  { n: "01", title: "You" },
  { n: "02", title: "The job" },
  { n: "03", title: "The workplace" },
];

const INTENTS: { id: Intent; title: string; body: string }[] = [
  {
    id: "cross-dept",
    title: "Get a yes from another department",
    body: "A request that has to walk out of your cluster — Finance, Legal, Sales, someone who does not report to your manager.",
  },
  {
    id: "promotion",
    title: "Find a sponsor, not just a manager",
    body: "The packet is the easy part. You need someone who will say your name in the room you are not invited to.",
  },
  {
    id: "see-the-room",
    title: "Just see the informal chart",
    body: "No immediate ask. You want brokers, weak ties, and the holes before you spend political capital.",
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { loadDemo, loadImported } = useWorkplace();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    name: "Alex Rowan",
    role: "Senior Product Manager",
    team: "Platform",
    intent: "see-the-room",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canNext = useMemo(() => {
    if (step === 0) return profile.name.trim().length > 1 && profile.role.trim().length > 1;
    if (step === 1) return Boolean(profile.intent);
    return true;
  }, [profile, step]);

  const enterDemo = () => {
    loadDemo(profile);
    router.push("/map");
  };

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseConnectionsCsv(text);
      const workplace = workplaceFromConnections(rows, profile);
      loadImported(workplace);
      router.push("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-copper">Three steps · then the map</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Load a workplace</h1>
      <p className="mt-3 text-mist">
        Nothing leaves this browser. The Harbourline demo is the fastest way to see the prototype
        working; a Connections.csv is optional.
      </p>

      <ol className="mt-8 flex gap-4 text-sm">
        {STEPS.map((item, index) => (
          <li
            key={item.n}
            className={`flex items-center gap-2 ${index === step ? "text-chalk" : "text-mist"}`}
          >
            <span className="font-display text-xl">{item.n}</span>
            {item.title}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl border border-line bg-moss/80 p-6 sm:p-8">
        {step === 0 ? (
          <div className="space-y-4">
            <label className="block text-sm text-mist">
              Your name
              <input
                className="mt-1 w-full rounded-xl border border-line bg-peat px-3 py-2 text-chalk"
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>
            <label className="block text-sm text-mist">
              Role
              <input
                className="mt-1 w-full rounded-xl border border-line bg-peat px-3 py-2 text-chalk"
                value={profile.role}
                onChange={(event) => setProfile({ ...profile, role: event.target.value })}
              />
            </label>
            <label className="block text-sm text-mist">
              Team
              <input
                className="mt-1 w-full rounded-xl border border-line bg-peat px-3 py-2 text-chalk"
                value={profile.team}
                onChange={(event) => setProfile({ ...profile, team: event.target.value })}
              />
            </label>
            <p className="text-xs text-mist">
              Defaults are the Harbourline IC persona. Change them if you want the map to say you.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            {INTENTS.map((intent) => (
              <button
                key={intent.id}
                type="button"
                onClick={() => setProfile({ ...profile, intent: intent.id })}
                className={`w-full rounded-2xl border px-4 py-4 text-left ${
                  profile.intent === intent.id
                    ? "border-aquifer bg-aquifer/10"
                    : "border-line hover:border-mist"
                }`}
              >
                <p className="font-medium text-chalk">{intent.title}</p>
                <p className="mt-1 text-sm text-mist">{intent.body}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={enterDemo}
              className="w-full rounded-2xl bg-aquifer px-5 py-5 text-left text-peat"
            >
              <p className="text-[11px] uppercase tracking-[0.18em]">Recommended</p>
              <p className="font-display text-2xl">Load demo workplace</p>
              <p className="mt-1 text-sm opacity-80">
                Harbourline — UK SaaS, London HQ. Brokers, weak ties, two playbooks, already wired.
              </p>
            </button>
            <div className="rounded-2xl border border-dashed border-line px-5 py-5">
              <p className="font-medium text-chalk">Or import Connections.csv</p>
              <p className="mt-1 text-sm text-mist">
                Optional. LinkedIn export stays in localStorage. We infer clusters from shared
                organisations; we do not message anyone.
              </p>
              <label className="mt-4 inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm text-chalk hover:border-aquifer">
                {busy ? "Reading…" : "Choose CSV"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onFile(file);
                  }}
                />
              </label>
              <p className="mt-3 text-xs text-mist">
                Need a shape?{" "}
                <a className="text-aquifer underline" href="/samples/Connections.csv">
                  Download a sample file
                </a>
                .
              </p>
              {error ? <p className="mt-2 text-sm text-copper">{error}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-mist hover:text-chalk disabled:opacity-30"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              className="rounded-full bg-chalk px-4 py-2 text-sm font-medium text-peat disabled:opacity-40"
              onClick={() => setStep((value) => value + 1)}
            >
              Continue
            </button>
          ) : (
            <Link href="/" className="text-sm text-mist hover:text-chalk">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
