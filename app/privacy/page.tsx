"use client";

import Link from "next/link";
import { clearWorkplace } from "@/lib/storage";
import { useWorkplace } from "@/lib/workplace-context";

export default function PrivacyPage() {
  const { reset } = useWorkplace();

  return (
    <article className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-copper">UK · browser only</p>
      <h1 className="mt-2 font-display text-4xl text-chalk">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-mist">
        <p>
          Groundwater is an IC prototype. It does not create an account, it does not phone home,
          and it does not store your workplace on a server. The map lives in{" "}
          <code className="text-chalk">localStorage</code> in this browser, on this machine.
        </p>
        <p>
          The Harbourline demo is fictional — a UK SaaS workplace invented so you can click the
          product without uploading colleagues. If you choose to import a LinkedIn Connections.csv,
          parsing happens locally. We do not send the file, we do not match it against a graph
          database, and we do not contact anyone in it.
        </p>
        <p>
          There are no analytics cookies, no advertising identifiers, and no third-party pixels on
          this prototype. If you deploy it behind your own hosting, that host may see ordinary
          request logs for static assets. The workplace itself still does not leave the browser.
        </p>
        <p>
          Under UK GDPR this is data you hold yourself. Clearing the prototype deletes the
          localStorage key. Closing the tab does not. Use the button below, or your browser&apos;s
          site-data controls.
        </p>
        <p>
          The Structural Fold manager pack is a modal, not a purchase. There is no payment
          processor and no email capture.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-peat"
          onClick={() => {
            clearWorkplace();
            reset();
          }}
        >
          Delete local workplace
        </button>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm text-mist">
          Back to the start
        </Link>
      </div>
    </article>
  );
}
