"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseConnectionsCsv, workplaceFromConnections } from "@/lib/csv";
import { useWorkplace } from "@/lib/workplace-context";

export default function ImportPage() {
  const router = useRouter();
  const { workplace, loadImported } = useWorkplace();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profile = workplace?.profile ?? {
    name: "Alex Rowan",
    role: "Senior Product Manager",
    team: "Platform",
    intent: "see-the-room" as const,
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-copper">Optional</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Import Connections.csv</h1>
      <p className="mt-3 text-sm leading-relaxed text-mist">
        LinkedIn&apos;s export header is fine (including the Notes preamble). Parsing never leaves
        this browser. Clusters are shared organisations, not an official chart.
      </p>
      <label className="mt-8 flex cursor-pointer flex-col items-start gap-3 rounded-3xl border border-dashed border-line bg-moss/70 px-6 py-8">
        <span className="rounded-full bg-aquifer px-4 py-2 text-sm font-medium text-peat">
          {busy ? "Reading…" : "Choose CSV"}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              const rows = parseConnectionsCsv(await file.text());
              loadImported(workplaceFromConnections(rows, profile));
              router.push("/map");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not read that file.");
            } finally {
              setBusy(false);
            }
          }}
        />
        <span className="text-sm text-mist">
          Or{" "}
          <a className="text-aquifer underline" href="/samples/Connections.csv">
            download the sample file
          </a>{" "}
          and import that.
        </span>
      </label>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      <p className="mt-8 text-sm text-mist">
        Prefer the known workplace?{" "}
        <Link href="/onboarding" className="text-aquifer underline">
          Load Harbourline
        </Link>
        .
      </p>
    </div>
  );
}
