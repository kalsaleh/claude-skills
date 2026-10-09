import assert from "node:assert/strict";
import { companySizeFactor, computeOverlaps, type CareerPerson } from "../lib/overlap/engine";
import { buildDemoItems } from "../lib/demo/fixture";
import { DEMO_COMPANY, DEMO_ROSTER, DEMO_YOU } from "../lib/demo/roster";
import { buildNetworkModel, buildSnapshot, findPaths } from "../lib/insights/engine";
import { insightScore, rankInsights } from "../lib/insights/rank";
import { normalizeRelationships } from "../lib/providers/normalize";
import { collectRelationships } from "../lib/providers";
import { mockProvider } from "../lib/providers/mock";

const small = companySizeFactor(45);
const large = companySizeFactor(8000);
assert.ok(small > large, "smaller companies should weigh more");

const pair: CareerPerson[] = [
  {
    id: "a",
    name: "A",
    jobs: [
      { company: "Keel & Co", start: "2016-01-01", end: "2019-07-01", employeeCount: 45 },
      { company: "Megacorp", start: "2016-01-01", end: "2019-07-01", employeeCount: 8000 },
    ],
  },
  {
    id: "b",
    name: "B",
    jobs: [
      { company: "Keel and Co.", start: "2016-01-01", end: "2019-07-01", employeeCount: 45 },
      { company: "Megacorp", start: "2016-01-01", end: "2019-07-01", employeeCount: 8000 },
    ],
    education: [
      { school: "Alder Polytechnic", major: "Economics", graduationYear: 2013 },
    ],
  },
  {
    id: "c",
    name: "C",
    jobs: [],
    education: [{ school: "Alder Polytechnic", major: "Economics", graduationYear: 2013 }],
  },
];

const overlaps = computeOverlaps(pair, { now: "2026-10-09" });
const keel = overlaps.find((item) => item.kind === "work_overlap" && item.sharedCompany.startsWith("Keel"));
const mega = overlaps.find((item) => item.kind === "work_overlap" && item.sharedCompany === "Megacorp");
assert.ok(keel && mega && keel.kind === "work_overlap" && mega.kind === "work_overlap");
assert.equal(keel.overlapDurationMonths, mega.overlapDurationMonths);
assert.ok(keel.weight > mega.weight, "same months at a smaller firm should outrank a giant");
assert.ok(overlaps.some((item) => item.kind === "education_overlap" && item.sharedMajor === "Economics"));

const noOverlap = computeOverlaps(
  [
    { id: "a", name: "A", jobs: [{ company: "North", start: "2010-01-01", end: "2012-01-01" }] },
    { id: "b", name: "B", jobs: [{ company: "North", start: "2014-01-01", end: "2016-01-01" }] },
  ],
  { now: "2026-10-09" },
);
assert.equal(noOverlap.length, 0);

const legacy = normalizeRelationships([
  {
    profile: { full_name: "David Connors", linkedin_slug: "connorsdavid", current_company_name: "The Swarm" },
    connections: [
      {
        user_id: "3ac2930c-2ff1-49ec-9a02-ab9cb8d6a56e",
        user_name: "Nabil Saad",
        user_linkedin_slug: "nabil-saad",
        strength_normalized: 2,
        connection_strength: 0.32,
        sources: [{ origin: "work_overlap", shared_company: "Sequoia Capital", overlap_length: "6M" }],
      },
      {
        connector_id: "social-1",
        connector_name: "Ada",
        connection_strength_normalized: 2,
        sources: [{ origin: "social_engagement" }],
      },
    ],
  },
]);
assert.equal(legacy.items[0].connections[0].connector_id, "3ac2930c-2ff1-49ec-9a02-ab9cb8d6a56e");
assert.equal(legacy.items[0].connections[0].sources[0].overlap_duration_months, 6);
assert.equal(legacy.items[0].connections[1].sources[0].origin, "social_engagement");
assert.equal(legacy.items[0].profile.linkedin_url, "https://www.linkedin.com/in/connorsdavid");
assert.equal(legacy.total_count, 1);

