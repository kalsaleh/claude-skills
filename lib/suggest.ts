/**
 * Heuristic assistant v1 — transparent, deterministic, no network.
 * Swap later: keep `enrichmentAssistant.suggest(person) -> { team, role, confidence, rationale }`
 * and replace the body with a Claude call that returns the same shape.
 */
import type { Department, MatterRole, Person, Profile } from "./types";

export type TeamSuggestion = {
  team: Department;
  confidence: number;
  rationale: string;
};

export type RoleSuggestion = {
  role: MatterRole;
  confidence: number;
  rationale: string;
};

export type QueueRank = {
  seniority: number;
  otherTeam: boolean;
  peer: boolean;
  score: number;
  rationale: string;
};

function hay(value: string) {
  return value.toLowerCase();
}

const TEAM_RULES: { team: Department; pattern: RegExp; rationale: string }[] = [
  {
    team: "Leadership",
    pattern: /\b(chief|ceo|cfo|coo|cpo|cto|founder|president|vice president|\bvp\b|chief of staff)\b/,
    rationale: "senior leadership title",
  },
  {
    team: "Engineering",
    pattern: /\b(engineer|developer|sre|architect|technical|data scientist|engineering)\b/,
    rationale: "engineering title keywords",
  },
  {
    team: "Product",
    pattern: /\b(product manager|\bpm\b|product design|designer|product ops|product marketing)\b/,
    rationale: "product title keywords",
  },
  {
    team: "Customer Success",
    pattern: /\b(success|csm|support|onboarding|customer)\b/,
    rationale: "customer/success title keywords",
  },
  {
    team: "Sales",
    pattern: /\b(account executive|\bae\b|sdr|sales engineer|business development|account manager)\b/,
    rationale: "sales title keywords",
  },
  {
    team: "Marketing",
    pattern: /\b(market|brand|content|communications|demand|pmm)\b/,
    rationale: "marketing title keywords",
  },
  {
    team: "Finance",
    pattern: /\b(finance|fp&a|controller|billing|accounta|treasur)\b/,
    rationale: "finance title keywords",
  },
  {
    team: "People",
    pattern: /\b(people|human resources|\bhr\b|recruiter|talent|people partner)\b/,
    rationale: "people/HR title keywords",
  },
  {
    team: "Legal",
    pattern: /\b(counsel|legal|solicitor|compliance|attorney)\b/,
    rationale: "legal title keywords",
  },
];

const SENIORITY_RULES: { pattern: RegExp; score: number; label: string }[] = [
  { pattern: /\b(chief|ceo|cfo|coo|cpo|cto|founder|president)\b/, score: 100, label: "C-level" },
  { pattern: /\b(vice president|\bvp\b|chief of staff)\b/, score: 90, label: "VP" },
  { pattern: /\b(director|head of)\b/, score: 80, label: "director" },
  { pattern: /\bprincipal\b/, score: 70, label: "principal" },
  { pattern: /\bstaff\b/, score: 65, label: "staff" },
  { pattern: /\bpartner\b/, score: 58, label: "partner" },
  { pattern: /\blead\b/, score: 55, label: "lead" },
  { pattern: /\bmanager\b/, score: 50, label: "manager" },
  { pattern: /\bsenior\b/, score: 40, label: "senior" },
];

export function seniorityScore(title: string) {
  const text = hay(title);
  for (const rule of SENIORITY_RULES) {
    if (rule.pattern.test(text)) return { score: rule.score, label: rule.label };
  }
  return { score: 20, label: "individual contributor" };
}

export function suggestTeam(title: string): TeamSuggestion {
  const text = hay(title);
  for (const rule of TEAM_RULES) {
    if (rule.pattern.test(text)) {
      return { team: rule.team, confidence: 0.78, rationale: rule.rationale };
    }
  }
  return {
    team: "Other",
    confidence: 0.35,
    rationale: "no team keyword in title",
  };
}

export function suggestRole(
  title: string,
  team: Department,
  userTeam: string,
): RoleSuggestion {
  const text = hay(title);
  const userDept = suggestTeam(userTeam).team;
  const selfDept = team;
  const otherTeam = selfDept !== "Other" && userDept !== "Other" && selfDept !== userDept;
  const senior = seniorityScore(title).score;

  if (/\b(mentor|coach|people partner)\b/.test(text)) {
    return { role: "mentor", confidence: 0.7, rationale: "coaching/people title" };
  }
  if (/\b(gate|blocker|compliance)\b/.test(text) && selfDept === "Legal") {
    return { role: "blocker", confidence: 0.55, rationale: "legal/compliance as a gate" };
  }
  if (senior >= 80) {
    if (selfDept === "Product" || selfDept === "Leadership") {
      return {
        role: "sponsor",
        confidence: 0.74,
        rationale: "senior title in a room that can speak for you",
      };
    }
    return {
      role: "decision_maker",
      confidence: 0.76,
      rationale: "director/VP/C-level title",
    };
  }
  if (otherTeam && senior >= 50) {
    return {
      role: "broker",
      confidence: 0.68,
      rationale: "other-team + seniority — likely carries a corridor",
    };
  }
  if (otherTeam) {
    return {
      role: "broker",
      confidence: 0.52,
      rationale: "other-team keyword versus your team",
    };
  }
  if (senior >= 40 && senior <= 70) {
    return { role: "peer", confidence: 0.66, rationale: "peer/cohort seniority" };
  }
  return { role: "peer", confidence: 0.45, rationale: "default cohort read from title" };
}

export function suggestQueueRank(
  person: Pick<Person, "role" | "department" | "team">,
  profile: Pick<Profile, "role" | "team">,
): QueueRank {
  const senior = seniorityScore(person.role);
  const theirTeam = person.department || suggestTeam(person.role).team;
  const yourTeam = suggestTeam(`${profile.role} ${profile.team}`).team;
  const otherTeam = theirTeam !== "Other" && theirTeam !== yourTeam;
  const yourSenior = seniorityScore(profile.role).score;
  const peer =
    !otherTeam && Math.abs(senior.score - yourSenior) <= 20 && senior.score < 80;

  const score = senior.score * 3 + (otherTeam ? 40 : 0) + (peer ? 15 : 0);
  const bits = [senior.label];
  if (otherTeam) bits.push("other-team");
  if (peer) bits.push("peer/cohort");

  return {
    seniority: senior.score,
    otherTeam,
    peer,
    score,
    rationale: bits.join(" · "),
  };
}

export function rankEnrichmentQueue(people: Person[], profile: Profile, cap = 12) {
  const workplace = people.filter((person) => !person.you && person.layer === "workplace");
  return [...workplace]
    .sort((a, b) => {
      const ra = suggestQueueRank(a, profile);
      const rb = suggestQueueRank(b, profile);
      return (
        rb.seniority - ra.seniority ||
        Number(rb.otherTeam) - Number(ra.otherTeam) ||
        Number(rb.peer) - Number(ra.peer) ||
        rb.score - ra.score
      );
    })
    .slice(0, cap);
}
