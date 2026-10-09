import { computeOverlaps, type CareerEducation, type CareerJob, type CareerPerson } from "../overlap/engine";
import { orgsMatch } from "../org";
import type { ConnectionSource, RelationshipItem } from "../providers/types";
import { DEMO_COMPANY, DEMO_NOW, DEMO_ROSTER } from "./roster";

/**
 * Synthetic Swarm-shaped network for Harbourline.
 * Names and companies are invented. None of the calibration account's real
 * people or employers are used here.
 */

type Cast = CareerPerson & {
  title: string;
  company: string;
  website: string;
  connector: boolean;
};

type ExtraTie = {
  from: string;
  to: string;
  origin: string;
  strength: number;
};

const CONNECTORS = new Set(DEMO_ROSTER.map((person) => person.slug));

function job(
  company: string,
  website: string,
  title: string,
  start: string,
  end: string | null,
  employeeCount: number,
): CareerJob {
  return { company, companyWebsite: website, title, start, end, employeeCount };
}

function edu(school: string, major: string, graduationYear: number): CareerEducation {
  return { school, major, graduationYear };
}

const CAST: Cast[] = [
  {
    id: "alex-rowan-harbourline",
    name: "Alex Rowan",
    title: "Senior Product Manager",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Senior Product Manager", "2021-03-01", null, 140),
      job("Marrow Analytics", "marrowanalytics.example", "Product Manager", "2017-06-01", "2021-02-01", 2200),
      job("Sable Freight", "sablefreight.example", "Business Analyst", "2014-09-01", "2017-05-01", 5000),
    ],
    education: [edu("Alder Polytechnic", "Computer Science", 2014)],
  },
  {
    id: "priya-nandakumar",
    name: "Priya Nandakumar",
    title: "Staff Engineer",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Staff Engineer", "2020-04-01", null, 140),
      job("Bracken Health", "brackenhealth.example", "Software Engineer", "2015-02-01", "2020-03-01", 70),
      job("Northglass", "northglass.example", "Software Engineer", "2012-07-01", "2015-01-01", 300),
    ],
    education: [edu("Alder Polytechnic", "Computer Science", 2012)],
  },
  {
    id: "mateo-alvarez",
    name: "Mateo Alvarez",
    title: "Account Executive",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Account Executive", "2022-01-01", null, 140),
      job("Lumenfield", "lumenfield.example", "Account Executive", "2016-03-01", "2021-11-01", 900),
      job("Pinetrail", "pinetrail.example", "Sales Development Representative", "2013-06-01", "2016-02-01", 8000),
    ],
    education: [edu("Redcedar College", "Business", 2013)],
  },
  {
    id: "helen-cho",
    name: "Helen Cho",
    title: "Design Lead",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Design Lead", "2019-08-01", null, 140),
      job("Keel & Co", "keelandco.example", "Product Designer", "2014-05-01", "2019-07-01", 45),
    ],
    education: [edu("Isthmus School of Art", "Graphic Design", 2014)],
  },
  {
    id: "samir-elsayed",
    name: "Samir El-Sayed",
    title: "Customer Success Lead",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Customer Success Lead", "2023-02-01", null, 140),
      job("Lumenfield", "lumenfield.example", "Customer Success Manager", "2017-04-01", "2022-12-01", 900),
      job("Sable Freight", "sablefreight.example", "Support Specialist", "2014-10-01", "2017-03-01", 5000),
    ],
    education: [edu("Redcedar College", "Business", 2014)],
  },
  {
    id: "ines-berger",
    name: "Ines Berger",
    title: "Finance Partner",
    company: "Harbourline",
    website: "harbourline.example",
    connector: true,
    jobs: [
      job("Harbourline", "harbourline.example", "Finance Partner", "2021-09-01", null, 140),
      job("Keel & Co", "keelandco.example", "Consultant", "2016-01-01", "2021-08-01", 45),
      job("Marrow Analytics", "marrowanalytics.example", "Analyst", "2013-08-01", "2015-12-01", 2200),
    ],
    education: [edu("Alder Polytechnic", "Economics", 2013)],
  },
  {
    id: "nora-voss",
    name: "Nora Voss",
    title: "Director of Engineering",
    company: "Pinetrail",
    website: "pinetrail.example",
    connector: false,
    jobs: [
      job("Pinetrail", "pinetrail.example", "Director of Engineering", "2020-04-01", null, 8000),
      job("Bracken Health", "brackenhealth.example", "Software Engineer", "2016-01-01", "2020-02-01", 70),
    ],
  },
  {
    id: "owen-blake",
    name: "Owen Blake",
    title: "Account Director",
    company: "Pinetrail",
    website: "pinetrail.example",
    connector: false,
    jobs: [job("Pinetrail", "pinetrail.example", "Account Director", "2019-01-01", null, 8000)],
  },
  {
    id: "chloe-adeyemi",
    name: "Chloe Adeyemi",
    title: "Product Manager",
    company: "Pinetrail",
    website: "pinetrail.example",
    connector: false,
    jobs: [job("Pinetrail", "pinetrail.example", "Product Manager", "2014-01-01", null, 8000)],
  },
  {
    id: "ruth-okonkwo",
    name: "Ruth Okonkwo",
    title: "Head of Customer Success",
    company: "Fieldnote",
    website: "fieldnote.example",
    connector: false,
    jobs: [
      job("Fieldnote", "fieldnote.example", "Head of Customer Success", "2021-08-01", null, 260),
      job("Lumenfield", "lumenfield.example", "Customer Success Manager", "2018-01-01", "2021-06-01", 900),
    ],
  },
  {
    id: "benito-salazar",
    name: "Benito Salazar",
    title: "Engineering Manager",
    company: "Northglass",
    website: "northglass.example",
    connector: false,
    jobs: [
      job("Northglass", "northglass.example", "Engineering Manager", "2019-09-01", null, 300),
      job("Lumenfield", "lumenfield.example", "Software Engineer", "2016-06-01", "2019-08-01", 900),
    ],
  },
  {
    id: "carla-nguyen",
    name: "Carla Nguyen",
    title: "Group Product Manager",
    company: "Marrow Analytics",
    website: "marrowanalytics.example",
    connector: false,
    jobs: [
      job("Marrow Analytics", "marrowanalytics.example", "Group Product Manager", "2018-07-01", null, 2200),
      job("Lumenfield", "lumenfield.example", "Product Manager", "2015-01-01", "2018-06-01", 900),
    ],
  },
  {
    id: "tomislav-horvat",
    name: "Tomislav Horvat",
    title: "Partner",
    company: "Lowtide Advisory",
    website: "lowtide.example",
    connector: false,
    jobs: [
      job("Lowtide Advisory", "lowtide.example", "Partner", "2020-05-01", null, 30),
      job("Keel & Co", "keelandco.example", "Strategist", "2017-02-01", "2020-04-01", 45),
    ],
  },
  {
    id: "amira-haddad",
    name: "Amira Haddad",
    title: "Design Director",
    company: "Isthmus Studio",
    website: "isthmusstudio.example",
    connector: false,
    jobs: [
      job("Isthmus Studio", "isthmusstudio.example", "Design Director", "2018-10-01", null, 24),
      job("Keel & Co", "keelandco.example", "Product Designer", "2015-03-01", "2018-09-01", 45),
    ],
  },
  {
    id: "felix-drummond",
    name: "Felix Drummond",
    title: "Senior Engineer",
    company: "Northglass",
    website: "northglass.example",
    connector: false,
    jobs: [
      job("Northglass", "northglass.example", "Senior Engineer", "2020-01-01", null, 300),
      job("Bracken Health", "brackenhealth.example", "Software Engineer", "2017-05-01", "2019-11-01", 70),
    ],
  },
  {
    id: "yara-mensah",
    name: "Yara Mensah",
    title: "Product Manager",
    company: "Marrow Analytics",
    website: "marrowanalytics.example",
    connector: false,
    jobs: [
      job("Marrow Analytics", "marrowanalytics.example", "Product Manager", "2020-04-01", null, 2200),
      job("Bracken Health", "brackenhealth.example", "Associate Product Manager", "2018-03-01", "2020-03-01", 70),
    ],
  },
  {
    id: "leah-ostrov",
    name: "Leah Ostrov",
    title: "Staff Engineer",
    company: "Fieldnote",
    website: "fieldnote.example",
    connector: false,
    jobs: [
      job("Fieldnote", "fieldnote.example", "Staff Engineer", "2016-09-01", null, 260),
      job("Northglass", "northglass.example", "Software Engineer", "2013-01-01", "2016-08-01", 300),
    ],
  },
  {
    id: "hassan-diop",
    name: "Hassan Diop",
    title: "Director of Operations",
    company: "Sable Freight",
    website: "sablefreight.example",
    connector: false,
    jobs: [
      job("Sable Freight", "sablefreight.example", "Director of Operations", "2015-01-01", null, 5000),
    ],
  },
  {
    id: "jonah-pell",
    name: "Jonah Pell",
    title: "Product Lead",
    company: "Fieldnote",
    website: "fieldnote.example",
    connector: false,
    jobs: [
      job("Fieldnote", "fieldnote.example", "Product Lead", "2021-02-01", null, 260),
      job("Marrow Analytics", "marrowanalytics.example", "Product Manager", "2018-02-01", "2021-01-01", 2200),
    ],
  },
];

