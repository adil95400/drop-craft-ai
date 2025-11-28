/**
 * Panneau d'audit complet pour un produit
 * Affiche les scores, issues, et actions recommandées
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProductAuditResult } from '@/types/audit';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Sparkles, 
  Image as ImageIcon,
  FileText,
  Database,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductAuditPanelProps {
  auditResult: ProductAuditResult;
  onAIAction?: (action: string) => void;
}

export function ProductAuditPanel({ auditResult, onAIAction }: ProductAuditPanelProps) {
  const { score, issues, strengths } = auditResult;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo':
        return <Target className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'images':
        return <ImageIcon className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'ai':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');
  const infoIssues = issues.filter(i => i.severity === 'info');

  return (
    <div className="space-y-6">
      {/* Score global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Score de Qualité Global</span>
            <span className={cn('text-4xl font-bold', getScoreColor(score.global))}>
              {Math.round(score.global)}/100
            </span>
          </CardTitle>
          <CardDescription>
            {score.global >= 70 && 'Excellent ! Produit bien optimisé.'}
            {score.global >= 40 && score.global < 70 && 'Bon, mais des améliorations sont possibles.'}
            {score.global < 40 && 'Attention ! Des optimisations critiques sont nécessaires.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scores détaillés */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  SEO
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(score.seo)}/100</span>
              </div>
              <Progress value={score.seo} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contenu
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(score.content)}/100</span>
              </div>
              <Progress value={score.content} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(score.images)}/100</span>
              </div>
              <Progress value={score.images} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Complétude Données
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(score.dataCompleteness)}/100</span>
              </div>
              <Progress value={score.dataCompleteness} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Shopping Readiness
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(score.aiReadiness)}/100</span>
              </div>
              <Progress value={score.aiReadiness} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points forts */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Issues critiques */}
      {criticalIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Problèmes Critiques ({criticalIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getCategoryIcon(issue.category)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.message}</p>
                    {issue.recommendation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 {issue.recommendation}
                      </p>
                    )}
                    {issue.field && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Champ: {issue.field}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Issues warnings */}
      {warningIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Améliorations Recommandées ({warningIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warningIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getCategoryIcon(issue.category)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.message}</p>
                    {issue.recommendation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 {issue.recommendation}
                      </p>
                    )}
                    {issue.field && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Champ: {issue.field}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions IA rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Actions IA Recommandées
          </CardTitle>
          <CardDescription>
            Corrigez rapidement les problèmes détectés avec l'IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAIAction?.('rewrite-title')}
              disabled={!issues.some(i => i.field === 'name')}
            >
              Corriger le titre avec l'IA
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAIAction?.('rewrite-description')}
              disabled={!issues.some(i => i.field === 'description')}
            >
              Réécrire la description
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAIAction?.('complete-attributes')}
              disabled={!issues.some(i => i.category === 'data')}
            >
              Compléter les attributs
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAIAction?.('generate-metas')}
              disabled={!issues.some(i => i.category === 'seo')}
            >
              Générer metas SEO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
