"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAllUnifiedAnalytics } from "@/lib/hooks/dashboard-hooks";
import { AllUnifiedAnalyticsCache } from "@/lib/localDb";

interface AnalyticsContextValue {
  weekly: AllUnifiedAnalyticsCache | undefined;
  monthly: AllUnifiedAnalyticsCache | undefined;
  yearly: AllUnifiedAnalyticsCache | undefined;
  isLoading: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  // Fetch all time ranges once at the layout level
  const { data: weekly, isLoading: weeklyLoading } = useAllUnifiedAnalytics('weekly');
  const { data: monthly, isLoading: monthlyLoading } = useAllUnifiedAnalytics('monthly');
  const { data: yearly, isLoading: yearlyLoading } = useAllUnifiedAnalytics('yearly');

  const isLoading = weeklyLoading || monthlyLoading || yearlyLoading;

  return (
    <AnalyticsContext.Provider
      value={{
        weekly,
        monthly,
        yearly,
        isLoading,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalyticsContext must be used within an AnalyticsProvider");
  }
  return context;
}

