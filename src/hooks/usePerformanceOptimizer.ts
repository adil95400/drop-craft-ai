import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  queryTime: number;
  renderTime: number;
  cacheHitRate: number;
  errorRate: number;
  activeConnections: number;
}

interface OptimizationSuggestion {
  type: 'query' | 'cache' | 'index' | 'component';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: string;
}

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

export const usePerformanceOptimizer = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    queryTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    activeConnections: 0
  });
  
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Cache management with TTL
  const getCachedData = useCallback((key: string): any | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }, [cache]);

  const setCachedData = useCallback((key: string, data: any, ttl: number = 300000) => {
    setCache(prev => new Map(prev).set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl
    }));
  }, []);

  // Optimized query with caching
  const optimizedQuery = useCallback(async (
    table: 'customers' | 'suppliers' | 'orders' | 'products',
    query: string, 
    cacheKey?: string,
    cacheTTL?: number
  ) => {
    const startTime = performance.now();
    
    // Check cache first if cacheKey provided
    if (cacheKey) {
      const cachedResult = getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      const result = await supabase.from(table).select(query);
      const queryTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        queryTime: (prev.queryTime + queryTime) / 2, // Running average
        errorRate: result.error ? prev.errorRate + 0.1 : Math.max(0, prev.errorRate - 0.01)
      }));

      // Cache successful results
      if (!result.error && cacheKey) {
        setCachedData(cacheKey, result, cacheTTL);
      }

      // Generate optimization suggestions based on query performance
      if (queryTime > 1000) {
        setSuggestions(prev => [...prev.slice(-4), {
          type: 'query',
          severity: queryTime > 3000 ? 'critical' : 'high',
          description: `Slow query detected on table ${table} (${queryTime.toFixed(0)}ms)`,
          impact: 'Poor user experience and increased server load',
          solution: 'Consider adding database indexes or optimizing the query',
          estimatedImprovement: '60-80% faster response time'
        }]);
      }

      return result;
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        errorRate: prev.errorRate + 0.5
      }));
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Performance monitoring
  const measureRenderTime = useCallback((componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const renderTime = performance.now() - startTime;
    
    setMetrics(prev => ({
      ...prev,
      renderTime: (prev.renderTime + renderTime) / 2
    }));

    // Suggest component optimization if render is slow
    if (renderTime > 16) { // 60fps threshold
      setSuggestions(prev => [...prev.slice(-4), {
        type: 'component',
        severity: renderTime > 50 ? 'high' : 'medium',
        description: `Slow render detected in ${componentName} (${renderTime.toFixed(1)}ms)`,
        impact: 'Janky user interface and poor user experience',
        solution: 'Consider using React.memo, useMemo, or useCallback',
        estimatedImprovement: '50-70% faster rendering'
      }]);
    }
  }, []);

  // Database optimization suggestions
  const analyzeDatabasePerformance = useCallback(async () => {
    try {
      // Analyze existing data for performance insights
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (securityEvents && securityEvents.length > 10) {
        setSuggestions(prev => [...prev.slice(-4), {
          type: 'query',
          severity: 'medium',
          description: 'High volume of security events detected',
          impact: 'Potential performance impact from excessive logging',
          solution: 'Review and optimize security event logging frequency',
          estimatedImprovement: '20-30% improvement in write performance'
        }]);
      }

      // Check for large tables that might need optimization
      const { data: customers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      if (customers && customers.length > 1000) {
        setSuggestions(prev => [...prev.slice(-4), {
          type: 'index',
          severity: 'medium',
          description: 'Large customer table detected',
          impact: 'Potential slow customer queries',
          solution: 'Consider adding indexes on frequently queried customer fields',
          estimatedImprovement: '60-80% faster customer lookups'
        }]);
      }

    } catch (error) {
      console.error('Database performance analysis failed:', error);
    }
  }, []);

  // Apply automatic optimizations
  const applyOptimizations = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      // Clean expired cache entries
      const now = Date.now();
      setCache(prev => {
        const newCache = new Map();
        prev.forEach((entry, key) => {
          if (now - entry.timestamp <= entry.ttl) {
            newCache.set(key, entry);
          }
        });
        return newCache;
      });

      // These RPC functions may not exist - wrap in try/catch
      try {
        await supabase.functions.invoke('cleanup-old-data', {
          body: { type: 'security_events' }
        });
      } catch (e) {
        console.log('Cleanup function not available');
      }
      
      // Update cache hit rate
      const totalCacheRequests = cache.size;
      const cacheHits = Array.from(cache.values()).filter(entry => 
        now - entry.timestamp < entry.ttl
      ).length;
      
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0
      }));

      // Remove applied suggestions
      setSuggestions([]);
      
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [cache]);

  // Monitor system performance
  useEffect(() => {
    const monitorPerformance = async () => {
      try {
        // Get basic activity metrics
        const { data: recentActivity } = await supabase
          .from('activity_logs')
          .select('*')
          .gte('created_at', new Date(Date.now() - 60000).toISOString())
          .limit(10);
        
        if (recentActivity) {
          setMetrics(prev => ({
            ...prev,
            activeConnections: recentActivity.length || 0
          }));
        }

        // Check for performance issues
        if (metrics.queryTime > 1000) {
          setSuggestions(prev => [...prev.slice(-4), {
            type: 'query',
            severity: 'high',
            description: 'Average query time is above acceptable threshold',
            impact: 'Slow application response times',
            solution: 'Enable query caching and optimize slow queries',
            estimatedImprovement: '40-60% improvement in response time'
          }]);
        }

        if (metrics.cacheHitRate < 70) {
          setSuggestions(prev => [...prev.slice(-4), {
            type: 'cache',
            severity: 'medium',
            description: `Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`,
            impact: 'Unnecessary database queries and slow response times',
            solution: 'Increase cache TTL and implement more aggressive caching',
            estimatedImprovement: '30-50% reduction in database load'
          }]);
        }

      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    };

    const interval = setInterval(monitorPerformance, 30000); // Every 30 seconds
    monitorPerformance(); // Initial call

    return () => clearInterval(interval);
  }, [metrics.queryTime, metrics.cacheHitRate]);

  // Run database analysis periodically
  useEffect(() => {
    const interval = setInterval(analyzeDatabasePerformance, 300000); // Every 5 minutes
    analyzeDatabasePerformance(); // Initial call

    return () => clearInterval(interval);
  }, [analyzeDatabasePerformance]);

  return {
    metrics,
    suggestions,
    isOptimizing,
    optimizedQuery,
    measureRenderTime,
    applyOptimizations,
    getCachedData,
    setCachedData,
    analyzeDatabasePerformance
  };
};
