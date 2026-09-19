import type { BuilderState, Workplace } from "./types";

export const STORAGE_KEY = "groundwater.workplace.v1";
export const BUILDER_KEY = "groundwater.builder.v1";

export function loadWorkplace(): Workplace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Workplace;
    if (parsed?.version !== 1 || !Array.isArray(parsed.people)) return null;
    if (parsed.profile && !parsed.profile.company) parsed.profile.company = "";
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkplace(workplace: Workplace) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workplace));
}

export function clearWorkplace() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function loadBuilder(): BuilderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BUILDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuilderState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.people)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBuilder(builder: BuilderState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUILDER_KEY, JSON.stringify(builder));
}

export function clearBuilder() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BUILDER_KEY);
}
