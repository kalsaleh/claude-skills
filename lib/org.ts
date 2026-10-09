/** Fold legal suffixes and punctuation so "Keel & Co" matches "Keel and Co". */
export function normaliseOrg(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.'’]/g, "")
    .replace(/\b(incorporated|inc|llc|ltd|limited|corp|corporation|plc|gmbh)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function orgsMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const left = normaliseOrg(a);
  const right = normaliseOrg(b);
  if (!left || !right) return false;
  return left === right;
}
