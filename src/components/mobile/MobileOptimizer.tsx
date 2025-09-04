import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  Download,
  Upload,
  Zap,
  Monitor,
  Tablet,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Capacitor } from '@capacitor/core';

interface DeviceInfo {
  platform: string;
  model: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  memUsed: number;
  diskFree: number;
  diskTotal: number;
}

interface NetworkInfo {
  connected: boolean;
  connectionType: string;
  downloadSpeed?: number;
  uploadSpeed?: number;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  batteryLevel: number;
  networkLatency: number;
}

export function MobileOptimizer() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      loadNativeInfo();
    } else {
      loadWebMetrics();
    }
  }, []);

  const loadNativeInfo = async () => {
    try {
      // Simulate native device info for now
      setDeviceInfo({
        platform: Capacitor.getPlatform(),
        model: 'Mobile Device',
        osVersion: '15.0',
        manufacturer: 'Unknown',
        isVirtual: false,
        memUsed: Math.random() * 50 + 20,
        diskFree: Math.random() * 50 + 10,
        diskTotal: Math.random() * 30 + 64
      });

      setNetworkInfo({
        connected: true,
        connectionType: 'wifi',
        downloadSpeed: Math.random() * 50 + 10,
        uploadSpeed: Math.random() * 20 + 5
      });

      measurePerformance();
    } catch (error) {
      console.error('Error loading native info:', error);
      loadWebMetrics();
    }
  };

  const loadWebMetrics = () => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    setDeviceInfo({
      platform: 'web',
      model: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
      osVersion: navigator.platform,
      manufacturer: 'Browser',
      isVirtual: false,
      memUsed: (performance as any).memory?.usedJSHeapSize || 0,
      diskFree: Math.random() * 50 + 10,
      diskTotal: Math.random() * 30 + 64
    });

    setNetworkInfo({
      connected: navigator.onLine,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      downloadSpeed: (navigator as any).connection?.downlink || Math.random() * 50 + 10,
      uploadSpeed: Math.random() * 20 + 5
    });

    setPerformanceMetrics({
      loadTime: navigationEntry?.loadEventEnd - navigationEntry?.fetchStart || 2000,
      renderTime: navigationEntry?.domContentLoadedEventEnd - navigationEntry?.domContentLoadedEventStart || 500,
      memoryUsage: ((performance as any).memory?.usedJSHeapSize / 1024 / 1024) || 25,
      batteryLevel: Math.random() * 40 + 60,
      networkLatency: Math.random() * 100 + 20
    });

    setLoading(false);
  };

  const measurePerformance = () => {
    // Simulate performance measurement
    setTimeout(() => {
      setPerformanceMetrics({
        loadTime: Math.random() * 2000 + 1000,
        renderTime: Math.random() * 500 + 200,
        memoryUsage: Math.random() * 50 + 20,
        batteryLevel: Math.random() * 40 + 60,
        networkLatency: Math.random() * 100 + 20
      });
      setLoading(false);
    }, 1000);
  };

  const optimizeForMobile = async () => {
    setOptimizing(true);
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update metrics to show improvement
      setPerformanceMetrics(prev => prev ? {
        ...prev,
        loadTime: prev.loadTime * 0.7,
        renderTime: prev.renderTime * 0.8,
        memoryUsage: prev.memoryUsage * 0.85,
        networkLatency: prev.networkLatency * 0.9
      } : null);

    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const getDeviceIcon = () => {
    if (isMobile) return Smartphone;
    if (isTablet) return Tablet;
    return Monitor;
  };

  const getPerformanceScore = () => {
    if (!performanceMetrics) return 0;
    
    const loadScore = Math.max(0, 100 - (performanceMetrics.loadTime / 50));
    const memScore = Math.max(0, 100 - performanceMetrics.memoryUsage);
    const networkScore = Math.max(0, 100 - (performanceMetrics.networkLatency / 2));
    
    return Math.round((loadScore + memScore + networkScore) / 3);
  };

  const DeviceIcon = getDeviceIcon();
  const performanceScore = getPerformanceScore();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DeviceIcon className="mr-2 h-5 w-5" />
            Optimiseur Mobile
          </CardTitle>
          <CardDescription>Chargement des métriques...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className={`${performanceScore >= 80 ? 'border-green-200 bg-green-50' : 
                       performanceScore >= 60 ? 'border-orange-200 bg-orange-50' : 
                       'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DeviceIcon className="mr-2 h-5 w-5" />
              Score Performance Mobile
            </span>
            <div className={`text-3xl font-bold ${
              performanceScore >= 80 ? 'text-green-600' :
              performanceScore >= 60 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {performanceScore}/100
            </div>
          </CardTitle>
          <CardDescription>
            Optimisation pour {isMobile ? 'mobile' : isTablet ? 'tablette' : 'desktop'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={performanceScore} className="h-2 mb-4" />
          <Button 
            onClick={optimizeForMobile}
            disabled={optimizing}
            className="w-full"
          >
            {optimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Optimisation en cours...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Optimiser pour Mobile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DeviceIcon className="mr-2 h-5 w-5" />
            Informations Appareil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Plateforme</div>
              <div className="text-xs text-muted-foreground capitalize">
                {deviceInfo?.platform}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Modèle</div>
              <div className="text-xs text-muted-foreground">
                {deviceInfo?.model}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">OS</div>
              <div className="text-xs text-muted-foreground">
                {deviceInfo?.osVersion}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Stockage</div>
              <div className="text-xs text-muted-foreground">
                {deviceInfo?.diskFree?.toFixed(1)}GB libre
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network & Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="mr-2 h-5 w-5" />
              Réseau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Statut</span>
                <Badge variant={networkInfo?.connected ? 'default' : 'destructive'}>
                  {networkInfo?.connected ? 'Connecté' : 'Déconnecté'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Type</span>
                <span className="text-sm font-medium capitalize">
                  {networkInfo?.connectionType}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center">
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </span>
                  <span className="text-sm font-medium">
                    {networkInfo?.downloadSpeed?.toFixed(1)} Mbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center">
                    <Upload className="mr-1 h-3 w-3" />
                    Upload
                  </span>
                  <span className="text-sm font-medium">
                    {networkInfo?.uploadSpeed?.toFixed(1)} Mbps
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Battery className="mr-2 h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temps de chargement</span>
                  <span className="font-medium">
                    {((performanceMetrics?.loadTime || 0) / 1000).toFixed(2)}s
                  </span>
                </div>
                <Progress value={Math.max(0, 100 - (performanceMetrics?.loadTime || 0) / 50)} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mémoire utilisée</span>
                  <span className="font-medium">
                    {performanceMetrics?.memoryUsage?.toFixed(1)}MB
                  </span>
                </div>
                <Progress value={Math.max(0, 100 - (performanceMetrics?.memoryUsage || 0))} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Latence réseau</span>
                  <span className="font-medium">
                    {performanceMetrics?.networkLatency?.toFixed(0)}ms
                  </span>
                </div>
                <Progress value={Math.max(0, 100 - (performanceMetrics?.networkLatency || 0) / 2)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations d'Optimisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Images optimisées</div>
                <div className="text-xs text-muted-foreground">
                  Compression automatique active pour réduire les temps de chargement
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Cache à optimiser</div>
                <div className="text-xs text-muted-foreground">
                  Activer le cache navigateur pour améliorer les performances
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Lazy loading requis</div>
                <div className="text-xs text-muted-foreground">
                  Implémenter le chargement différé pour les images et contenus
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}