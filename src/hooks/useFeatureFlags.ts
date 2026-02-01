/**
 * React Hook for Feature Flags
 * Provides reactive access to feature flags with automatic updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { featureFlags, FLAG_KEYS, FlagKey, FeatureFlag } from '@/lib/feature-flags';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface UseFeatureFlagsReturn {
  /** Check if a specific flag is enabled */
  isEnabled: (flagKey: FlagKey | string) => boolean;
  /** Check if any of the provided flags are enabled */
  isAnyEnabled: (flagKeys: (FlagKey | string)[]) => boolean;
  /** Check if all of the provided flags are enabled */
  areAllEnabled: (flagKeys: (FlagKey | string)[]) => boolean;
  /** Get all flags for a category */
  getFlagsByCategory: (category: string) => FeatureFlag[];
  /** Get all current flag states */
  allFlags: Map<string, boolean>;
  /** Loading state */
  loading: boolean;
  /** Force refresh flags */
  refresh: () => Promise<void>;
  /** Flag keys constant for convenience */
  FLAGS: typeof FLAG_KEYS;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { user } = useUnifiedAuth();
  const [flags, setFlags] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  // Initialize and subscribe to changes
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      await featureFlags.initialize(user.id);
      setFlags(featureFlags.getAllFlags());
      setLoading(false);
    };

    init();

    // Subscribe to changes
    const unsubscribe = featureFlags.subscribe((newFlags) => {
      setFlags(new Map(newFlags));
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const isEnabled = useCallback(
    (flagKey: FlagKey | string): boolean => {
      return flags.get(flagKey) ?? false;
    },
    [flags]
  );

  const isAnyEnabled = useCallback(
    (flagKeys: (FlagKey | string)[]): boolean => {
      return flagKeys.some((key) => flags.get(key) ?? false);
    },
    [flags]
  );

  const areAllEnabled = useCallback(
    (flagKeys: (FlagKey | string)[]): boolean => {
      return flagKeys.every((key) => flags.get(key) ?? false);
    },
    [flags]
  );

  const getFlagsByCategory = useCallback(
    (category: string): FeatureFlag[] => {
      return featureFlags.getFlagsByCategory(category);
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await featureFlags.refresh();
    setFlags(featureFlags.getAllFlags());
    setLoading(false);
  }, []);

  return useMemo(
    () => ({
      isEnabled,
      isAnyEnabled,
      areAllEnabled,
      getFlagsByCategory,
      allFlags: flags,
      loading,
      refresh,
      FLAGS: FLAG_KEYS,
    }),
    [isEnabled, isAnyEnabled, areAllEnabled, getFlagsByCategory, flags, loading, refresh]
  );
}

/**
 * Hook for checking a single feature flag
 * More optimized for single flag checks
 */
export function useFeatureFlag(flagKey: FlagKey | string): {
  isEnabled: boolean;
  loading: boolean;
} {
  const { user } = useUnifiedAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      await featureFlags.initialize(user.id);
      const enabled = await featureFlags.isEnabled(flagKey);
      setIsEnabled(enabled);
      setLoading(false);
    };

    check();

    const unsubscribe = featureFlags.subscribe((flags) => {
      setIsEnabled(flags.get(flagKey) ?? false);
    });

    return unsubscribe;
  }, [user?.id, flagKey]);

  return { isEnabled, loading };
}

/**
 * Component wrapper for conditional rendering based on feature flag
 */
interface FeatureGateProps {
  flag: FlagKey | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlag(flag);

  if (loading) return null;
  if (!isEnabled) return fallback;
  return children;
}

export { FLAG_KEYS };
