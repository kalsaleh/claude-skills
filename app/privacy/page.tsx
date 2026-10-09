"use client";

import Link from "next/link";
import { clearStoredSession, clearVerdicts } from "@/lib/client-store";
import { clearBuilder, clearWorkplace } from "@/lib/storage";
import { useWorkplace } from "@/lib/workplace-context";

export default function PrivacyPage() {
  const { reset } = useWorkplace();

  return (
    <article className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-copper">UK · server for mapping only</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-mist">
        <p>
          Confirmations — confirm, wrong, not sure — stay in <code className="text-chalk">localStorage</code>{" "}
          on this browser. Clearing site data, or the button below, deletes them.
        </p>
        <p>
          Demo mode uses a fictional Harbourline team. Those LinkedIn URLs are not sent to The Swarm.
          The sample people and companies are invented.
        </p>
        <p>
          Live mode sends the LinkedIn URLs you paste to this app’s server, which calls The Swarm
          with <code className="text-chalk">SWARM_API_KEY</code>. The key is read from the server
          environment and is never sent to the browser. The mapped network is held in server memory
          for the session so routes can be searched. It is not written to a database.
        </p>
        <p>
          There is no account, no analytics cookie, and no advertising pixel in this prototype. A
          host in front of the app may still keep ordinary request logs.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-peat"
          onClick={() => {
            clearWorkplace();
            clearBuilder();
            clearVerdicts();
            clearStoredSession();
            reset();
          }}
        >
          Delete local confirmations
        </button>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm text-mist">
          Back to the start
        </Link>
      </div>
    </article>
  );
}
