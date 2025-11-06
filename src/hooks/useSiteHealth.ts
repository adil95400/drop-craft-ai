import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface SiteHealthData {
  overall: number;
  seo: number;
  images: number;
  content: number;
  translations: number;
  lastOptimization: string;
  optimizationCount: number;
  improvement: number;
  nextOptimization: string;
}

export function useSiteHealth() {
  const { data: siteHealth, isLoading } = useQuery({
    queryKey: ['site-health'],
    queryFn: async (): Promise<SiteHealthData> => {
      // Simulate fetching site health data
      // In production, this would call an edge function
      return {
        overall: 78,
        seo: 85,
        images: 62,
        content: 91,
        translations: 45,
        lastOptimization: 'Il y a 2 jours',
        optimizationCount: 347,
        improvement: 24,
        nextOptimization: 'Dans 5 jours'
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    siteHealth: siteHealth || {
      overall: 0,
      seo: 0,
      images: 0,
      content: 0,
      translations: 0,
      lastOptimization: 'Jamais',
      optimizationCount: 0,
      improvement: 0,
      nextOptimization: 'Non planifiée'
    },
    isLoading
  };
}
