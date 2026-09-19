# Groundwater

The informal org chart for your career — not your pipeline.

An **AI-assisted map builder** (heuristics today, same interface for a later Claude swap): import LinkedIn `Connections.csv`, split workplace vs personal, then name people in three taps. Everything stays in `localStorage`. British English.

## Browse and clone

- Browse: https://github.com/kalsaleh/groundwater-prototype
- Clone: `git clone https://github.com/kalsaleh/groundwater-prototype.git`

Until that repo exists, the working branch is
`cursor/groundwater-prototype-09cb` on `kalsaleh/claude-skills`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to demo the enrich flow

1. **Build your map** on the landing page (or `/onboarding`).
2. Keep company as **Harbourline**. Continue to import.
3. Click **Use sample** (do not skip to the finished demo).
4. **Filter** — workplace count vs personal layer (Northsea / Dockside). Continue.
5. **Name them** — top ~10–12 same-company people, ranked seniority → other-team → peer.
   - Chip: “Suggested: Product · Broker — from title”
   - Accept or override.
   - Three taps: team · how they matter · tie (default weak).
6. Name at least **five** people with a role other than “Not sure yet”, then open the map. Insights unlock.
7. **Skip remaining** once to see the soft empty / locked-insights state.

“LinkedIn proves the link. You name what it means.”

## Also in the prototype

- Finished Harbourline map (onboarding → skip builder) for the two playbooks
- Structural Fold manager-pack modal
- Privacy page; no server; no LLM calls yet (`lib/suggest.ts` + `enrichmentAssistant.suggest`)

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
