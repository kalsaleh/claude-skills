"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BuilderStepper } from "@/components/BuilderStepper";
import { parseConnectionsCsv } from "@/lib/csv";
import { DEFAULT_PROFILE } from "@/lib/types";
import { useWorkplace } from "@/lib/workplace-context";

export default function ImportPage() {
  const router = useRouter();
  const { ready, builder, startBuilder, ingestRows } = useWorkplace();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (ready && !builder) startBuilder(DEFAULT_PROFILE);
  }, [ready, builder, startBuilder]);

  const ingest = async (text: string) => {
    setBusy(true);
    setError(null);
    try {
      const rows = parseConnectionsCsv(text);
      ingestRows(rows);
      setCount(rows.length);
      router.push("/filter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <BuilderStepper current="import" />
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-copper">Step 1 · Import</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Connections.csv</h1>
      <p className="mt-3 text-lg text-chalk/90">LinkedIn proves the link. You name what it means.</p>
      <p className="mt-2 text-sm leading-relaxed text-mist">
        Parsing never leaves this browser. We do not message anyone. Company matching uses what you
        typed in onboarding
        {builder?.profile.company ? ` (${builder.profile.company})` : ""}.
      </p>

      <div className="mt-8 space-y-4">
        <label className="flex cursor-pointer flex-col gap-3 rounded-3xl border border-dashed border-line bg-moss/70 px-6 py-8">
          <span className="rounded-full bg-chalk px-4 py-2 text-sm font-medium text-peat w-fit">
            {busy ? "Reading…" : "Upload Connections.csv"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await ingest(await file.text());
            }}
          />
          <span className="text-sm text-mist">
            LinkedIn export header is fine, including the Notes preamble.
          </span>
        </label>

        <button
          type="button"
          disabled={busy}
          className="w-full rounded-3xl bg-aquifer px-6 py-5 text-left text-peat"
          onClick={async () => {
            const response = await fetch("/samples/Connections.csv");
            await ingest(await response.text());
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em]">Fastest demo</p>
          <p className="font-display text-2xl">Use sample</p>
          <p className="mt-1 text-sm opacity-80">
            Fictional Harbourline export — colleagues plus a couple of personal ties.
          </p>
        </button>
      </div>

      {count !== null ? (
        <p className="mt-4 text-sm text-aquifer">{count} connections parsed.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}

      <p className="mt-8 text-sm text-mist">
        Want a pre-named map instead?{" "}
        <Link href="/onboarding" className="text-aquifer underline">
          Skip to the finished Harbourline demo
        </Link>
        .
      </p>
    </div>
  );
}
