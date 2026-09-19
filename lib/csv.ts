import type { ConnectionRow, Person, Profile, Workplace } from "./types";
import { peopleFromConnections, workplaceFromBuilder } from "./builder";
import { suggestTeam } from "./suggest";

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

export function parseConnectionsCsv(text: string): ConnectionRow[] {
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

  const rows: ConnectionRow[] = [];
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

/** Direct map skip — used only if a caller wants a finished graph without the enrich queue. */
export function workplaceFromConnections(rows: ConnectionRow[], profile: Profile): Workplace {
  const people: Person[] = peopleFromConnections(rows, profile).map((person) => {
    if (person.you) return person;
    const team = suggestTeam(person.role).team;
    return {
      ...person,
      department: team,
      team,
    };
  });
  return workplaceFromBuilder(people, profile, {
    includeWorkplace: true,
    includePersonal: true,
    skipped: true,
  });
}
