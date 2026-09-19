"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pathEdgeIds } from "@/lib/network";
import { playbookBySlug } from "@/lib/playbooks";
import { useWorkplace } from "@/lib/workplace-context";
import { useRouter } from "next/navigation";

export function PlaybookDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const playbook = playbookBySlug(slug);
  const { workplace, setHighlight, setSelectedId } = useWorkplace();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = playbook?.steps[step];
  const demo = workplace?.source === "demo";

  const missing = useMemo(() => {
    if (!playbook || !workplace) return false;
    return playbook.steps.some((item) =>
      item.nodeIds.some((id) => !workplace.people.some((person) => person.id === id)),
    );
  }, [playbook, workplace]);

  if (!playbook) {
    return <p className="px-6 py-16 text-mist">That playbook does not exist.</p>;
  }

  const light = (nodeIds: string[], label: string) => {
    if (!workplace) return;
    setHighlight({
      nodeIds,
      edgeIds: pathEdgeIds(workplace, nodeIds),
      label,
    });
    setSelectedId(nodeIds[0] ?? null);
    router.push("/map");
  };

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-copper">{playbook.kicker}</p>
      <h1 className="mt-2 font-display text-4xl text-chalk sm:text-5xl">{playbook.title}</h1>
      <p className="mt-4 text-lg text-mist">{playbook.summary}</p>
      <p className="mt-3 text-sm leading-relaxed text-chalk/85">{playbook.stakes}</p>

      {missing ? (
        <p className="mt-6 rounded-2xl border border-line bg-moss px-4 py-3 text-sm text-mist">
          This walkthrough is written against the Harbourline demo.{" "}
          <Link href="/onboarding" className="text-aquifer underline">
            Load the demo workplace
          </Link>{" "}
          to see the named people on the map. You can still read the moves.
        </p>
      ) : null}

      <ol className="mt-10 space-y-4">
        {playbook.steps.map((item, index) => (
          <li
            key={item.title}
            className={`rounded-3xl border p-5 ${
              index === step ? "border-aquifer bg-moss" : "border-line bg-peat/40"
            }`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setStep(index)}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-mist">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-2xl text-chalk">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">{item.body}</p>
              {item.note ? (
                <p className="mt-2 text-sm italic text-copper">{item.note}</p>
              ) : null}
            </button>
            <button
              type="button"
              disabled={!workplace || missing}
              className="mt-4 text-sm text-aquifer hover:underline disabled:opacity-40"
              onClick={() => light(item.nodeIds, item.title)}
            >
              See this on the map
            </button>
          </li>
        ))}
      </ol>

      <section className="mt-10 rounded-3xl border border-line bg-moss p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-copper">Draft you can steal</p>
        <p className="mt-2 text-sm text-mist">
          To {playbook.draft.to} · {playbook.draft.subject}
        </p>
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-chalk/90">
          {playbook.draft.body}
        </pre>
        <button
          type="button"
          className="mt-4 rounded-full border border-line px-4 py-2 text-sm text-mist hover:text-chalk"
          onClick={async () => {
            await navigator.clipboard.writeText(playbook.draft.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Copied" : "Copy draft"}
        </button>
      </section>

      {current && demo ? (
        <p className="mt-8 text-sm text-mist">
          Currently on step {step + 1}: {current.title}.
        </p>
      ) : null}
    </article>
  );
}
