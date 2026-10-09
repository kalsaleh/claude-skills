# Groundwater

The chart under the chart. Groundwater surfaces ties inside your company that you do not already know — shared pasts, public interactions, and the people who sit between colleagues — then lets you confirm or reject them.

British English in the interface. The demo team is fictional.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose **Load Harbourline sample** on setup. Demo mode needs no API key.

`npm run build` produces a production build. API routes need a Node server (`npm start`). Do not set `GITHUB_PAGES=true` for this app: that flag switches Next.js to a static export, which cannot host the Swarm routes.

## Demo mode

Demo mode is the default. It never calls The Swarm. The fixture in `lib/demo/fixture.ts` is a synthetic network in the Relationships response shape (invented people and `.example` companies). Mapping is compressed to a few seconds so you can walk setup → progress → hidden ties → confirm or reject → graph → a route search such as “Pinetrail”.

Confirmations are stored in `localStorage` under `groundwater.verdicts.v1`. Confirmed insights rank higher. “Not sure” ranks lower. “Wrong” leaves the active list and drops bridge nodes that only existed for that insight.

## Live mode (`SWARM_API_KEY`)

Set the key in the server environment. It is read only in route handlers and is never sent to the browser.

```bash
export SWARM_API_KEY="your team key"
npm run dev
```

Then choose **Live Swarm** on setup. The server:

1. `POST https://bee.theswarm.com/team/add-connector` with `{ linkedin_usernames, group: "employees" }`.
2. Polls `POST https://bee.theswarm.com/v3/relationships` with a `match_all` query until `total_count` is stable (or several polls have passed with a non-zero count). Connector mapping is asynchronous on Swarm’s side and often takes one to three minutes. There is no dedicated mapping-status endpoint, so a stable count is the signal we use.
3. Follows `pagination_token` until it disappears, at `limit` 1000, capped at 15 pages.

Paste LinkedIn URLs one per line (slugs are accepted too). Include yourself and the colleagues you want treated as connectors.

## Provider swap

Swarm sits behind `RelationshipProvider` in `lib/providers/types.ts`:

- `addPeople()` — register connectors
- `fetchRelationships()` — one page of `{ query, limit, paginationToken }`

`lib/providers/swarm.ts` is the live client. `lib/providers/mock.ts` serves the demo. `collectRelationships()` paginates either one.

`lib/overlap/engine.ts` (`computeOverlaps`) is the piece a later People Data Labs or Coresignal provider would call. Give it people with job histories (company, start, end, optional headcount) and education (school, major, graduation year). It returns pairwise work overlaps — same employer, overlapping dates, duration in months, weighted by company size so a long stretch at a small firm outranks the same months at a giant — and education overlaps within a year of graduation. The mock provider already runs the engine on the Harbourline cast and adapts the result into Swarm’s response shape. A bought-data provider can do the same and skip Swarm.

## Checks

```bash
npx tsx scripts/verify-hidden-network.ts
```

Covers the overlap weighting, legacy response normalisation, demo pagination, hidden colleague ties, alumni blocs, bridges, the Pinetrail route, and confirmation ranking.

## Swarm response notes

The UI is calibrated to the v3 shape you described (`items`, `connector_id`, `connector_name`, `connection_strength_normalized`, `sources[].origin`). A few published docs disagree with that, so `lib/providers/normalize.ts` accepts both:

- Conceptual docs still show a bare array and `user_id` / `user_name` / `strength_normalized` / `overlap_length` (`"6M"`). OpenAPI and the live calibration use the `connector_*` envelope. Both are normalised.
- `social_engagement` showed up in a real response and is treated as a hidden signal. It is **not** in the published origin enum (FAQ / OpenAPI list `linkedin_connection`, `work_overlap`, `education_overlap`, `shared_investor`, `email_contact`, `calendar_events`, `manual_import` only).
- Add Connector’s schema only documents `usernames_not_found`. Live calls also returned `users_added` and `users_exist`; those fields are optional here.
- `graduation_year` is a string in OpenAPI and sometimes a number. We store a string.
- `match_all` is assumed to mean “the whole team network”. The docs show filtered examples, not this query. If a key rejects it, the mapping screen surfaces the status.
- Colleague-to-colleague ties are read from colleague profiles that appear as relationship items (as in the live calibration). If Swarm ever omits connectors from `items`, those pairs will not show until a provider computes them with the overlap engine.
- The full fetch stops after 15 pages (15,000 profiles) so a token loop cannot run forever.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
