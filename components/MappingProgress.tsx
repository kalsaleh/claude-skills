"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { saveStoredSession } from "@/lib/client-store";
import type { PublicSession } from "@/lib/sessions";

export function MappingProgress() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session") ?? "";
  const [session, setSession] = useState<PublicSession | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setMissing(true);
      return;
    }
    saveStoredSession(sessionId);
    let stop = false;
    let timer = 0;

    async function tick() {
      const response = await fetch(`/api/network/session/${sessionId}`, { cache: "no-store" });
      if (stop) return;
      if (response.status === 404) {
        setMissing(true);
        return;
      }
      const body = (await response.json()) as PublicSession;
      setSession(body);
      if (body.status === "mapping") {
        timer = window.setTimeout(tick, body.mode === "live" ? 4000 : 700);
      } else if (body.status === "ready") {
        timer = window.setTimeout(() => {
          if (!stop) router.push(`/network?session=${sessionId}`);
        }, 1100);
      }
    }

    tick().catch(() => {
      if (!stop) setMissing(true);
    });
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [router, sessionId]);

  if (!sessionId || missing) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-4xl text-chalk">Mapping session missing</h1>
        <p className="mt-3 text-sm text-mist">Start again from setup. Sessions live in server memory for this prototype.</p>
        <a href="/setup" className="mt-6 inline-block rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat">
          Back to setup
        </a>
      </div>
    );
  }

  const ready = session?.status === "ready";
  const failed = session?.status === "error";
  const progress = !session ? 8 : ready ? 100 : failed ? 100 : session.mode === "demo" ? Math.min(88, 18 + session.polls * 28) : Math.min(80, 12 + session.polls * 9);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-copper">
        {session?.mode === "live" ? "Live mapping" : "Demo mapping"}
      </p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Reading the aquifer</h1>
      <p className="mt-4 text-sm leading-relaxed text-mist" role="status">
        {session?.message ?? "Queuing connectors…"}
      </p>
      {session?.demoNotice ? <p className="mt-3 text-sm text-mist">{session.demoNotice}</p> : null}

      <div className="mt-8 h-2 overflow-hidden rounded-full bg-moss" aria-hidden>
        <div className="h-full rounded-full bg-aquifer transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <ol className="mt-8 space-y-4 text-sm">
        <Step done label="Connectors accepted" detail={addDetail(session)} />
        <Step
          done={ready || (session?.polls ?? 0) > 1}
          label="Relationships arriving"
          detail={
            session?.totalCount
              ? `${session.totalCount.toLocaleString("en-GB")} profiles`
              : "Waiting for the first page"
          }
        />
        <Step done={ready} label="Hidden ties ranked" detail={ready ? "Ready to confirm or reject" : "Not yet"} />
      </ol>

      {session && session.add.usernamesNotFound.length > 0 ? (
        <p className="mt-6 text-sm text-copper" role="alert">
          Not found: {session.add.usernamesNotFound.join(", ")}
        </p>
      ) : null}
      {failed ? (
        <p className="mt-6 text-sm text-copper" role="alert">
          {session?.error}
        </p>
      ) : null}

      {session?.roster?.length ? (
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {session.roster.map((person) => (
            <li key={person.slug} className="rounded-2xl border border-line px-4 py-3 text-sm">
              <span className="text-chalk">{person.name}</span>
              <span className="mt-1 block text-xs text-mist">{person.you ? "You" : "Colleague"}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {ready ? (
        <a
          href={`/network?session=${sessionId}`}
          className="mt-8 inline-block rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat"
        >
          Review hidden ties
        </a>
      ) : null}
    </div>
  );
}

function addDetail(session: PublicSession | null) {
  if (!session) return "Sending the list";
  const parts = [];
  if (session.add.usersAdded) parts.push(`${session.add.usersAdded} added`);
  if (session.add.usersExist) parts.push(`${session.add.usersExist} already on the team`);
  return parts.join(" · ") || "Accepted";
}

function Step({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
          done ? "bg-aquifer text-peat" : "border border-line text-mist"
        }`}
        aria-hidden
      >
        {done ? "✓" : ""}
      </span>
      <span>
        <span className="block text-chalk">{label}</span>
        <span className="text-mist">{detail}</span>
      </span>
    </li>
  );
}
