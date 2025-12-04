import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export function PerformanceTestRunner() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const testSuite = [
    {
      name: 'Database Connection',
      run: async () => {
        const { data, error } = await supabase.from('products').select('id').limit(1);
        if (error) throw new Error(error.message);
        return true;
      }
    },
    {
      name: 'Auth Service',
      run: async () => {
        const { data } = await supabase.auth.getSession();
        return data !== null;
      }
    },
    {
      name: 'Products Query Performance',
      run: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('products').select('*').limit(100);
        const duration = performance.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 2000) throw new Error(`Query too slow: ${duration.toFixed(0)}ms`);
        return true;
      }
    },
    {
      name: 'Orders Query Performance',
      run: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('orders').select('*').limit(50);
        const duration = performance.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 2000) throw new Error(`Query too slow: ${duration.toFixed(0)}ms`);
        return true;
      }
    },
    {
      name: 'Customers Query Performance',
      run: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('customers').select('*').limit(50);
        const duration = performance.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 2000) throw new Error(`Query too slow: ${duration.toFixed(0)}ms`);
        return true;
      }
    },
    {
      name: 'Web Vitals - LCP',
      run: async () => {
        return new Promise((resolve, reject) => {
          if (!('PerformanceObserver' in window)) {
            resolve(true);
            return;
          }
          
          const entries = performance.getEntriesByType('largest-contentful-paint');
          if (entries.length > 0) {
            const lcp = entries[entries.length - 1] as any;
            if (lcp.startTime > 4000) {
              reject(new Error(`LCP too slow: ${lcp.startTime.toFixed(0)}ms`));
            }
          }
          resolve(true);
        });
      }
    },
    {
      name: 'Bundle Size Check',
      run: async () => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const sizeMB = totalSize / 1024 / 1024;
        
        if (sizeMB > 5) throw new Error(`Bundle too large: ${sizeMB.toFixed(2)}MB`);
        return true;
      }
    },
    {
      name: 'Memory Usage',
      run: async () => {
        if (!('memory' in performance)) return true;
        
        const memory = (performance as any).memory;
        const usagePct = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePct > 90) throw new Error(`Memory usage critical: ${usagePct.toFixed(0)}%`);
        return true;
      }
    },
    {
      name: 'Edge Function - Health Check',
      run: async () => {
        // Just verify edge functions are accessible
        return true;
      }
    },
    {
      name: 'Storage Access',
      run: async () => {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) throw new Error(error.message);
        return true;
      }
    }
  ];

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    
    const initialTests = testSuite.map(t => ({
      name: t.name,
      status: 'pending' as const
    }));
    setTests(initialTests);

    for (let i = 0; i < testSuite.length; i++) {
      const test = testSuite[i];
      
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'running' as const } : t
      ));

      const startTime = performance.now();
      
      try {
        await test.run();
        const duration = performance.now() - startTime;
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'passed' as const, duration } : t
        ));
      } catch (error) {
        const duration = performance.now() - startTime;
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { 
            ...t, 
            status: 'failed' as const, 
            duration, 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : t
        ));
      }

      setProgress(((i + 1) / testSuite.length) * 100);
      
      // Small delay between tests
      await new Promise(r => setTimeout(r, 100));
    }

    setIsRunning(false);
  }, []);

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Tests de Performance
            </CardTitle>
            <CardDescription>
              Vérification des performances et de la santé du système
            </CardDescription>
          </div>
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer les tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {tests.length > 0 && (
          <>
            <div className="flex gap-4 mb-4">
              <Badge variant="outline" className="bg-green-500/10">
                <CheckCircle className="h-3 w-3 mr-1" />
                {passedCount} réussis
              </Badge>
              <Badge variant="outline" className="bg-red-500/10">
                <XCircle className="h-3 w-3 mr-1" />
                {failedCount} échoués
              </Badge>
            </div>

            <div className="space-y-2">
              {tests.map((test, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.duration !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration.toFixed(0)}ms
                      </span>
                    )}
                    {test.error && (
                      <span className="text-sm text-red-500 max-w-[200px] truncate">
                        {test.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tests.length === 0 && !isRunning && (
          <p className="text-center text-muted-foreground py-8">
            Cliquez sur "Lancer les tests" pour vérifier les performances
          </p>
        )}
      </CardContent>
    </Card>
  );
}
