import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, Cpu, Database, Network, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Zap, Clock, Users, BarChart3,
  Server, Globe, Shield, Target
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  category: 'performance' | 'security' | 'availability' | 'capacity';
  current_value: number;
  threshold_warning: number;
  threshold_critical: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
  last_updated: string;
}

interface PerformanceAlert {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  impact_score: number;
  created_at: string;
  resolved_at: string | null;
  affected_systems: string[];
}

interface ScalingRecommendation {
  id: string;
  resource_type: string;
  current_usage: number;
  predicted_usage: number;
  recommendation_type: 'scale_up' | 'scale_down' | 'optimize';
  confidence_level: number;
  estimated_cost_impact: number;
  time_horizon: 'immediate' | 'short_term' | 'long_term';
  reasoning: string;
  implementation_steps: string[];
}

export const PerformanceMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [scalingRecommendations, setScalingRecommendations] = useState<ScalingRecommendation[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadPerformanceData = () => {
      setSystemMetrics([
        {
          id: '1',
          name: 'CPU Utilization',
          category: 'performance',
          current_value: 67.3,
          threshold_warning: 70,
          threshold_critical: 85,
          unit: '%',
          trend: 'up',
          trend_percentage: 5.2,
          status: 'warning',
          description: 'Average CPU utilization across all servers',
          last_updated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Memory Usage',
          category: 'performance',
          current_value: 78.9,
          threshold_warning: 80,
          threshold_critical: 90,
          unit: '%',
          trend: 'stable',
          trend_percentage: 0.8,
          status: 'warning',
          description: 'Memory utilization across application servers',
          last_updated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Database Response Time',
          category: 'performance',
          current_value: 145,
          threshold_warning: 200,
          threshold_critical: 500,
          unit: 'ms',
          trend: 'down',
          trend_percentage: -12.3,
          status: 'healthy',
          description: 'Average database query response time',
          last_updated: new Date().toISOString()
        },
        {
          id: '4',
          name: 'API Success Rate',
          category: 'availability',
          current_value: 99.7,
          threshold_warning: 99.0,
          threshold_critical: 95.0,
          unit: '%',
          trend: 'stable',
          trend_percentage: 0.1,
          status: 'healthy',
          description: 'Percentage of successful API requests',
          last_updated: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Disk Usage',
          category: 'capacity',
          current_value: 73.2,
          threshold_warning: 80,
          threshold_critical: 90,
          unit: '%',
          trend: 'up',
          trend_percentage: 2.1,
          status: 'healthy',
          description: 'Storage utilization across all systems',
          last_updated: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Security Score',
          category: 'security',
          current_value: 94.8,
          threshold_warning: 85,
          threshold_critical: 70,
          unit: '/100',
          trend: 'up',
          trend_percentage: 1.2,
          status: 'healthy',
          description: 'Overall security posture score',
          last_updated: new Date().toISOString()
        }
      ]);

      setAlerts([
        {
          id: '1',
          title: 'High CPU Usage Detected',
          severity: 'warning',
          category: 'Performance',
          description: 'CPU utilization has exceeded 65% for the last 15 minutes',
          recommendation: 'Consider scaling up compute resources or optimizing resource-intensive processes',
          impact_score: 7.2,
          created_at: '2024-01-15T13:30:00Z',
          resolved_at: null,
          affected_systems: ['app-server-1', 'app-server-2']
        },
        {
          id: '2',
          title: 'Memory Usage Approaching Threshold',
          severity: 'warning',
          category: 'Performance',
          description: 'Memory usage is at 78.9% and trending upward',
          recommendation: 'Monitor memory usage patterns and prepare for potential scaling',
          impact_score: 6.8,
          created_at: '2024-01-15T14:15:00Z',
          resolved_at: null,
          affected_systems: ['app-server-3']
        },
        {
          id: '3',
          title: 'Database Performance Improved',
          severity: 'info',
          category: 'Performance',
          description: 'Database response time has decreased by 12.3% over the last hour',
          recommendation: 'No action required - performance optimization successful',
          impact_score: 3.2,
          created_at: '2024-01-15T12:45:00Z',
          resolved_at: '2024-01-15T14:20:00Z',
          affected_systems: ['primary-db']
        }
      ]);

      setScalingRecommendations([
        {
          id: '1',
          resource_type: 'Compute Instances',
          current_usage: 67.3,
          predicted_usage: 82.1,
          recommendation_type: 'scale_up',
          confidence_level: 87.5,
          estimated_cost_impact: 340,
          time_horizon: 'short_term',
          reasoning: 'Based on current trends and upcoming seasonal traffic patterns, compute resources will likely exceed capacity thresholds within the next 7 days.',
          implementation_steps: [
            'Add 2 additional compute instances to the auto-scaling group',
            'Update load balancer configuration',
            'Monitor performance for 24 hours post-scaling',
            'Adjust scaling policies if needed'
          ]
        },
        {
          id: '2',
          resource_type: 'Database Connection Pool',
          current_usage: 45.2,
          predicted_usage: 38.7,
          recommendation_type: 'optimize',
          confidence_level: 73.8,
          estimated_cost_impact: -120,
          time_horizon: 'immediate',
          reasoning: 'Connection pool optimization can reduce overhead and improve performance without additional hardware costs.',
          implementation_steps: [
            'Analyze connection pooling patterns',
            'Implement connection pool optimization',
            'Monitor query performance improvements',
            'Fine-tune pool size parameters'
          ]
        }
      ]);

      setLoading(false);
    };

    // Initial load
    loadPerformanceData();

    // Set up refresh interval for real-time updates
    const interval = setInterval(loadPerformanceData, 30000); // Update every 30 seconds
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp className={`h-3 w-3 ${percentage > 0 ? 'text-red-500' : 'text-green-500'}`} />;
    if (trend === 'down') return <TrendingDown className={`h-3 w-3 ${percentage > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    return <div className="h-3 w-3 bg-gray-400 rounded-full"></div>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Cpu className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'availability': return <Globe className="h-4 w-4" />;
      case 'capacity': return <Database className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'scale_up': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scale_down': return 'bg-green-100 text-green-800 border-green-200';
      case 'optimize': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Performance Monitor</h1>
            <p className="text-muted-foreground">
              Real-time system monitoring and intelligent scaling recommendations
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Systems Healthy
          </Badge>
          <Button variant="outline" size="sm">
            <Zap className="h-3 w-3 mr-1" />
            Auto-Refresh: 30s
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="scaling" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Scaling</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((metric) => (
              <Card key={metric.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(metric.category)}
                      <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    </div>
                    <Badge className={getMetricStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metric.current_value.toFixed(1)}{metric.unit}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        {getTrendIcon(metric.trend, metric.trend_percentage)}
                        <span>{Math.abs(metric.trend_percentage).toFixed(1)}%</span>
                        <span>vs last hour</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Current</span>
                      <span>Warning: {metric.threshold_warning}{metric.unit}</span>
                    </div>
                    <Progress 
                      value={(metric.current_value / metric.threshold_critical) * 100} 
                      className="h-2"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                  
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(metric.last_updated).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{alert.title}</span>
                        <Badge className={getAlertSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {alert.category} • Impact Score: {alert.impact_score}/10
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.resolved_at ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {alert.resolved_at ? 'Resolved' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{alert.description}</p>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-sm text-blue-900 mb-1">Recommendation</h4>
                    <p className="text-sm text-blue-800">{alert.recommendation}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500">Affected Systems:</span>
                    {alert.affected_systems.map((system, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                    {alert.resolved_at && (
                      <span>Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scaling" className="space-y-6">
          <div className="grid gap-6">
            {scalingRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{recommendation.resource_type}</span>
                        <Badge className={getRecommendationTypeColor(recommendation.recommendation_type)}>
                          {recommendation.recommendation_type.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Confidence: {recommendation.confidence_level}% • {recommendation.time_horizon.replace('_', ' ')} horizon
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={recommendation.estimated_cost_impact > 0 ? 'text-red-700' : 'text-green-700'}
                    >
                      {recommendation.estimated_cost_impact > 0 ? '+' : ''}${recommendation.estimated_cost_impact}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Usage</p>
                      <p className="text-2xl font-bold text-blue-600">{recommendation.current_usage}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Predicted Usage</p>
                      <p className="text-2xl font-bold text-orange-600">{recommendation.predicted_usage}%</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">AI Reasoning</h4>
                    <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Implementation Steps</h4>
                    <ol className="space-y-1">
                      {recommendation.implementation_steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                          <span className="text-xs font-medium text-gray-500 mt-0.5 flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      Simulate Impact
                    </Button>
                    <Button size="sm">
                      Implement Recommendation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              Detailed performance analytics, custom dashboards, and predictive insights.
            </p>
            <Button>
              Open Analytics Dashboard
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};