const EXTRAS: ExtraTie[] = [
  // The user already has these LinkedIn ties. They should not lead the ranking.
  ...["priya-nandakumar", "mateo-alvarez", "helen-cho", "samir-elsayed", "ines-berger"].map(
    (slug) => ({ from: "alex-rowan-harbourline", to: slug, origin: "linkedin_connection", strength: 3 }),
  ),
  // Hidden colleague tie: public interaction, no LinkedIn connection.
  { from: "priya-nandakumar", to: "helen-cho", origin: "social_engagement", strength: 2 },
  // Nora bridges Priya (work, from the engine) and Helen (social only).
  { from: "helen-cho", to: "nora-voss", origin: "social_engagement", strength: 2 },
  // Leah is on Alex's LinkedIn and also engages with Samir.
  { from: "alex-rowan-harbourline", to: "leah-ostrov", origin: "linkedin_connection", strength: 2 },
  { from: "samir-elsayed", to: "leah-ostrov", origin: "social_engagement", strength: 2 },
  // Jonah overlaps Alex at Marrow (engine) and engages with Ines.
  { from: "ines-berger", to: "jonah-pell", origin: "social_engagement", strength: 2 },
  // Obvious, thin LinkedIn door into Pinetrail. Ranked under Nora's overlap.
  { from: "alex-rowan-harbourline", to: "owen-blake", origin: "linkedin_connection", strength: 1 },
];

