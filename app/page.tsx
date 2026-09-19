import Link from "next/link";

const PILLARS = [
  {
    kicker: "Brokers",
    title: "The people who carry corridors",
    body: "Not the loudest. The ones both rooms will take a meeting from. A request that goes through a broker arrives already translated.",
  },
  {
    kicker: "Weak ties",
    title: "Novelty travels on thin lines",
    body: "Your daily cluster already knows what you know. The useful door is often someone from an offsite, a single deal, a shared incident.",
  },
  {
    kicker: "Playbooks",
    title: "Two walks, not a CRM",
    body: "A cross-department ask. A promotion sponsor. Each one is a path on the map plus a draft you can actually send.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-copper">
            Informal org chart · not your pipeline
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-chalk sm:text-7xl">
            The chart under the chart.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Groundwater is an AI tool that helps you build the informal organisation — not a blank
            canvas. LinkedIn proves the link. You name what it means.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat hover:bg-aquifer/90"
            >
              Build your map
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-line px-5 py-3 text-sm text-mist hover:text-chalk"
            >
              How privacy works
            </Link>
          </div>
          <p className="mt-6 max-w-lg text-sm text-mist">
            Three taps: team · how they matter · how real the tie is. Then a map. Insights unlock
            after five named people.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-moss/80 p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Harbourline · London</p>
          <svg viewBox="0 0 360 280" className="mt-4 h-auto w-full">
            <line x1="180" y1="140" x2="70" y2="70" stroke="#4aa392" strokeOpacity="0.5" />
            <line x1="180" y1="140" x2="290" y2="80" stroke="#d4895a" strokeDasharray="5 5" strokeOpacity="0.8" />
            <line x1="180" y1="140" x2="90" y2="210" stroke="#4aa392" strokeOpacity="0.4" />
            <line x1="180" y1="140" x2="270" y2="210" stroke="#9b8ec4" strokeDasharray="3 3" strokeOpacity="0.7" />
            <line x1="70" y1="70" x2="40" y2="130" stroke="#6b8fd4" strokeOpacity="0.45" />
            <circle cx="180" cy="140" r="16" fill="#4aa392" />
            <circle cx="180" cy="140" r="22" fill="none" stroke="#4aa392" />
            <circle cx="70" cy="70" r="11" fill="#6b8fd4" />
            <circle cx="70" cy="70" r="16" fill="none" stroke="#d4895a" />
            <circle cx="290" cy="80" r="10" fill="#7a9e7e" />
            <circle cx="90" cy="210" r="10" fill="#c4a35a" />
            <circle cx="270" cy="210" r="11" fill="#6b8fd4" />
            <circle cx="270" cy="210" r="17" fill="none" stroke="#9b8ec4" strokeDasharray="3 3" />
            <circle cx="40" cy="130" r="9" fill="#e8e4d9" />
            <text x="180" y="172" textAnchor="middle" fill="#f3efe4" fontSize="11">
              you
            </text>
            <text x="70" y="54" textAnchor="middle" fill="#d4895a" fontSize="10">
              broker
            </text>
            <text x="290" y="64" textAnchor="middle" fill="#9aa89f" fontSize="10">
              weak tie
            </text>
            <text x="270" y="236" textAnchor="middle" fill="#9b8ec4" fontSize="10">
              fold
            </text>
          </svg>
          <p className="text-sm text-mist">
            Official charts show reporting. Groundwater shows the aquifer: brokers, weak ties, and
            the rare people who sit in two rooms at once.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-moss/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.kicker}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-copper">{pillar.kicker}</p>
              <h2 className="mt-2 font-display text-2xl text-chalk">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="font-display text-3xl text-chalk">What this is not</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Not a pipeline",
              body: "There are no stages, no next actions, no 'touches'. Career work is not outbound.",
            },
            {
              title: "Not a manager spyglass",
              body: "The Structural Fold pack is a tease, not a checkout. This map is for ICs walking their own building.",
            },
            {
              title: "Not a blank canvas",
              body: "Import a CSV, filter same-company versus personal, then name people in three taps. The map is built, not drawn.",
            },
          ].map((item) => (
            <li key={item.title} className="rounded-2xl border border-line p-5">
              <h3 className="font-medium text-chalk">{item.title}</h3>
              <p className="mt-2 text-sm text-mist">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-moss/60 px-6 py-8">
          <div>
            <p className="font-display text-2xl text-chalk">Use the sample export.</p>
            <p className="text-sm text-mist">
              Harbourline CSV, then filter, then three questions. About five minutes.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="rounded-full bg-chalk px-5 py-3 text-sm font-medium text-peat"
          >
            Begin the builder
          </Link>
        </div>
      </section>
    </div>
  );
}
