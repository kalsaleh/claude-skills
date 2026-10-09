export type InsightKind = "colleague_tie" | "shared_past" | "bridge" | "path";

export type Verdict = "confirmed" | "wrong" | "unsure";

export type Evidence = {
  origin: string;
  text: string;
};

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  /** 0–1. Higher means the user is less likely to already know this. */
  surprise: number;
  /** 0–1. Higher means a longer, tighter, or repeated tie. */
  strength: number;
  evidence: Evidence[];
  personIds: string[];
  edgeIds: string[];
};

export type GraphKind = "you" | "colleague" | "bridge" | "contact";

export type GraphPerson = {
  id: string;
  name: string;
  role: string;
  company: string;
  kind: GraphKind;
  insightIds: string[];
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  strength: 1 | 2 | 3 | 4 | 5;
  hidden: boolean;
  label: string;
  insightIds: string[];
};

export type NetworkGraph = {
  people: GraphPerson[];
  edges: GraphEdge[];
};

export type NetworkStats = {
  totalCount: number;
  profileCount: number;
  connectorCount: number;
  sourceCounts: Record<string, number>;
  topCompanies: { name: string; count: number }[];
};

export type NetworkSnapshot = {
  mode: "demo" | "live";
  company: string;
  youName: string;
  stats: NetworkStats;
  insights: Insight[];
  graph: NetworkGraph;
};

export type PathResult = {
  query: string;
  insights: Insight[];
  people: GraphPerson[];
  edges: GraphEdge[];
  note?: string;
};
