import type { Edge, Person, Workplace } from "./types";
import { annotateNetwork } from "./network";

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "");
}

function slug(value: string, index: number) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base ? `${base}-${index}` : `person-${index}`;
}

function guessDepartment(role: string, company: string): Person["department"] {
  const haystack = `${role} ${company}`.toLowerCase();
  if (/(chief|ceo|cfo|coo|cpo|cto|founder|vp |vice president)/.test(haystack)) {
    return "Leadership";
  }
  if (/(engineer|developer|sre|technical|architect)/.test(haystack)) return "Engineering";
  if (/(product design|designer|product manager|pm\b)/.test(haystack)) return "Product";
  if (/(success|csm|support|onboarding)/.test(haystack)) return "Customer Success";
  if (/(account executive|sales|ae\b|sdr|business development)/.test(haystack)) {
    return "Sales";
  }
  if (/(market|brand|content|communications)/.test(haystack)) return "Marketing";
  if (/(finance|accounta|fp&a|controller)/.test(haystack)) return "Finance";
  if (/(people|hr |recruiter|talent)/.test(haystack)) return "People";
  if (/(counsel|legal|solicitor)/.test(haystack)) return "Legal";
  return "Other";
}

export function parseConnectionsCsv(text: string) {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n");
  const headerIndex = lines.findIndex((line) =>
    /first name/i.test(line) && /last name/i.test(line),
  );
  if (headerIndex === -1) {
    throw new Error(
      "Could not find a LinkedIn-style header row (First Name, Last Name, …).",
    );
  }

  const header = splitCsvLine(lines[headerIndex]).map((cell) => cell.toLowerCase());
  const idx = (label: string) => header.findIndex((cell) => cell.includes(label));
  const first = idx("first name");
  const last = idx("last name");
  const company = idx("company");
  const position = idx("position");
  const email = idx("email");

  const rows: { name: string; company: string; role: string; email: string }[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);
    const name = [cells[first], cells[last]].filter(Boolean).join(" ").trim();
    if (!name) continue;
    rows.push({
      name,
      company: (cells[company] ?? "").trim() || "Unknown organisation",
      role: (cells[position] ?? "").trim() || "Connection",
      email: (cells[email] ?? "").trim(),
    });
  }

  if (!rows.length) {
    throw new Error("The file had a header but no connections.");
  }

  return rows.slice(0, 80);
}

export function workplaceFromConnections(
  rows: ReturnType<typeof parseConnectionsCsv>,
  profile: Workplace["profile"],
): Workplace {
  const people: Person[] = [
    {
      id: "you",
      name: profile.name,
      role: profile.role,
      team: profile.team,
      department: "Product",
      you: true,
      bio: "Imported from Connections.csv. Ties are inferred from shared organisations — a sketch, not a census.",
      groups: ["imported-you"],
    },
  ];

  const byCompany = new Map<string, string[]>();

  rows.forEach((row, index) => {
    const id = slug(row.name, index + 1);
    const person: Person = {
      id,
      name: row.name,
      role: row.role,
      team: row.company,
      department: guessDepartment(row.role, row.company),
      bio: row.email ? `Imported contact · ${row.email}` : `Imported from ${row.company}.`,
      groups: [`co-${slug(row.company, 0)}`],
    };
    people.push(person);
    const bucket = byCompany.get(row.company) ?? [];
    bucket.push(id);
    byCompany.set(row.company, bucket);
  });

  const edges: Edge[] = [];
  const remember = (source: string, target: string, strength: Edge["strength"], kind: Edge["kind"], label?: string) => {
    const [a, b] = source < target ? [source, target] : [target, source];
    const id = `${a}__${b}__${kind}`;
    if (edges.some((edge) => edge.id === id)) return;
    edges.push({ id, source, target, strength, kind, label });
  };

  const companies = [...byCompany.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [company, ids] of companies) {
    for (let i = 0; i < ids.length; i += 1) {
      const next = ids[(i + 1) % ids.length];
      if (ids.length > 1) remember(ids[i], next, 3, "collaborates", company);
      if (i + 2 < ids.length) remember(ids[i], ids[i + 2], 2, "collaborates", company);
    }
  }

  const weakTargets = companies.flatMap(([, ids]) => ids).slice(0, 8);
  weakTargets.forEach((id, index) => {
    remember("you", id, index < 3 ? 2 : 1, "weak", "imported tie");
  });

  if (companies[0]?.[1][0]) {
    remember("you", companies[0][1][0], 3, "collaborates", "largest shared organisation");
  }

  const workplace: Workplace = {
    version: 1,
    onboarded: true,
    source: "csv",
    workplaceName: "Imported connections",
    workplaceBlurb:
      "Built locally from a LinkedIn Connections.csv. Nobody was contacted. Clusters are shared organisations, not an official chart.",
    profile,
    people,
    edges,
    groups: companies.slice(0, 6).map(([company, memberIds], index) => ({
      id: `co-${index}`,
      name: company,
      blurb: "People who listed the same organisation on export.",
      memberIds,
    })),
  };

  return annotateNetwork(workplace);
}