const FILLER_FIRST = [
  "Adaeze", "Nils", "Sofia", "Harun", "Leila", "Otto", "Mina", "Rafael", "Anouk", "Idris",
  "Greta", "Pavel", "Noor", "Soren", "Aya", "Hugo", "Chioma", "Elena", "Tariq", "Freya",
  "Kenji", "Lale", "Mateus", "Ingrid", "Yusuf", "Clara", "Darius", "Hana", "Ivan", "Bea",
  "Kostas", "Amina", "Leo", "Nadia", "Omar", "Petra", "Quinlan", "Rina", "Sami", "Thea",
  "Willa", "Xavier", "Yasmin", "Zola", "Bram", "Celine", "Dario", "Esme", "Farid", "Gita",
  "Henrik", "Imani", "Jae", "Kira", "Lukas", "Mara", "Nico", "Orla",
];

const FILLER_LAST = [
  "Moreau", "Ibarra", "Vogel", "Rahman", "Okeke", "Petrov", "Santos", "Berg", "Diallo", "Novak",
  "Ferreira", "Amini", "Keller", "Osei", "Lind", "Costa", "Abebe", "Marin", "Weiss", "Sato",
  "Duran", "Kowalska", "Bello", "Ng", "Frost", "Almeida", "Shah", "Rossi", "Kaur", "Silva",
  "Nasser", "Boyd", "Iversen", "Park", "Adler", "Quintero", "Holm", "Bass", "Ekwo", "Falk",
  "Gorecki", "Ito", "Jensen", "Khatri", "Larsen", "Mendez", "Ndlovu", "Okafor", "Paredes", "Reyes",
  "Sato", "Toure", "Ueda", "Varga", "Wong", "Yilmaz", "Zimmerman", "Abe",
];

