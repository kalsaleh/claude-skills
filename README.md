# Groundwater

The informal org chart for your career — not your pipeline.

This is a clickable **IC prototype**: a Next.js 15 app that maps brokers, weak ties, and the quiet paths work actually takes. It ships with a fictional UK SaaS workplace (**Harbourline**), two playbooks, a Structural Fold manager-pack tease, and an optional LinkedIn `Connections.csv` import. Everything stays in `localStorage`. British English throughout.

## Browse and clone

- Browse: https://github.com/kalsaleh/groundwater-prototype
- Clone: `git clone https://github.com/kalsaleh/groundwater-prototype.git`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## What to click

1. Landing — the IC promise.
2. Onboarding — three steps, then **Load demo workplace**.
3. Map — drag to pan, scroll to zoom, click people. Copper rings are brokers; dashed lines are weak ties.
4. Playbooks — *Walk a pricing experiment into Finance* and *Find a sponsor for the pay-review room*. Each step can light a path on the map.
5. Structural Fold — manager pack modal, not a checkout.
6. Optional CSV — sample at [`public/samples/Connections.csv`](public/samples/Connections.csv).
7. Privacy — delete the local workplace.

## Privacy

No account, no server-side workplace, no analytics pixels. Demo colleagues are fictional. An imported CSV is parsed in the browser only.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
