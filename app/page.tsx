import Link from "next/link";

const PILLARS = [
  {
    kicker: "Hidden ties",
    title: "The links nobody drew",
    body: "Two colleagues who never connected on LinkedIn, but overlapped at a former employer or keep showing up in each other’s public posts.",
  },
  {
    kicker: "Alumni blocs",
    title: "The old company, still in the room",
    body: "A cluster of coworkers and outside contacts who all spent the same years at one firm. Dates included, so you can see how deep it went.",
  },
  {
    kicker: "Bridges",
    title: "Who sits between whom",
    body: "The person tied to two or more colleagues. Often someone you do not have on LinkedIn, which is exactly why they are useful.",
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
            Groundwater finds the ties inside your company that you do not already know. You confirm
            or reject them. You do not label a queue of people you already meet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/setup"
              className="rounded-full bg-aquifer px-5 py-3 text-sm font-medium text-peat hover:bg-aquifer/90"
            >
              Uncover hidden ties
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-line px-5 py-3 text-sm text-mist hover:text-chalk"
            >
              How privacy works
            </Link>
          </div>
          <p className="mt-6 max-w-lg text-sm text-mist">
            Paste colleague LinkedIn URLs. The Swarm maps the network. You keep the surprises and
            throw out the rest.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-moss/80 p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Harbourline · sample</p>
          <svg viewBox="0 0 360 280" className="mt-4 h-auto w-full" role="img" aria-label="Sketch of colleagues and a bridge between them">
            <line x1="180" y1="140" x2="70" y2="70" stroke="#4aa392" strokeOpacity="0.5" />
            <line x1="180" y1="140" x2="290" y2="80" stroke="#d4895a" strokeDasharray="5 5" strokeOpacity="0.8" />
            <line x1="70" y1="70" x2="290" y2="80" stroke="#d4895a" strokeOpacity="0.9" />
            <line x1="180" y1="140" x2="90" y2="210" stroke="#4aa392" strokeOpacity="0.4" />
            <line x1="90" y1="210" x2="270" y2="210" stroke="#4aa392" strokeOpacity="0.55" />
            <line x1="180" y1="140" x2="270" y2="210" stroke="#9b8ec4" strokeDasharray="3 3" strokeOpacity="0.45" />
            <circle cx="180" cy="140" r="16" fill="#e8e4d9" />
            <circle cx="180" cy="140" r="22" fill="none" stroke="#4aa392" />
            <circle cx="70" cy="70" r="11" fill="#4aa392" />
            <circle cx="290" cy="80" r="11" fill="#4aa392" />
            <circle cx="180" cy="48" r="10" fill="#d4895a" />
            <circle cx="180" cy="48" r="15" fill="none" stroke="#d4895a" />
            <line x1="70" y1="70" x2="180" y2="48" stroke="#d4895a" strokeOpacity="0.85" />
            <line x1="290" y1="80" x2="180" y2="48" stroke="#d4895a" strokeOpacity="0.85" />
            <circle cx="90" cy="210" r="10" fill="#4aa392" />
            <circle cx="270" cy="210" r="10" fill="#4aa392" />
            <text x="180" y="168" textAnchor="middle" fill="#f3efe4" fontSize="11">
              you
            </text>
            <text x="180" y="30" textAnchor="middle" fill="#d4895a" fontSize="10">
              bridge
            </text>
            <text x="70" y="54" textAnchor="middle" fill="#9aa89f" fontSize="10">
              colleague
            </text>
            <text x="290" y="64" textAnchor="middle" fill="#9aa89f" fontSize="10">
              colleague
            </text>
            <text x="180" y="236" textAnchor="middle" fill="#9aa89f" fontSize="10">
              shared past
            </text>
          </svg>
          <p className="text-sm text-mist">
            Official charts show reporting. Groundwater shows the aquifer: hidden colleague ties,
            alumni blocs, and the person who quietly sits between two rooms.
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
              title: "Not a labelling queue",
              body: "You already know who meets whom. The product’s job is the tie you would not have written down.",
            },
            {
              title: "Not inbox ingestion",
              body: "Calendar and email are how you already know a relationship. They are not the surprise.",
            },
            {
              title: "Not a manager spyglass",
              body: "This map is for someone walking their own company. Confirmations never leave this browser.",
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
            <p className="font-display text-2xl text-chalk">Walk the Harbourline sample.</p>
            <p className="text-sm text-mist">A fictional team, in the Swarm response shape, with no API key.</p>
          </div>
          <Link href="/setup" className="rounded-full bg-chalk px-5 py-3 text-sm font-medium text-peat">
            Load the demo
          </Link>
        </div>
      </section>
    </div>
  );
}