async function main() {
  const collected = await collectRelationships(mockProvider, { match_all: {} }, { limit: 1000, maxPages: 10 });
assert.ok(collected.items.length > 60, `expected a full demo network, got ${collected.items.length}`);
assert.equal(collected.total_count, collected.items.length);
assert.equal(collected.pagination_token, undefined);

const model = buildNetworkModel(
  {
    company: DEMO_COMPANY,
    youName: DEMO_YOU.name,
    youSlug: DEMO_YOU.slug,
    colleagueSlugs: DEMO_ROSTER.map((person) => person.slug),
  },
  { items: buildDemoItems(), count: buildDemoItems().length, total_count: buildDemoItems().length },
);
const snapshot = buildSnapshot(model, "demo");

const ties = snapshot.insights.filter((insight) => insight.kind === "colleague_tie");
const tieTitles = ties.map((insight) => insight.title);
assert.ok(tieTitles.some((title) => /Priya/.test(title) && /Helen/.test(title)), tieTitles.join(" | "));
assert.ok(tieTitles.some((title) => /Mateo/.test(title) && /Samir/.test(title)), tieTitles.join(" | "));
assert.ok(tieTitles.some((title) => /Helen/.test(title) && /Ines/.test(title)), tieTitles.join(" | "));
assert.ok(!ties.some((insight) => insight.personIds.includes(DEMO_YOU.slug) && insight.evidence.every((item) => item.origin === "linkedin_connection")));
assert.ok(
  !ties.some((insight) => insight.title.includes("Alex") && insight.evidence.some((item) => item.origin === "linkedin_connection")),
  "direct LinkedIn ties of the user should be excluded",
);

const clusters = snapshot.insights.filter((insight) => insight.kind === "shared_past");
assert.ok(clusters.some((insight) => insight.title.includes("Lumenfield")), clusters.map((item) => item.title).join(" | "));
const lumen = clusters.find((insight) => insight.title.includes("Lumenfield"));
assert.match(lumen?.body ?? "", /Apr 2017/);
assert.doesNotMatch(lumen?.body ?? "", /Mar 2016/);
assert.ok(clusters.some((insight) => insight.title.includes("Keel")), clusters.map((item) => item.title).join(" | "));
assert.ok(!clusters.some((insight) => insight.title.includes("Harbourline")));

const bridges = snapshot.insights.filter((insight) => insight.kind === "bridge");
assert.ok(bridges.some((insight) => insight.title.startsWith("Nora Voss")), bridges.map((item) => item.title).join(" | "));
assert.ok(bridges[0].evidence.length > 0);

const paths = findPaths(model, "Pinetrail");
assert.ok(paths.insights[0]?.title.includes("Nora Voss"), paths.insights.map((item) => item.title).join(" | "));
assert.ok(paths.insights[0]?.body.includes("Priya"), paths.insights[0]?.body);
assert.ok(paths.insights[0]?.body.includes("Owen Blake"));
assert.ok(!paths.insights.some((insight) => insight.title.includes("Owen")), "the known LinkedIn door should be a footnote, not the route");

const social = ties.find((insight) => insight.title.includes("Priya") && insight.title.includes("Helen"));
assert.ok(social);
const ranked = rankInsights(ties, { [social.id]: "wrong" });
assert.equal(insightScore(social, "wrong"), -1);
assert.ok(insightScore(social, "confirmed") > insightScore(social));
assert.equal(ranked.at(-1)?.id, social.id);

const work = snapshot.stats.sourceCounts.work_overlap ?? 0;
const linkedin = snapshot.stats.sourceCounts.linkedin_connection ?? 0;
assert.ok(work > linkedin, `expected work overlaps to outnumber LinkedIn (${work} vs ${linkedin})`);
assert.equal(snapshot.stats.topCompanies[0]?.name, "Pinetrail");
assert.ok(snapshot.graph.people.some((person) => person.kind === "you" && person.name === "Alex Rowan"));
assert.ok(snapshot.graph.people.some((person) => person.kind === "bridge" && person.name === "Nora Voss"));

console.log("hidden-network checks passed");
  console.log(
    JSON.stringify(
      {
        profiles: snapshot.stats.profileCount,
        sources: snapshot.stats.sourceCounts,
        top: snapshot.stats.topCompanies,
        ties: tieTitles,
        clusters: clusters.map((item) => item.title),
        bridges: bridges.map((item) => item.title),
        path: paths.insights[0]?.title,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
