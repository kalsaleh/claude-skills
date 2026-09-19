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
};
