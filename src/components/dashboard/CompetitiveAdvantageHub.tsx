import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Zap, Target, TrendingUp, Shield, Crown, Rocket } from 'lucide-react';

export const CompetitiveAdvantageHub = () => {
  const [advantages] = useState([
    {
      id: '1',
      title: 'AI-Powered Product Optimization',
      description: 'Automatic pricing, SEO, and inventory management',
      impact: 'High',
      status: 'Active',
      metrics: { conversion: '+23%', revenue: '+18%', efficiency: '+31%' }
    },
    {
      id: '2', 
      title: 'Real-time Market Intelligence',
      description: 'Live competitor tracking and trend analysis',
      impact: 'Critical',
      status: 'Active',
      metrics: { accuracy: '94%', speed: '2.3s', coverage: '250+ sources' }
    },
    {
      id: '3',
      title: 'Automated Decision Engine',
      description: 'Smart recommendations and autonomous actions',
      impact: 'High',
      status: 'Learning',
      metrics: { decisions: '1,247', success: '89%', time_saved: '18hrs/week' }
    }
  ]);

  const [marketPosition] = useState({
    overall_score: 8.7,
    innovation_lead: 12,
    feature_parity: 96,
    user_satisfaction: 4.8
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Learning': return 'bg-blue-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitive Advantage</h1>
          <p className="text-muted-foreground">Strategic advantages and market positioning</p>
        </div>
        <Button>
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Strategy
        </Button>
      </div>

      {/* Market Position Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marketPosition.overall_score}/10</div>
            <p className="text-xs text-muted-foreground">Above industry average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Innovation Lead</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{marketPosition.innovation_lead} months</div>
            <p className="text-xs text-muted-foreground">Ahead of competitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Parity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{marketPosition.feature_parity}%</div>
            <p className="text-xs text-muted-foreground">Market coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{marketPosition.user_satisfaction}/5</div>
            <p className="text-xs text-muted-foreground">User rating</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="advantages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="advantages">Key Advantages</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="roadmap">Strategic Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="advantages" className="space-y-4">
          <div className="grid gap-4">
            {advantages.map((advantage) => (
              <Card key={advantage.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{advantage.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(advantage.impact)}>
                        {advantage.impact} Impact
                      </Badge>
                      <Badge className={getStatusColor(advantage.status)}>
                        {advantage.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{advantage.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(advantage.metrics).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-primary">{value}</div>
                        <p className="text-sm text-muted-foreground capitalize">{key.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
              <CardDescription>How we stack against key competitors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">AI Features</span>
                    <span className="text-sm text-muted-foreground">Leading by 85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Automation Depth</span>
                    <span className="text-sm text-muted-foreground">Leading by 72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Integration Options</span>
                    <span className="text-sm text-muted-foreground">Leading by 91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Performance</span>
                    <span className="text-sm text-muted-foreground">Leading by 67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Development Roadmap</CardTitle>
              <CardDescription>Planned enhancements to maintain competitive edge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-4">
                  <h4 className="font-semibold">Q1 2024 - Advanced AI Integration</h4>
                  <p className="text-sm text-muted-foreground">Enhanced machine learning capabilities and predictive analytics</p>
                </div>
                <div className="border-l-2 border-green-500 pl-4">
                  <h4 className="font-semibold">Q2 2024 - Enterprise Features</h4>
                  <p className="text-sm text-muted-foreground">Advanced team collaboration and enterprise-grade security</p>
                </div>
                <div className="border-l-2 border-purple-500 pl-4">
                  <h4 className="font-semibold">Q3 2024 - Market Expansion</h4>
                  <p className="text-sm text-muted-foreground">International markets and multi-currency support</p>
                </div>
                <div className="border-l-2 border-orange-500 pl-4">
                  <h4 className="font-semibold">Q4 2024 - Innovation Hub</h4>
                  <p className="text-sm text-muted-foreground">Next-generation features and breakthrough technologies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};