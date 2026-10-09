/** Parse a LinkedIn profile URL or a bare /in slug. Returns null when it isn't one. */
export function linkedInSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromPath = slugFromUrl(trimmed);
  if (fromPath) return fromPath;

  const bare = trimmed.replace(/^@/, "").replace(/\/+$/, "");
  if (/^[a-z0-9_%-]{2,100}$/i.test(bare)) {
    return decodeURIComponent(bare).toLowerCase();
  }
  return null;
}

function slugFromUrl(value: string): string | null {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.toLowerCase().includes("linkedin.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean).map((part) => part.toLowerCase());
    const inIndex = parts.indexOf("in");
    if (inIndex >= 0 && parts[inIndex + 1]) {
      return decodeURIComponent(parts[inIndex + 1]).toLowerCase();
    }
  } catch {
    return null;
  }
  return null;
}

export function linkedInUrl(slug: string): string {
  return `https://www.linkedin.com/in/${slug}`;
}

export function humaniseSlug(slug: string): string {
  return slug
    .split("-")
    .filter((part) => part && !/^\d+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Split a bulk paste (one URL per line, commas and list markers tolerated). */
export function parseLinkedInList(raw: string): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const line of raw.split(/[\n,]+/)) {
    const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
    const slug = linkedInSlug(cleaned);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}
