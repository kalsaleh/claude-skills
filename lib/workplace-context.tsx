"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildHarbourlineWorkplace } from "./harbourline";
import { annotateNetwork } from "./network";
import { clearWorkplace, loadWorkplace, saveWorkplace } from "./storage";
import type { Highlight, Profile, Workplace } from "./types";

type WorkplaceContextValue = {
  ready: boolean;
  workplace: Workplace | null;
  highlight: Highlight | null;
  selectedId: string | null;
  foldOpen: boolean;
  setHighlight: (highlight: Highlight | null) => void;
  setSelectedId: (id: string | null) => void;
  setFoldOpen: (open: boolean) => void;
  loadDemo: (profile: Profile) => void;
  loadImported: (workplace: Workplace) => void;
  reset: () => void;
};

const WorkplaceContext = createContext<WorkplaceContextValue | null>(null);

export function WorkplaceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [workplace, setWorkplace] = useState<Workplace | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [foldOpen, setFoldOpen] = useState(false);

  useEffect(() => {
    setWorkplace(loadWorkplace());
    setReady(true);
  }, []);

  const persist = useCallback((next: Workplace | null) => {
    setWorkplace(next);
    if (next) saveWorkplace(next);
    else clearWorkplace();
  }, []);

  const loadDemo = useCallback(
    (profile: Profile) => {
      const next = annotateNetwork(buildHarbourlineWorkplace(profile));
      persist(next);
      setHighlight(null);
      setSelectedId("you");
    },
    [persist],
  );

  const loadImported = useCallback(
    (next: Workplace) => {
      persist(next);
      setHighlight(null);
      setSelectedId("you");
    },
    [persist],
  );

  const reset = useCallback(() => {
    persist(null);
    setHighlight(null);
    setSelectedId(null);
    setFoldOpen(false);
  }, [persist]);

  const value = useMemo(
    () => ({
      ready,
      workplace,
      highlight,
      selectedId,
      foldOpen,
      setHighlight,
      setSelectedId,
      setFoldOpen,
      loadDemo,
      loadImported,
      reset,
    }),
    [
      ready,
      workplace,
      highlight,
      selectedId,
      foldOpen,
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
