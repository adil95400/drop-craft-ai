import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Activity,
  Smartphone,
  Palette,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnifiedDashboard = () => {
  const [metrics] = useState({
    revenue: { value: '$127K', change: '+23%', trend: 'up' },
    orders: { value: '2,847', change: '+18%', trend: 'up' },
    conversion: { value: '3.2%', change: '+0.4%', trend: 'up' },
    customers: { value: '18,329', change: '+12%', trend: 'up' }
  });

  const [aiInsights] = useState([
    {
      type: 'critical',
      title: 'Pricing Opportunity Detected',
      description: '23 products can increase prices by 8-12% based on demand analysis',
      action: 'Review Pricing',
      impact: '+$2.4K monthly'
    },
    {
      type: 'success',
      title: 'Automation Success',
      description: 'Dynamic pricing increased margins by 15% this week',
      action: 'Expand Rules',
      impact: '+$1.8K saved'
    },
    {
      type: 'info',
      title: 'Market Trend Alert',
      description: 'Seasonal demand spike predicted for "winter accessories"',
      action: 'Stock Check',
      impact: '2x demand expected'
    }
  ]);

  const [quickActions] = useState([
    { 
      icon: Brain, 
      title: 'AI Optimization', 
      description: 'Auto-optimize pricing & inventory', 
      link: '/ai-optimization',
      status: 'active'
    },
    { 
      icon: BarChart3, 
      title: 'Analytics Suite', 
      description: 'Advanced reporting & insights', 
      link: '/analytics',
      status: 'active'
    },
    { 
      icon: Zap, 
      title: 'Automation Hub', 
      description: 'Smart workflows & rules', 
      link: '/automation',
      status: 'active'
    },
    { 
      icon: Smartphone, 
      title: 'Mobile Apps', 
      description: 'iOS & Android development', 
      link: '/mobile-apps',
      status: 'beta'
    },
    { 
      icon: Palette, 
      title: 'Creative Studio', 
      description: 'AI-powered content creation', 
      link: '/creative-studio',
      status: 'new'
    },
    { 
      icon: Crown, 
      title: 'Competitive Edge', 
      description: 'Market positioning analysis', 
      link: '/competitive-advantage',
      status: 'premium'
    }
  ]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-green-500">New</Badge>;
      case 'beta': return <Badge className="bg-blue-500">Beta</Badge>;
      case 'premium': return <Badge className="bg-purple-500">Premium</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">Your complete e-commerce intelligence dashboard</p>
        </div>
        <Button>
          <Activity className="h-4 w-4 mr-2" />
          System Status
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.revenue.value}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.revenue.change} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.orders.value}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.orders.change} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversion.value}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.conversion.change} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customers.value}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.customers.change} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              AI Intelligence
            </CardTitle>
            <CardDescription>Smart insights and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {insight.impact}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                <Button size="sm" variant="outline">
                  {insight.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Access your most-used tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <action.icon className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(action.status)}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Real-time monitoring of all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">AI Engine</span>
                <span className="text-sm text-green-600">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Analytics</span>
                <span className="text-sm text-green-600">98.7%</span>
              </div>
              <Progress value={98.7} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Automation</span>
                <span className="text-sm text-green-600">99.2%</span>
              </div>
              <Progress value={99.2} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Sync Services</span>
                <span className="text-sm text-yellow-600">95.4%</span>
              </div>
              <Progress value={95.4} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};