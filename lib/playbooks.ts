import type { Intent } from "./types";

export type PlaybookStep = {
  title: string;
  body: string;
  nodeIds: string[];
  note?: string;
};

export type Playbook = {
  slug: "cross-dept" | "promotion";
  intent: Intent;
  kicker: string;
  title: string;
  summary: string;
  stakes: string;
  steps: PlaybookStep[];
  draft: {
    to: string;
    subject: string;
    body: string;
  };
};

export const PLAYBOOKS: Playbook[] = [
  {
    slug: "cross-dept",
    intent: "cross-dept",
    kicker: "Playbook 01",
    title: "Walk a pricing experiment into Finance",
    summary:
      "You need ninety days to test usage-based SKUs on Platform. Dominic signs it. You do not have a standing meeting with him. Cold Slack is how this dies.",
    stakes:
      "Harbourline still sells seats. Three enterprise accounts have already asked Samir for usage. Legal will follow Finance; Frances does not need to hear from you first.",
    steps: [
      {
        title: "Do not start with the request",
        body: "Start with who can translate it. Fiona McLeod is a weak tie from the Brighton offsite — FP&A, not your stakeholder, which is precisely why she can walk it in. Tom Hale already has the customer pull in a doc.",
        nodeIds: ["you", "fiona", "tom"],
      },
      {
        title: "Warm the weak tie before you spend it",
        body: "Write Fiona as a person you already met, not as a ticketing system. Ask whether a ninety-day cap-and-watch experiment is even a shape Finance can digest. Offer a number, not a vision.",
        nodeIds: ["you", "fiona", "dominic"],
        note: "Weak ties decay if you only appear when you need a door opened.",
      },
      {
        title: "Arrive with CS evidence, not Product ambition",
        body: "Ask Tom for the three accounts and the quotes they would sign. Dominic reads renewal risk. He does not read roadmap themes. Harun can sanity-check the billing story so Leila is not ambushed.",
        nodeIds: ["tom", "samir", "harun", "leila"],
      },
      {
        title: "Let Fiona take it the last metre",
        body: "The last hop is Fiona → Dominic, not you → Dominic. Frances will follow if Finance is already with you. You still have no direct tie to Legal. That is a hole, not a homework assignment.",
        nodeIds: ["fiona", "dominic", "frances"],
      },
    ],
    draft: {
      to: "Fiona McLeod",
      subject: "Brighton coffee, and a ninety-day pricing question",
      body: `Fiona — we met at Brighton (I was the one asking awkward questions about contribution margin on platform usage). I'm looking at a tightly capped ninety-day experiment on usage-based SKUs, and I would rather not dump it on Dominic cold.

Tom Hale has three enterprise accounts that have already asked for this shape. I can send the numbers and the billing constraint in six lines. Is this even a shape FP&A can digest, or am I about to waste the building's time?

— Alex`,
    },
  },
  {
    slug: "promotion",
    intent: "promotion",
    kicker: "Playbook 02",
    title: "Find a sponsor for the pay-review room",
    summary:
      "Louise will write a strong packet. She is not in the room. Calibration is Nadia, Callum, Sian, and — if it is contested — Eleanor. Sponsors speak when you are not there.",
    stakes:
      "Senior to principal at Harbourline is not a bigger backlog. It is whether Nadia can say your name as the person who made Platform less of a promise Sales regrets.",
    steps: [
      {
        title: "Separate mentor from sponsor",
        body: "Louise is your manager and a mentor. Bridget will tell you if the packet is thin. Neither of them votes. Nadia is the sponsor you actually need. Callum is a hole: you have no tie to him, and platform risk is his language.",
        nodeIds: ["you", "louise", "bridget", "nadia", "callum"],
      },
      {
        title: "Borrow a voice Engineering already trusts",
        body: "Priya Shah will be asked, informally, whether you made the work better. That conversation will not be minuted. If she cannot say something specific, Nadia will hear the silence. Dex can corroborate the daily craft; Priya carries it across the corridor.",
        nodeIds: ["you", "priya", "dex", "nadia"],
      },
      {
        title: "Book the coffee with Jordan before you need it",
        body: "Jordan Adeyemi is the broker into how Eleanor hears 'scope' versus 'headcount'. You have a weak, unused tie. A skip-level with Nadia that Jordan has already primed lands differently from a skip-level you scheduled in a panic in November.",
        nodeIds: ["you", "jordan", "nadia", "eleanor"],
        note: "A sponsor is recruited in ordinary time, not in the week of calibration.",
      },
      {
        title: "Give Nadia a sentence she can say without you",
        body: "Not 'Alex is ready for principal'. A sentence: 'Alex is why we can sell usage without Engineering finding out on a Friday.' If Sian can add a customer name, even better. You will not be in the room to decorate it.",
        nodeIds: ["nadia", "sian", "callum", "eleanor"],
      },
    ],
    draft: {
      to: "Priya Shah",
      subject: "A specific ask, not a vague one",
      body: `Priya — I'm putting a principal packet together and I do not want to make you the surprise witness.

If Nadia or Callum asks whether the platform usage work actually changed how we ship, I would rather they already had a sentence from you that is true. If it isn't true yet, tell me what would make it true in the next two quarters.

Coffee this week? I'll come to the engineering floor.

— Alex`,
    },
  },
];

export function playbookBySlug(slug: string) {
  return PLAYBOOKS.find((playbook) => playbook.slug === slug) ?? null;
}
