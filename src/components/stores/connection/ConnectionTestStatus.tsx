import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConnectionTestStatusProps {
  platform: string;
  domain: string;
  credentials: Record<string, any>;
  onTestComplete?: (success: boolean, data?: any) => void;
  autoTest?: boolean;
}

export function ConnectionTestStatus({ 
  platform, 
  domain, 
  credentials, 
  onTestComplete,
  autoTest = false 
}: ConnectionTestStatusProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: result, error } = await supabase.functions.invoke('store-connection-test', {
        body: {
          platform,
          shopDomain: domain,
          ...credentials
        }
      });

      if (error) throw error;

      setTestResult(result);
      onTestComplete?.(result.success, result.data);
    } catch (error: any) {
      const errorResult = { success: false, error: error.message };
      setTestResult(errorResult);
      onTestComplete?.(false);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (autoTest && platform && domain && Object.keys(credentials).length > 0) {
      testConnection();
    }
  }, [autoTest, platform, domain, credentials]);

  const getStatusIcon = () => {
    if (testing) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (testResult === null) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    
    return testResult.success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusText = () => {
    if (testing) return 'Test en cours...';
    if (testResult === null) return 'Non testé';
    return testResult.success ? 'Connexion réussie' : 'Échec de connexion';
  };

  const getStatusColor = () => {
    if (testing) return 'blue';
    if (testResult === null) return 'gray';
    return testResult.success ? 'green' : 'red';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          <Badge variant="outline" className={`text-${getStatusColor()}-600 border-${getStatusColor()}-200`}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Badge>
        </div>
        
        {!testing && (
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={!domain || Object.keys(credentials).length === 0}
          >
            Tester la connexion
          </Button>
        )}
      </div>

      {testResult && !testResult.success && testResult.error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {testResult.error}
          </AlertDescription>
        </Alert>
      )}

      {testResult && testResult.success && testResult.data && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div>Connexion établie avec succès !</div>
              {testResult.data.shop && (
                <div className="text-xs text-muted-foreground">
                  Boutique: {testResult.data.shop}
                </div>
              )}
              {testResult.data.currency && (
                <div className="text-xs text-muted-foreground">
                  Devise: {testResult.data.currency}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}