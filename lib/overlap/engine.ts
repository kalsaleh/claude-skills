import { overlapWindow, parseISODate, toISODate } from "../dates";
import { normaliseOrg } from "../org";

/**
 * Pairwise overlap engine.
 *
 * Given people with job and education histories, find shared employers with
 * overlapping dates and shared schools with close graduation years. Work
 * overlaps are weighted by duration and by company size: a long stretch at a
 * 50-person firm outranks the same months inside a 10,000-person one.
 *
 * The mock provider uses this today. A bought-data provider (People Data Labs,
 * Coresignal) can feed raw career histories through the same function and adapt
 * the result into `RelationshipsResponse`.
 */

export type CareerJob = {
  company: string;
  companyWebsite?: string;
  title?: string;
  /** Inclusive start, YYYY-MM-DD. */
  start: string;
  /** Null or omitted means still there, measured against `now`. */
  end?: string | null;
  employeeCount?: number;
};

export type CareerEducation = {
  school: string;
  major?: string;
  graduationYear?: number;
};

export type CareerPerson = {
  id: string;
  name: string;
  jobs: CareerJob[];
  education?: CareerEducation[];
};

export type WorkOverlap = {
  kind: "work_overlap";
  personA: string;
  personB: string;
  sharedCompany: string;
  sharedCompanyWebsite?: string;
  overlapStart: string;
  overlapEnd: string;
  overlapDurationMonths: number;
  employeeCount?: number;
  /** Months × smaller-company factor. Higher means a tighter hidden tie. */
  weight: number;
};

export type EducationOverlap = {
  kind: "education_overlap";
  personA: string;
  personB: string;
  sharedSchool: string;
  sharedMajor?: string;
  graduationYear?: string;
  weight: number;
};

export type Overlap = WorkOverlap | EducationOverlap;

export type OverlapOptions = {
  /** Clock for open-ended jobs. YYYY-MM-DD. */
  now?: string;
  /** Graduation years at most this far apart still count. */
  graduationWindow?: number;
};

/**
 * Smaller firms weigh more. `1 / log10(headcount)`, with unknown size treated
 * as a mid-market 500 so missing data doesn't pretend to be a startup.
 */
export function companySizeFactor(employeeCount?: number): number {
  const size = employeeCount && employeeCount > 0 ? employeeCount : 500;
  return 1 / Math.log10(Math.max(size, 10));
}

export function computeOverlaps(people: CareerPerson[], options: OverlapOptions = {}): Overlap[] {
  const now = parseISODate(options.now ?? "2026-10-09") ?? new Date(Date.UTC(2026, 9, 9));
  const graduationWindow = options.graduationWindow ?? 1;
  const overlaps: Overlap[] = [];

  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      const left = people[i];
      const right = people[j];
      const [personA, personB] = left.id < right.id ? [left, right] : [right, left];
      overlaps.push(...workOverlaps(personA, personB, now));
      overlaps.push(...educationOverlaps(personA, personB, graduationWindow));
    }
  }

  return overlaps.sort((a, b) => b.weight - a.weight || a.personA.localeCompare(b.personA));
}

function workOverlaps(a: CareerPerson, b: CareerPerson, now: Date): WorkOverlap[] {
  const found: WorkOverlap[] = [];
  for (const jobA of a.jobs) {
    for (const jobB of b.jobs) {
      if (normaliseOrg(jobA.company) !== normaliseOrg(jobB.company)) continue;
      const startA = parseISODate(jobA.start);
      const startB = parseISODate(jobB.start);
      const endA = parseISODate(jobA.end) ?? now;
      const endB = parseISODate(jobB.end) ?? now;
      if (!startA || !startB) continue;
      const window = overlapWindow(startA, endA, startB, endB);
      if (!window) continue;
      const employeeCount = jobA.employeeCount ?? jobB.employeeCount;
      found.push({
        kind: "work_overlap",
        personA: a.id,
        personB: b.id,
        sharedCompany: jobA.company,
        sharedCompanyWebsite: jobA.companyWebsite ?? jobB.companyWebsite,
        overlapStart: toISODate(window.start),
        overlapEnd: toISODate(window.end),
        overlapDurationMonths: window.months,
        employeeCount,
        weight: roundWeight(window.months * companySizeFactor(employeeCount)),
      });
    }
  }
  return found;
}

function educationOverlaps(a: CareerPerson, b: CareerPerson, window: number): EducationOverlap[] {
  const found: EducationOverlap[] = [];
  for (const eduA of a.education ?? []) {
    for (const eduB of b.education ?? []) {
      if (normaliseOrg(eduA.school) !== normaliseOrg(eduB.school)) continue;
      if (eduA.graduationYear == null || eduB.graduationYear == null) continue;
      const gap = Math.abs(eduA.graduationYear - eduB.graduationYear);
      if (gap > window) continue;
      const sameMajor =
        eduA.major && eduB.major && normaliseOrg(eduA.major) === normaliseOrg(eduB.major);
      const years = [eduA.graduationYear, eduB.graduationYear].sort((x, y) => x - y);
      const graduationYear = years[0] === years[1] ? String(years[0]) : `${years[0]} and ${years[1]}`;
      const weight = 8 + (sameMajor ? 6 : 0) + (gap === 0 ? 4 : 0);
      found.push({
        kind: "education_overlap",
        personA: a.id,
        personB: b.id,
        sharedSchool: eduA.school,
        sharedMajor: sameMajor ? eduA.major : undefined,
        graduationYear,
        weight,
      });
    }
  }
  return found;
}

function roundWeight(value: number): number {
  return Math.round(value * 100) / 100;
}
