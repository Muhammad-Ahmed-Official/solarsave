"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type EstimateSessionValue = {
  activityId: string | null;
  stateCode: string | null;
  fortyGuardResult: any;
  generatorEstimate: any;
  analysisResult: any;
  analysisLoading: boolean;
  setActivityId: (value: string | null) => void;
  setStateCode: (value: string | null) => void;
  setFortyGuardResult: (value: any) => void;
  setGeneratorEstimate: (value: any) => void;
  setAnalysisResult: (value: any) => void;
  setAnalysisLoading: (value: boolean) => void;
};

const EstimateSessionContext = createContext<EstimateSessionValue | null>(null);

export function EstimateSessionProvider({ children }: { children: ReactNode }) {
  const [activityId, setActivityId] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [fortyGuardResult, setFortyGuardResult] = useState<any>(null);
  const [generatorEstimate, setGeneratorEstimate] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const value = useMemo<EstimateSessionValue>(
    () => ({
      activityId,
      stateCode,
      fortyGuardResult,
      generatorEstimate,
      analysisResult,
      analysisLoading,
      setActivityId,
      setStateCode,
      setFortyGuardResult,
      setGeneratorEstimate,
      setAnalysisResult,
      setAnalysisLoading,
    }),
    [activityId, stateCode, fortyGuardResult, generatorEstimate, analysisResult, analysisLoading],
  );

  return (
    <EstimateSessionContext.Provider value={value}>{children}</EstimateSessionContext.Provider>
  );
}

export function useEstimateSession() {
  const context = useContext(EstimateSessionContext);
  if (!context) {
    throw new Error("useEstimateSession must be used within EstimateSessionProvider");
  }
  return context;
}
