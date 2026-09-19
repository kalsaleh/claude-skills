"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyEnrichment,
  peopleFromConnections,
  workplaceFromBuilder,
} from "./builder";
import { buildHarbourlineWorkplace } from "./harbourline";
import { annotateNetwork } from "./network";
import { rankEnrichmentQueue } from "./suggest";
import {
  clearBuilder,
  clearWorkplace,
  loadBuilder,
  loadWorkplace,
  saveBuilder,
  saveWorkplace,
} from "./storage";
import type {
  BuilderState,
  ConnectionRow,
  Enrichment,
  Highlight,
  Profile,
  Workplace,
} from "./types";
import { DEFAULT_PROFILE } from "./types";

type WorkplaceContextValue = {
  ready: boolean;
  workplace: Workplace | null;
  builder: BuilderState | null;
  highlight: Highlight | null;
  selectedId: string | null;
  foldOpen: boolean;
  setHighlight: (highlight: Highlight | null) => void;
  setSelectedId: (id: string | null) => void;
  setFoldOpen: (open: boolean) => void;
  startBuilder: (profile: Profile) => void;
  ingestRows: (rows: ConnectionRow[]) => BuilderState;
  setLayers: (layers: { includeWorkplace: boolean; includePersonal: boolean }) => void;
  savePersonEnrichment: (personId: string, enrichment: Enrichment) => void;
  setQueueIndex: (index: number) => void;
  skipEnrichment: () => Workplace;
  commitToMap: () => Workplace;
  loadDemo: (profile: Profile) => void;
  loadImported: (workplace: Workplace) => void;
  reset: () => void;
};

const WorkplaceContext = createContext<WorkplaceContextValue | null>(null);

function persistBuilder(next: BuilderState | null) {
  if (next) saveBuilder(next);
  else clearBuilder();
}

export function WorkplaceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [workplace, setWorkplace] = useState<Workplace | null>(null);
  const [builder, setBuilder] = useState<BuilderState | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [foldOpen, setFoldOpen] = useState(false);
  const builderRef = useRef<BuilderState | null>(null);

  useEffect(() => {
    const storedWorkplace = loadWorkplace();
    const storedBuilder = loadBuilder();
    setWorkplace(storedWorkplace);
    setBuilder(storedBuilder);
    builderRef.current = storedBuilder;
    setReady(true);
  }, []);

  const persistWorkplace = useCallback((next: Workplace | null) => {
    setWorkplace(next);
    if (next) saveWorkplace(next);
    else clearWorkplace();
  }, []);

  const startBuilder = useCallback((profile: Profile) => {
    const next: BuilderState = {
      version: 1,
      profile,
      rows: [],
      people: [],
      includeWorkplace: true,
      includePersonal: true,
      queueIds: [],
      queueIndex: 0,
      enrichmentSkipped: false,
      stage: "import",
    };
    setBuilder(next);
    builderRef.current = next;
    persistBuilder(next);
  }, []);

  const ingestRows = useCallback(
    (rows: ConnectionRow[]) => {
      const profile = builderRef.current?.profile ?? DEFAULT_PROFILE;
      const people = peopleFromConnections(rows, profile);
      const queue = rankEnrichmentQueue(people, profile, 12);
      const next: BuilderState = {
        version: 1,
        profile,
        rows,
        people,
        includeWorkplace: true,
        includePersonal: true,
        queueIds: queue.map((person) => person.id),
        queueIndex: 0,
        enrichmentSkipped: false,
        stage: "filter",
      };
      setBuilder(next);
      builderRef.current = next;
      persistBuilder(next);
      return next;
    },
    [],
  );

  const setLayers = useCallback(
    (layers: { includeWorkplace: boolean; includePersonal: boolean }) => {
      const current = builderRef.current;
      if (!current) return;
      const next = {
        ...current,
        ...layers,
        stage: "enrich" as const,
        queueIds: layers.includeWorkplace ? current.queueIds : [],
        queueIndex: 0,
      };
      builderRef.current = next;
      persistBuilder(next);
      setBuilder(next);
    },
    [],
  );

  const savePersonEnrichment = useCallback((personId: string, enrichment: Enrichment) => {
    const current = builderRef.current;
    if (!current) return;
    const people = current.people.map((person) =>
      person.id === personId
        ? applyEnrichment(person, enrichment, current.profile)
        : person,
    );
    const next = { ...current, people };
    builderRef.current = next;
    persistBuilder(next);
    setBuilder(next);
  }, []);

  const setQueueIndex = useCallback((index: number) => {
    const current = builderRef.current;
    if (!current) return;
    const next = { ...current, queueIndex: index };
    builderRef.current = next;
    persistBuilder(next);
    setBuilder(next);
  }, []);

  const writeMap = useCallback(
    (current: BuilderState, skipped: boolean) => {
      const done = { ...current, stage: "done" as const, enrichmentSkipped: skipped };
      const next = workplaceFromBuilder(current.people, current.profile, {
        includeWorkplace: current.includeWorkplace,
        includePersonal: current.includePersonal,
        skipped,
      });
      persistWorkplace(next);
      persistBuilder(done);
      builderRef.current = done;
      setBuilder(done);
      setHighlight(null);
      setSelectedId("you");
      return next;
    },
    [persistWorkplace],
  );

  const skipEnrichment = useCallback(() => {
    const current = builderRef.current;
    if (!current) {
      throw new Error("No builder in progress");
    }
    return writeMap(current, true);
  }, [writeMap]);

  const commitToMap = useCallback(() => {
    const current = builderRef.current;
    if (!current) {
      throw new Error("No builder in progress");
    }
    const skipped = current.people.every(
      (person) => person.you || !person.enrichment || person.enrichment.matter === "skip",
    );
    return writeMap(current, skipped);
  }, [writeMap]);

  const loadDemo = useCallback(
    (profile: Profile) => {
      const next = annotateNetwork(buildHarbourlineWorkplace(profile));
      persistWorkplace(next);
      persistBuilder(null);
      builderRef.current = null;
      setBuilder(null);
      setHighlight(null);
      setSelectedId("you");
    },
    [persistWorkplace],
  );

  const loadImported = useCallback(
    (next: Workplace) => {
      persistWorkplace(next);
      setHighlight(null);
      setSelectedId("you");
    },
    [persistWorkplace],
  );

  const reset = useCallback(() => {
    persistWorkplace(null);
    persistBuilder(null);
    builderRef.current = null;
    setBuilder(null);
    setHighlight(null);
    setSelectedId(null);
    setFoldOpen(false);
  }, [persistWorkplace]);

  const value = useMemo(
    () => ({
      ready,
      workplace,
      builder,
      highlight,
      selectedId,
      foldOpen,
      setHighlight,
      setSelectedId,
      setFoldOpen,
      startBuilder,
      ingestRows,
      setLayers,
      savePersonEnrichment,
      setQueueIndex,
      skipEnrichment,
      commitToMap,
      loadDemo,
      loadImported,
      reset,
    }),
    [
      ready,
      workplace,
      builder,
      highlight,
      selectedId,
      foldOpen,
      startBuilder,
      ingestRows,
      setLayers,
      savePersonEnrichment,
      setQueueIndex,
      skipEnrichment,
      commitToMap,
      loadDemo,
      loadImported,
      reset,
    ],
  );

  return (
    <WorkplaceContext.Provider value={value}>{children}</WorkplaceContext.Provider>
  );
}

export function useWorkplace() {
  const value = useContext(WorkplaceContext);
  if (!value) throw new Error("useWorkplace must be used inside WorkplaceProvider");
  return value;
}
