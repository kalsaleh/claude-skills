import { linkedInSlug, parseLinkedInList } from "@/lib/linkedin";
import { liveKeyConfigured } from "@/lib/providers";
import { ProviderError } from "@/lib/providers/types";
import { createSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

type Body = {
  mode?: unknown;
  company?: unknown;
  yourName?: unknown;
  yourLinkedin?: unknown;
  colleagueLinkedins?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const mode = body.mode === "live" ? "live" : body.mode === "demo" ? "demo" : null;
  if (!mode) return Response.json({ error: "Choose demo or live mode." }, { status: 400 });

  const company = typeof body.company === "string" ? body.company.trim() : "";
  const yourName = typeof body.yourName === "string" ? body.yourName.trim() : "";
  const yourLinkedin = typeof body.yourLinkedin === "string" ? body.yourLinkedin.trim() : "";
  const colleagueText = typeof body.colleagueLinkedins === "string" ? body.colleagueLinkedins : "";

  if (!company || company.length > 120) {
    return Response.json({ error: "Add your company name." }, { status: 400 });
  }
  if (!yourName || yourName.length > 80) {
    return Response.json({ error: "Add your name." }, { status: 400 });
  }
  const yourSlug = linkedInSlug(yourLinkedin);
  if (!yourSlug) {
    return Response.json({ error: "Add your LinkedIn profile URL." }, { status: 400 });
  }
  const colleagueSlugs = parseLinkedInList(colleagueText).filter((slug) => slug !== yourSlug);
  if (colleagueSlugs.length === 0) {
    return Response.json({ error: "Paste at least one colleague, one LinkedIn URL per line." }, { status: 400 });
  }
  if (colleagueSlugs.length > 40) {
    return Response.json({ error: "This prototype maps up to 40 colleagues at a time." }, { status: 400 });
  }
  if (mode === "live" && !liveKeyConfigured()) {
    return Response.json(
      { error: "SWARM_API_KEY is not set on the server. Switch to demo mode, or add the key to the environment." },
      { status: 400 },
    );
  }

  const lines = colleagueText
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  try {
    const session = await createSession({
      mode,
      company,
      yourName,
      yourSlug,
      colleagueSlugs,
      rawUsernames: [yourLinkedin, ...lines],
    });
    return Response.json(session);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "Could not start mapping.";
    const status = error instanceof ProviderError ? error.status : 502;
    return Response.json({ error: message }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
