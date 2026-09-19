import { suggestRole, suggestTeam } from "./suggest";
import type { Person, Profile, Suggestion } from "./types";

export type AssistPerson = Pick<Person, "name" | "role" | "team" | "department">;

/**
 * v1 assistant: transparent heuristics, same contract a later Claude call should honour.
 * Do not call external LLM APIs here.
 */
export const enrichmentAssistant = {
  suggest(person: AssistPerson, profile: Pick<Profile, "role" | "team">): Suggestion {
    const teamGuess = suggestTeam(person.role);
    const roleGuess = suggestRole(person.role, teamGuess.team, `${profile.role} ${profile.team}`);
    const confidence = Math.round(Math.min(teamGuess.confidence, roleGuess.confidence) * 100) / 100;
    return {
      team: teamGuess.team,
      role: roleGuess.role,
      confidence,
      rationale: `${teamGuess.rationale}; ${roleGuess.rationale}`,
    };
  },
};
