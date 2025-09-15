import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, Play, Pause, Settings, Zap, Clock, CheckCircle, 
  AlertCircle, BarChart3, Workflow, TrendingUp, Activity,
  RefreshCw, Target, Users, Database
} from 'lucide-react';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'sales' | 'operations' | 'support';
  status: 'active' | 'paused' | 'draft' | 'error';
  trigger_type: string;
  complexity_score: number;
  success_rate: number;
  avg_execution_time: number;
  executions_today: number;
  last_execution: string;
  next_execution: string;
  steps: WorkflowStep[];
  performance_metrics: {
    total_executions: number;
    success_count: number;
    error_count: number;
    time_saved_minutes: number;
    roi_percentage: number;
  };
  ai_optimizations: {
    suggested_improvements: string[];
    potential_time_savings: number;
    optimization_score: number;
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'ai_analysis';
  status: 'pending' | 'running' | 'completed' | 'failed';
  execution_time_ms: number;
  error_rate: number;
  configuration: Record<string, any>;
}

interface AutomationMetrics {
  total_workflows: number;
  active_workflows: number;
  total_executions_today: number;
  success_rate: number;
  time_saved_today: number;
  cost_savings: number;
  ai_optimization_suggestions: number;
}

export const AutomationOrchestrator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);

  useEffect(() => {
    const loadAutomationData = () => {
      setTimeout(() => {
        setMetrics({
          total_workflows: 24,
          active_workflows: 18,
          total_executions_today: 1247,
          success_rate: 94.2,
          time_saved_today: 342,
          cost_savings: 15750,
          ai_optimization_suggestions: 7
        });

        setWorkflows([
          {
            id: '1',
            name: 'Lead Qualification & Routing',
            description: 'Automatically qualifies incoming leads and routes them to appropriate sales reps',
            category: 'sales',
            status: 'active',
            trigger_type: 'New Lead Created',
            complexity_score: 85,
            success_rate: 96.8,
            avg_execution_time: 45,
            executions_today: 127,
            last_execution: '2024-01-15T14:30:00Z',
            next_execution: 'On Trigger',
            steps: [
              {
                id: 'step1',
                name: 'Lead Data Analysis',
                type: 'ai_analysis',
                status: 'completed',
                execution_time_ms: 1200,
                error_rate: 2.1,
                configuration: { ai_model: 'lead_scoring_v2' }
              },
              {
                id: 'step2',
                name: 'Score Calculation',
                type: 'action',
                status: 'completed',
                execution_time_ms: 800,
                error_rate: 0.5,
                configuration: { scoring_rules: 'advanced' }
              },
              {
                id: 'step3',
                name: 'Route to Sales Rep',
                type: 'action',
                status: 'completed',
                execution_time_ms: 600,
                error_rate: 1.2,
                configuration: { routing_algorithm: 'intelligent_balanced' }
              }
            ],
            performance_metrics: {
              total_executions: 3240,
              success_count: 3135,
              error_count: 105,
              time_saved_minutes: 16200,
              roi_percentage: 340
            },
            ai_optimizations: {
              suggested_improvements: [
                'Add social media enrichment step',
                'Implement dynamic scoring weights',
                'Enable real-time rep availability checking'
              ],
              potential_time_savings: 25,
              optimization_score: 78
            }
          },
          {
            id: '2',
            name: 'Customer Onboarding Flow',
            description: 'Comprehensive automated onboarding process for new customers',
            category: 'operations',
            status: 'active',
            trigger_type: 'New Customer Signup',
            complexity_score: 92,
            success_rate: 89.4,
            avg_execution_time: 180,
            executions_today: 43,
            last_execution: '2024-01-15T13:45:00Z',
            next_execution: 'On Trigger',
            steps: [
              {
                id: 'step1',
                name: 'Welcome Email Sequence',
                type: 'action',
                status: 'completed',
                execution_time_ms: 2000,
                error_rate: 1.8,
                configuration: { email_template: 'welcome_v3' }
              },
              {
                id: 'step2',
                name: 'Account Setup Verification',
                type: 'condition',
                status: 'completed',
                execution_time_ms: 5000,
                error_rate: 4.2,
                configuration: { verification_steps: 'complete' }
              },
              {
                id: 'step3',
                name: 'Training Material Assignment',
                type: 'action',
                status: 'completed',
                execution_time_ms: 1500,
                error_rate: 0.9,
                configuration: { personalization: 'ai_based' }
              }
            ],
            performance_metrics: {
              total_executions: 1876,
              success_count: 1677,
              error_count: 199,
              time_saved_minutes: 9380,
              roi_percentage: 280
            },
            ai_optimizations: {
              suggested_improvements: [
                'Personalize training content based on user behavior',
                'Add progress tracking automation',
                'Implement smart reminder scheduling'
              ],
              potential_time_savings: 35,
              optimization_score: 72
            }
          },
          {
            id: '3',
            name: 'Inventory Reorder System',
            description: 'AI-powered inventory monitoring and automatic reordering',
            category: 'operations',
            status: 'active',
            trigger_type: 'Inventory Level Change',
            complexity_score: 78,
            success_rate: 98.1,
            avg_execution_time: 30,
            executions_today: 89,
            last_execution: '2024-01-15T14:15:00Z',
            next_execution: 'Continuous Monitoring',
            steps: [
              {
                id: 'step1',
                name: 'Stock Level Analysis',
                type: 'ai_analysis',
                status: 'completed',
                execution_time_ms: 800,
                error_rate: 0.3,
                configuration: { prediction_model: 'demand_forecast_v2' }
              },
              {
                id: 'step2',
                name: 'Supplier Availability Check',
                type: 'action',
                status: 'completed',
                execution_time_ms: 1200,
                error_rate: 1.1,
                configuration: { multi_supplier: true }
              },
              {
                id: 'step3',
                name: 'Purchase Order Creation',
                type: 'action',
                status: 'completed',
                execution_time_ms: 600,
                error_rate: 0.8,
                configuration: { auto_approval_threshold: 5000 }
              }
            ],
            performance_metrics: {
              total_executions: 2156,
              success_count: 2115,
              error_count: 41,
              time_saved_minutes: 10780,
              roi_percentage: 420
            },
            ai_optimizations: {
              suggested_improvements: [
                'Implement seasonal demand adjustments',
                'Add supplier performance scoring',
                'Enable dynamic pricing considerations'
              ],
              potential_time_savings: 20,
              optimization_score: 85
            }
          }
        ]);

        setLoading(false);
      }, 1200);
    };

    loadAutomationData();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales': return 'bg-green-100 text-green-800 border-green-200';
      case 'operations': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'support': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading automation orchestrator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Automation Orchestrator</h1>
            <p className="text-muted-foreground">
              Advanced workflow management and AI-powered automation
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Activity className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Zap className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Workflow className="h-4 w-4 text-blue-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Workflows</p>
                  <div className="flex items-baseline space-x-1">
                    <p className="text-2xl font-bold">{metrics.active_workflows}</p>
                    <p className="text-xs text-muted-foreground">/ {metrics.total_workflows}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Success Rate</p>
                  <p className="text-2xl font-bold">{metrics.success_rate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Time Saved Today</p>
                  <p className="text-2xl font-bold">{metrics.time_saved_today}m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Cost Savings</p>
                  <p className="text-2xl font-bold">${metrics.cost_savings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Workflow className="h-4 w-4" />
            <span>Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center space-x-3">
                        <span>{workflow.name}</span>
                        <Badge className={getCategoryColor(workflow.category)}>
                          {workflow.category}
                        </Badge>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="max-w-2xl">
                        {workflow.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={workflow.status === 'active'}
                        onCheckedChange={() => toggleWorkflowStatus(workflow.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">{workflow.success_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Executions Today</p>
                      <p className="text-2xl font-bold text-blue-600">{workflow.executions_today}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Avg Time</p>
                      <p className="text-2xl font-bold text-orange-600">{workflow.avg_execution_time}s</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">ROI</p>
                      <p className="text-2xl font-bold text-purple-600">{workflow.performance_metrics.roi_percentage}%</p>
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-3">Workflow Steps</h4>
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-500">
                                {index + 1}
                              </span>
                              {getStepStatusIcon(step.status)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{step.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {step.type.replace('_', ' ')} • {step.execution_time_ms}ms avg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Error Rate</p>
                            <p className="text-sm font-medium">{step.error_rate}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Optimizations */}
                  {workflow.ai_optimizations.suggested_improvements.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-sm text-blue-900">AI Optimization Suggestions</h4>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                          Score: {workflow.ai_optimizations.optimization_score}/100
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        {workflow.ai_optimizations.suggested_improvements.map((improvement, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex items-center space-x-2">
                            <Zap className="h-3 w-3 text-blue-600" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-blue-700 mt-2">
                        Potential time savings: {workflow.ai_optimizations.potential_time_savings}%
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Last execution: {new Date(workflow.last_execution).toLocaleString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Test Run
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-muted-foreground mb-6">
              Advanced performance monitoring and optimization recommendations.
            </p>
            <Button>
              View Performance Dashboard
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights & Recommendations</h3>
            <p className="text-muted-foreground mb-6">
              Machine learning powered automation insights and optimization suggestions.
            </p>
            <Button>
              Explore AI Insights
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Monitoring</h3>
            <p className="text-muted-foreground mb-6">
              Live monitoring of automation performance and system health.
            </p>
            <Button>
              Open Monitoring Dashboard
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};