import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Brain,
  Users,
  DollarSign
} from 'lucide-react';

interface RecommendedIntegration {
  id: string;
  name: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  roi_estimate: number;
  impact_score: number;
  confidence: number;
  reasons: string[];
  benefits: string[];
  estimated_setup_time: string;
  logo: string;
  color: string;
}

export function AIIntegrationRecommendations() {
  const [recommendations] = useState<RecommendedIntegration[]>([
    {
      id: '1',
      name: 'Shopify Plus',
      category: 'E-commerce',
      priority: 'high',
      roi_estimate: 340,
      impact_score: 95,
      confidence: 92,
      reasons: [
        'Votre croissance mensuelle de 23% nécessite une plateforme scalable',
        'Compatible avec vos 3 intégrations existantes',
        'Automatisation avancée disponible'
      ],
      benefits: [
        '+40% efficacité opérationnelle',
        'Automatisation complète des stocks',
        'Analytics prédictives intégrées'
      ],
      estimated_setup_time: '2-3 jours',
      logo: '🛍️',
      color: 'bg-success/10 text-success'
    },
    {
      id: '2',
      name: 'HubSpot CRM',
      category: 'CRM & Marketing',
      priority: 'high',
      roi_estimate: 280,
      impact_score: 88,
      confidence: 89,
      reasons: [
        'Gestion clients fragmentée détectée',
        'Potentiel d\'amélioration du taux de conversion',
        'Intégration native avec vos outils existants'
      ],
      benefits: [
        '+35% taux de conversion',
        'Automatisation marketing',
        'Scoring leads intelligent'
      ],
      estimated_setup_time: '1-2 jours',
      logo: '🎯',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: '3',
      name: 'Stripe Advanced',
      category: 'Paiements',
      priority: 'medium',
      roi_estimate: 150,
      impact_score: 75,
      confidence: 85,
      reasons: [
        'Optimisation des frais de transaction possible',
        'Détection de fraude améliorée nécessaire',
        'Support multi-devises requis'
      ],
      benefits: [
        '-12% frais de transaction',
        'Détection fraude IA',
        'Checkout optimisé'
      ],
      estimated_setup_time: '4-6 heures',
      logo: '💳',
      color: 'bg-info/10 text-blue-700'
    }
  ]);

  const [implementingIds, setImplementingIds] = useState<Set<string>>(new Set());

  const handleImplement = async (recommendation: RecommendedIntegration) => {
    setImplementingIds(prev => new Set([...prev, recommendation.id]));
    
    // Simulation de l'implémentation
    setTimeout(() => {
      setImplementingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recommendation.id);
        return newSet;
      });
    }, 3000);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Target className="w-4 h-4 text-destructive" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-warning" />;
      default: return <CheckCircle className="w-4 h-4 text-success" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-red-700 border-destructive/20';
      case 'medium': return 'bg-warning/10 text-yellow-700 border-warning/20';
      default: return 'bg-success/10 text-success border-success/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-info/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-info" />
            Recommandations IA d'Intégrations
          </CardTitle>
          <CardDescription>
            Notre IA analyse vos données et recommande les intégrations les plus impactantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{recommendations.length}</div>
              <p className="text-sm text-muted-foreground">Recommandations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                €{recommendations.reduce((sum, r) => sum + r.roi_estimate, 0)}k
              </div>
              <p className="text-sm text-muted-foreground">ROI Estimé/an</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
              </div>
              <p className="text-sm text-muted-foreground">Confiance IA</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {recommendations.filter(r => r.priority === 'high').length}
              </div>
              <p className="text-sm text-muted-foreground">Priorité Haute</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${recommendation.color}`}>
                    {recommendation.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{recommendation.name}</CardTitle>
                      <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                        {getPriorityIcon(recommendation.priority)}
                        <span className="ml-1 capitalize">{recommendation.priority}</span>
                      </Badge>
                    </div>
                    <CardDescription>{recommendation.category}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">{recommendation.impact_score}/100</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Score d'impact</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-success/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">ROI Annuel</span>
                  </div>
                  <div className="text-xl font-bold text-success">
                    +€{recommendation.roi_estimate}k
                  </div>
                </div>
                <div className="bg-info/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-info" />
                    <span className="text-sm font-medium">Confiance IA</span>
                  </div>
                  <div className="text-xl font-bold text-info">
                    {recommendation.confidence}%
                  </div>
                  <Progress value={recommendation.confidence} className="mt-1 h-1" />
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Temps Setup</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {recommendation.estimated_setup_time}
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-warning" />
                  Pourquoi cette recommandation ?
                </h4>
                <ul className="space-y-1">
                  {recommendation.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-info rounded-full flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Bénéfices attendus
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => handleImplement(recommendation)}
                  disabled={implementingIds.has(recommendation.id)}
                  className="flex-1"
                >
                  {implementingIds.has(recommendation.id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Implémentation...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Implémenter maintenant
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  Plus d'infos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}