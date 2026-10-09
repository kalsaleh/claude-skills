import type { Verdict } from "./insights/types";

export const VERDICT_KEY = "groundwater.verdicts.v1";
export const SESSION_KEY = "groundwater.networkSession";

export function loadVerdicts(): Record<string, Verdict> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VERDICT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const verdicts: Record<string, Verdict> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (value === "confirmed" || value === "wrong" || value === "unsure") verdicts[id] = value;
    }
    return verdicts;
  } catch {
    return {};
  }
}

export function saveVerdicts(verdicts: Record<string, Verdict>) {
  window.localStorage.setItem(VERDICT_KEY, JSON.stringify(verdicts));
}

export function clearVerdicts() {
  window.localStorage.removeItem(VERDICT_KEY);
}

export function loadStoredSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function saveStoredSession(id: string) {
  window.sessionStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
