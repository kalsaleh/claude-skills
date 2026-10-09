"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_COMPANY, DEMO_YOU, demoColleaguePaste } from "@/lib/demo/roster";
import { saveStoredSession } from "@/lib/client-store";

type Mode = "demo" | "live";

export function SetupForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourLinkedin, setYourLinkedin] = useState("");
  const [colleagues, setColleagues] = useState("");
  const [mode, setMode] = useState<Mode>("demo");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => response.json())
      .then((body: { liveAvailable?: boolean }) => {
        if (!cancelled) setLiveAvailable(Boolean(body.liveAvailable));
      })
      .catch(() => {
        if (!cancelled) setLiveAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function loadSample() {
    setCompany(DEMO_COMPANY);
    setYourName(DEMO_YOU.name);
    setYourLinkedin(DEMO_YOU.url);
    setColleagues(demoColleaguePaste());
    setMode("demo");
    setError("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (mode === "live" && !liveAvailable) {
      setError("Live mode needs SWARM_API_KEY on the server. Use the Harbourline sample instead.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/network/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          company,
          yourName,
          yourLinkedin,
          colleagueLinkedins: colleagues,
        }),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) {
        setError(body.error || "Could not start mapping.");
        setPending(false);
        return;
      }
      saveStoredSession(body.id);
      router.push(`/mapping?session=${body.id}`);
    } catch {
      setError("Could not reach the server.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-copper">Setup</p>
      <h1 className="mt-2 font-display text-4xl text-chalk sm:text-5xl">Who is already in the building?</h1>
      <p className="mt-4 text-sm leading-relaxed text-mist">
        Paste colleagues. Groundwater asks The Swarm who else they are tied to, then surfaces the
        links you did not already have — shared pasts, public interactions, and the people who sit
        between two coworkers.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <ModeButton active={mode === "demo"} onClick={() => setMode("demo")}>
          Demo network
        </ModeButton>
        <ModeButton active={mode === "live"} onClick={() => setMode("live")}>
          Live Swarm {liveAvailable ? "" : "(no key)"}
        </ModeButton>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-full border border-line px-4 py-2 text-sm text-mist hover:text-chalk"
        >
          Load Harbourline sample
        </button>
      </div>
      <p className="mt-3 text-sm text-mist">
        {mode === "demo"
          ? "Demo mode maps a fictional team at Harbourline. No API key, and nothing is sent to The Swarm."
          : liveAvailable
            ? "Live mode sends these LinkedIn URLs to The Swarm from the server. The key stays in SWARM_API_KEY."
            : "This server has no SWARM_API_KEY. Live mapping stays off until you add one."}
      </p>

      <label className="mt-8 block text-sm text-chalk" htmlFor="company">
        Company
      </label>
      <input
        id="company"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        placeholder="Harbourline"
        className="mt-2 w-full rounded-2xl border border-line bg-moss/60 px-4 py-3 text-chalk outline-none focus:border-aquifer"
        autoComplete="organization"
        required
      />

      <label className="mt-5 block text-sm text-chalk" htmlFor="your-name">
        Your name
      </label>
      <input
        id="your-name"
        value={yourName}
        onChange={(event) => setYourName(event.target.value)}
        placeholder="Alex Rowan"
        className="mt-2 w-full rounded-2xl border border-line bg-moss/60 px-4 py-3 text-chalk outline-none focus:border-aquifer"
        autoComplete="name"
        required
      />

      <label className="mt-5 block text-sm text-chalk" htmlFor="your-linkedin">
        Your LinkedIn URL
      </label>
      <input
        id="your-linkedin"
        value={yourLinkedin}
        onChange={(event) => setYourLinkedin(event.target.value)}
        placeholder="https://www.linkedin.com/in/…"
        className="mt-2 w-full rounded-2xl border border-line bg-moss/60 px-4 py-3 text-chalk outline-none focus:border-aquifer"
        inputMode="url"
        required
      />

      <label className="mt-5 block text-sm text-chalk" htmlFor="colleagues">
        Colleague LinkedIn URLs
      </label>
      <textarea
        id="colleagues"
        value={colleagues}
        onChange={(event) => setColleagues(event.target.value)}
        placeholder={"https://www.linkedin.com/in/priya-nandakumar\nhttps://www.linkedin.com/in/mateo-alvarez"}
        rows={7}
        className="mt-2 w-full rounded-2xl border border-line bg-moss/60 px-4 py-3 text-chalk outline-none focus:border-aquifer"
        required
      />
      <p className="mt-2 text-xs text-mist">One URL per line. Include the people you already work with, not your whole network.</p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-copper">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat hover:bg-aquifer/90 disabled:opacity-60"
      >
        {pending ? "Queuing connectors…" : "Map the hidden network"}
      </button>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${
        active ? "bg-chalk text-peat" : "border border-line text-mist hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}