const FILLER_BANDS: { name: string; website: string; count: number; origin: "work_overlap" | "linkedin_connection" }[] = [
  { name: "Pinetrail", website: "pinetrail.example", count: 15, origin: "work_overlap" },
  { name: "Fieldnote", website: "fieldnote.example", count: 8, origin: "work_overlap" },
  { name: "Marrow Analytics", website: "marrowanalytics.example", count: 8, origin: "work_overlap" },
  { name: "Northglass", website: "northglass.example", count: 6, origin: "work_overlap" },
  { name: "Lowtide Advisory", website: "lowtide.example", count: 6, origin: "work_overlap" },
  { name: "Lumenfield", website: "lumenfield.example", count: 4, origin: "linkedin_connection" },
  { name: "Sable Freight", website: "sablefreight.example", count: 4, origin: "linkedin_connection" },
  { name: "Bracken Health", website: "brackenhealth.example", count: 3, origin: "linkedin_connection" },
  { name: "Isthmus Studio", website: "isthmusstudio.example", count: 4, origin: "linkedin_connection" },
];

type Draft = {
  strength: number;
  sources: ConnectionSource[];
};

export function buildDemoItems(): RelationshipItem[] {
  const bySlug = new Map(CAST.map((person) => [person.id, person]));
  const drafts = new Map<string, Map<string, Draft>>();

  const overlaps = computeOverlaps(CAST, { now: DEMO_NOW });
  for (const overlap of overlaps) {
    if (overlap.kind === "work_overlap" && orgsMatch(overlap.sharedCompany, DEMO_COMPANY)) continue;
    const strength = strengthFromWeight(overlap.weight);
    const source = overlapToSource(overlap);
    if (CONNECTORS.has(overlap.personA)) addDraft(drafts, overlap.personB, overlap.personA, source, strength);
    if (CONNECTORS.has(overlap.personB)) addDraft(drafts, overlap.personA, overlap.personB, source, strength);
  }

  for (const extra of EXTRAS) {
    addDraft(drafts, extra.to, extra.from, { origin: extra.origin }, extra.strength);
    if (CONNECTORS.has(extra.to)) {
      addDraft(drafts, extra.from, extra.to, { origin: extra.origin }, extra.strength);
    }
  }

  const items: RelationshipItem[] = CAST.map((person) => toItem(person, drafts.get(person.id), bySlug));
  items.push(...fillerItems());
  return items;
}

function fillerItems(): RelationshipItem[] {
  const items: RelationshipItem[] = [];
  let index = 0;
  for (const band of FILLER_BANDS) {
    for (let n = 0; n < band.count; n += 1) {
      const first = FILLER_FIRST[index % FILLER_FIRST.length];
      const last = FILLER_LAST[index % FILLER_LAST.length];
      const slug = `demo-${first}-${last}-${index}`.toLowerCase();
      const name = `${first} ${last}`;
      const work = band.origin === "work_overlap";
      // One colleague only, so fillers thicken the source mix without inventing a second alumni bloc.
      const connector = work ? "mateo-alvarez" : "priya-nandakumar";
      const connectorPerson = CAST.find((person) => person.id === connector)!;
      const source: ConnectionSource = work
        ? {
            origin: "work_overlap",
            shared_company: "Pinetrail",
            shared_company_website: "pinetrail.example",
            overlap_start_date: "2014-06-01",
            overlap_end_date: "2015-02-01",
            overlap_duration_months: 8,
          }
        : { origin: "linkedin_connection" };
      items.push({
        profile: {
          id: fakeUuid(`profile:${slug}`),
          full_name: name,
          current_title: work ? "Account Manager" : "Software Engineer",
          linkedin_url: `https://www.linkedin.com/in/${slug}`,
          current_company_name: band.name,
          current_company_website: band.website,
        },
        connections: [
          {
            connector_id: fakeUuid(`connector:${connector}`),
            connector_name: connectorPerson.name,
            connector_linkedin_url: `https://www.linkedin.com/in/${connector}`,
            connector_current_title: connectorPerson.title,
            connector_current_company_name: connectorPerson.company,
            connection_strength_normalized: 1,
            connection_strength: 0.14,
            sources: [source],
          },
        ],
      });
      index += 1;
    }
  }
  return items;
}

