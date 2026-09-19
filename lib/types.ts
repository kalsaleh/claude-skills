export type Department =
  | "Product"
  | "Engineering"
  | "Sales"
  | "Customer Success"
  | "Marketing"
  | "Finance"
  | "People"
  | "Legal"
  | "Leadership"
  | "Other";

export type EdgeKind = "reports" | "collaborates" | "weak" | "skip";

export type Intent = "cross-dept" | "promotion" | "see-the-room";

export type WorkplaceSource = "demo" | "csv";

export type PersonTag = "broker" | "weak-tie" | "fold" | "sponsor" | "manager";

export type PersonLayer = "workplace" | "personal";

export type MatterRole =
  | "sponsor"
  | "broker"
  | "decision_maker"
  | "peer"
  | "mentor"
  | "blocker"
  | "skip";

export type TieStrength = "weak" | "working" | "strong";

export type ConnectionRow = {
  name: string;
  company: string;
  role: string;
  email: string;
};

export type Suggestion = {
  team: Department;
  role: MatterRole;
  confidence: number;
  rationale: string;
};

export type Enrichment = {
  team: Department;
  matter: MatterRole;
  tie: TieStrength;
  suggestion?: Suggestion;
  acceptedSuggestion?: boolean;
};

export type Person = {
  id: string;
  name: string;
  role: string;
  team: string;
  department: Department;
  location?: string;
  you?: boolean;
  tags?: PersonTag[];
  bio?: string;
  groups?: string[];
  company?: string;
  layer?: PersonLayer;
  enrichment?: Enrichment;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
  strength: 1 | 2 | 3 | 4 | 5;
  kind: EdgeKind;
  label?: string;
};

export type Group = {
  id: string;
  name: string;
  blurb: string;
  memberIds: string[];
};

export type Profile = {
  name: string;
  role: string;
  team: string;
  company: string;
  intent: Intent;
};

export type Insight = {
  id: string;
  kind: "broker" | "weak-tie" | "hole" | "fold" | "sponsor";
  title: string;
  body: string;
  personIds: string[];
};

export type Highlight = {
  nodeIds: string[];
  edgeIds: string[];
  label?: string;
};

export type BuilderStage = "import" | "filter" | "enrich" | "done";

export type BuilderState = {
  version: 1;
  profile: Profile;
  rows: ConnectionRow[];
  people: Person[];
  includeWorkplace: boolean;
  includePersonal: boolean;
  queueIds: string[];
  queueIndex: number;
  enrichmentSkipped: boolean;
  stage: BuilderStage;
};

export type Workplace = {
  version: 1;
  onboarded: boolean;
  source: WorkplaceSource;
  workplaceName: string;
  workplaceBlurb: string;
  profile: Profile;
  people: Person[];
  edges: Edge[];
  groups: Group[];
  company?: string;
  includePersonal?: boolean;
  includeWorkplace?: boolean;
  enrichmentSkipped?: boolean;
};

export const MATTER_LABELS: Record<MatterRole, string> = {
  sponsor: "Sponsor",
  broker: "Broker",
  decision_maker: "Decision maker",
  peer: "Peer",
  mentor: "Mentor",
  blocker: "Blocker",
  skip: "Not sure yet",
};

export const TIE_LABELS: Record<TieStrength, string> = {
  weak: "Weak",
  working: "Working",
  strong: "Strong",
};

export const DEFAULT_PROFILE: Profile = {
  name: "Alex Rowan",
  role: "Senior Product Manager",
  team: "Platform",
  company: "Harbourline",
  intent: "see-the-room",
};
