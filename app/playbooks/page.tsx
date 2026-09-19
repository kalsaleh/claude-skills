import Link from "next/link";
import { PLAYBOOKS } from "@/lib/playbooks";

export default function PlaybooksPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-copper">Two walks</p>
      <h1 className="mt-2 font-display text-4xl text-chalk sm:text-5xl">Playbooks</h1>
      <p className="mt-4 max-w-2xl text-mist">
        Groundwater is not a feed of tips. It is a map plus a walk. These two are written against
        the Harbourline demo — a pricing experiment that has to reach Finance, and a promotion that
        needs a sponsor in the room you will not enter.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {PLAYBOOKS.map((playbook) => (
          <Link
            key={playbook.slug}
            href={`/playbooks/${playbook.slug}`}
            className="group rounded-3xl border border-line bg-moss/70 p-6 hover:border-aquifer"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-copper">{playbook.kicker}</p>
            <h2 className="mt-2 font-display text-3xl text-chalk group-hover:text-aquifer">
              {playbook.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">{playbook.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