function toItem(person: Cast, connections: Map<string, Draft> | undefined, bySlug: Map<string, Cast>): RelationshipItem {
  return {
    profile: {
      id: fakeUuid(`profile:${person.id}`),
      full_name: person.name,
      current_title: person.title,
      linkedin_url: `https://www.linkedin.com/in/${person.id}`,
      current_company_name: person.company,
      current_company_website: person.website,
    },
    connections: [...(connections?.entries() ?? [])].map(([connectorSlug, draft]) => {
      const connector = bySlug.get(connectorSlug);
      return {
        connector_id: fakeUuid(`connector:${connectorSlug}`),
        connector_name: connector?.name ?? connectorSlug,
        connector_linkedin_url: `https://www.linkedin.com/in/${connectorSlug}`,
        connector_current_title: connector?.title,
        connector_current_company_name: connector?.company,
        connection_strength_normalized: draft.strength,
        connection_strength: draft.strength === 3 ? 0.74 : draft.strength === 2 ? 0.42 : 0.18,
        sources: draft.sources,
      };
    }),
  };
}

function addDraft(
  drafts: Map<string, Map<string, Draft>>,
  profileSlug: string,
  connectorSlug: string,
  source: ConnectionSource,
  strength: number,
) {
  if (profileSlug === connectorSlug) return;
  if (!CONNECTORS.has(connectorSlug)) return;
  let row = drafts.get(profileSlug);
  if (!row) {
    row = new Map();
    drafts.set(profileSlug, row);
  }
  const existing = row.get(connectorSlug);
  if (!existing) {
    row.set(connectorSlug, { strength, sources: [source] });
    return;
  }
  existing.strength = Math.max(existing.strength, strength);
  const key = sourceKey(source);
  if (!existing.sources.some((item) => sourceKey(item) === key)) existing.sources.push(source);
}

function overlapToSource(overlap: ReturnType<typeof computeOverlaps>[number]): ConnectionSource {
  if (overlap.kind === "work_overlap") {
    return {
      origin: "work_overlap",
      shared_company: overlap.sharedCompany,
      shared_company_website: overlap.sharedCompanyWebsite,
      overlap_start_date: overlap.overlapStart,
      overlap_end_date: overlap.overlapEnd,
      overlap_duration_months: overlap.overlapDurationMonths,
    };
  }
  return {
    origin: "education_overlap",
    shared_school: overlap.sharedSchool,
    shared_major: overlap.sharedMajor,
    graduation_year: overlap.graduationYear,
  };
}

function strengthFromWeight(weight: number): number {
  if (weight >= 18) return 3;
  if (weight >= 8) return 2;
  return 1;
}

function sourceKey(source: ConnectionSource): string {
  return [
    source.origin,
    source.shared_company,
    source.shared_school,
    source.overlap_start_date,
    source.graduation_year,
  ].join("|");
}

function fakeUuid(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (value: number) => (value >>> 0).toString(16).padStart(8, "0");
  const a = hex(hash);
  const b = hex(Math.imul(hash, 31));
  const c = hex(Math.imul(hash, 17));
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${c.slice(0, 3)}-${c}${a.slice(0, 4)}`;
}
