import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Globe, TrendingUp, AlertTriangle, Zap, Users, BarChart3, MapPin, Clock, Shield, Target } from 'lucide-react';

interface MarketInsight {
  id: string;
  region: string;
  country: string;
  market: string;
  opportunity_score: number;
  risk_level: 'low' | 'medium' | 'high';
  growth_potential: number;
  competition_density: number;
  regulatory_complexity: number;
  entry_barriers: string[];
  recommended_actions: string[];
  data_sources: string[];
  last_updated: string;
}

interface GlobalTrend {
  id: string;
  category: string;
  trend_name: string;
  impact_score: number;
  regions_affected: string[];
  timeline: 'short' | 'medium' | 'long';
  confidence_level: number;
  implications: string[];
  actionable_insights: string[];
  related_markets: string[];
}

interface ComplianceRequirement {
  id: string;
  jurisdiction: string;
  regulation_name: string;
  compliance_status: 'compliant' | 'pending' | 'non_compliant';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  requirements: string[];
  actions_needed: string[];
  estimated_cost: number;
  impact_assessment: string;
}

export const GlobalIntelligenceHub: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [globalTrends, setGlobalTrends] = useState<GlobalTrend[]>([]);
  const [complianceRequirements, setComplianceRequirements] = useState<ComplianceRequirement[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('global');

  useEffect(() => {
    const loadGlobalIntelligence = () => {
      // Simulate loading comprehensive global data
      setTimeout(() => {
        setMarketInsights([
          {
            id: '1',
            region: 'Europe',
            country: 'Germany',
            market: 'E-commerce',
            opportunity_score: 87,
            risk_level: 'low',
            growth_potential: 92,
            competition_density: 68,
            regulatory_complexity: 75,
            entry_barriers: ['GDPR Compliance', 'Local Payment Methods', 'Language Localization'],
            recommended_actions: [
              'Establish GDPR compliance framework',
              'Partner with local logistics providers',
              'Implement German language support',
              'Integrate popular payment methods (SEPA, Klarna)'
            ],
            data_sources: ['EU Trade Commission', 'German Federal Statistics Office', 'Market Research Firms'],
            last_updated: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            region: 'Asia-Pacific',
            country: 'Singapore',
            market: 'FinTech',
            opportunity_score: 94,
            risk_level: 'medium',
            growth_potential: 96,
            competition_density: 82,
            regulatory_complexity: 88,
            entry_barriers: ['MAS Licensing', 'High Competition', 'Regulatory Complexity'],
            recommended_actions: [
              'Obtain MAS licensing for financial services',
              'Develop partnerships with local banks',
              'Focus on niche market segments',
              'Invest in regulatory compliance team'
            ],
            data_sources: ['Monetary Authority of Singapore', 'ASEAN Economic Research', 'Local Market Analysis'],
            last_updated: '2024-01-15T11:15:00Z'
          }
        ]);

        setGlobalTrends([
          {
            id: '1',
            category: 'Technology',
            trend_name: 'AI-Powered Automation',
            impact_score: 95,
            regions_affected: ['North America', 'Europe', 'Asia-Pacific'],
            timeline: 'short',
            confidence_level: 92,
            implications: [
              'Increased demand for AI integration services',
              'Growing need for AI governance frameworks',
              'Skills gap in AI implementation'
            ],
            actionable_insights: [
              'Develop AI consulting services',
              'Create AI governance solutions',
              'Offer AI training and certification programs'
            ],
            related_markets: ['SaaS', 'Consulting', 'Education Technology']
          },
          {
            id: '2',
            category: 'Regulatory',
            trend_name: 'Global Privacy Regulations',
            impact_score: 88,
            regions_affected: ['Europe', 'North America', 'Asia-Pacific', 'Latin America'],
            timeline: 'medium',
            confidence_level: 89,
            implications: [
              'Increased compliance costs',
              'Need for privacy-by-design solutions',
              'Greater consumer trust requirements'
            ],
            actionable_insights: [
              'Develop privacy compliance automation',
              'Create transparent data handling processes',
              'Implement privacy-first product design'
            ],
            related_markets: ['Legal Tech', 'Security', 'Data Management']
          }
        ]);

        setComplianceRequirements([
          {
            id: '1',
            jurisdiction: 'European Union',
            regulation_name: 'GDPR (General Data Protection Regulation)',
            compliance_status: 'compliant',
            priority: 'critical',
            deadline: '2024-05-25',
            requirements: [
              'Data Protection Officer appointment',
              'Privacy impact assessments',
              'Data breach notification procedures',
              'User consent management'
            ],
            actions_needed: [
              'Annual compliance audit',
              'Update privacy policy',
              'Staff training on GDPR procedures'
            ],
            estimated_cost: 25000,
            impact_assessment: 'Critical for EU market operations'
          },
          {
            id: '2',
            jurisdiction: 'United States',
            regulation_name: 'CCPA (California Consumer Privacy Act)',
            compliance_status: 'pending',
            priority: 'high',
            deadline: '2024-03-15',
            requirements: [
              'Consumer rights disclosure',
              'Data inventory and mapping',
              'Opt-out mechanisms',
              'Third-party data sharing controls'
            ],
            actions_needed: [
              'Implement consumer request portal',
              'Update terms of service',
              'Create data deletion procedures'
            ],
            estimated_cost: 15000,
            impact_assessment: 'Required for California customers'
          }
        ]);

        setLoading(false);
      }, 1500);
    };

    loadGlobalIntelligence();
  }, [selectedRegion]);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Analyzing global intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Global Intelligence Hub</h1>
            <p className="text-muted-foreground">
              Worldwide market insights, trends, and compliance intelligence
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <MapPin className="h-3 w-3 mr-1" />
            Global Coverage
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Clock className="h-3 w-3 mr-1" />
            Real-time Updates
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Market Insights</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Global Trends</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Opportunities</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            {marketInsights.map((insight) => (
              <Card key={insight.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{insight.country} - {insight.market}</span>
                        <Badge className={getRiskBadgeColor(insight.risk_level)}>
                          {insight.risk_level} risk
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {insight.region} • Opportunity Score: {insight.opportunity_score}/100
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {insight.region}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Growth Potential</span>
                        <span className="text-sm text-muted-foreground">{insight.growth_potential}%</span>
                      </div>
                      <Progress value={insight.growth_potential} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Competition Density</span>
                        <span className="text-sm text-muted-foreground">{insight.competition_density}%</span>
                      </div>
                      <Progress value={insight.competition_density} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Regulatory Complexity</span>
                        <span className="text-sm text-muted-foreground">{insight.regulatory_complexity}%</span>
                      </div>
                      <Progress value={insight.regulatory_complexity} className="h-2" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Entry Barriers</h4>
                      <ul className="space-y-1">
                        {insight.entry_barriers.map((barrier, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{barrier}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Recommended Actions</h4>
                      <ul className="space-y-1">
                        {insight.recommended_actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <Zap className="h-3 w-3 text-green-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Data sources: {insight.data_sources.join(', ')}
                    </div>
                    <Button variant="outline" size="sm">
                      View Detailed Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6">
            {globalTrends.map((trend) => (
              <Card key={trend.id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{trend.trend_name}</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {trend.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Impact Score: {trend.impact_score}/100 • Confidence: {trend.confidence_level}%
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={trend.timeline === 'short' ? 'bg-red-100 text-red-800' : 
                               trend.timeline === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                               'bg-green-100 text-green-800'}
                    >
                      {trend.timeline}-term
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Regions Affected</h4>
                    <div className="flex flex-wrap gap-1">
                      {trend.regions_affected.map((region, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Market Implications</h4>
                      <ul className="space-y-1">
                        {trend.implications.map((implication, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{implication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Actionable Insights</h4>
                      <ul className="space-y-1">
                        {trend.actionable_insights.map((insight, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <Zap className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Related Markets: {trend.related_markets.join(', ')}
                    </div>
                    <Button variant="outline" size="sm">
                      Explore Trend
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6">
            {complianceRequirements.map((requirement) => (
              <Card key={requirement.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{requirement.regulation_name}</span>
                        <Badge className={getComplianceStatusColor(requirement.compliance_status)}>
                          {requirement.compliance_status.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {requirement.jurisdiction} • Deadline: {new Date(requirement.deadline).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getPriorityColor(requirement.priority)}>
                      {requirement.priority} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {requirement.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <Shield className="h-3 w-3 text-blue-500" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Actions Needed</h4>
                      <ul className="space-y-1">
                        {requirement.actions_needed.map((action, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <Users className="h-3 w-3 text-orange-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Impact Assessment:</strong> {requirement.impact_assessment}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Estimated Cost:</strong> ${requirement.estimated_cost.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      View Compliance Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Global Opportunities Analysis</h3>
            <p className="text-muted-foreground mb-6">
              Advanced opportunity scoring and market entry recommendations coming soon.
            </p>
            <Button>
              Request Early Access
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};