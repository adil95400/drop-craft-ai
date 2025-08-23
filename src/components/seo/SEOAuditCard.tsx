import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Clock
} from "lucide-react";

interface SEOAuditIssue {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  howToFix: string;
  impact: 'high' | 'medium' | 'low';
}

interface SEOAuditCardProps {
  url: string;
  score: number;
  issues: SEOAuditIssue[];
  lastAudited: Date;
  onReaudit: () => void;
  loading?: boolean;
}

export const SEOAuditCard: React.FC<SEOAuditCardProps> = ({
  url,
  score,
  issues,
  lastAudited,
  onReaudit,
  loading = false
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 80) return "bg-blue-50 border-blue-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    if (score >= 60) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return "bg-red-100 text-red-800 border-red-200";
      case 'warning': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'info': return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return "bg-red-100 text-red-800";
      case 'medium': return "bg-orange-100 text-orange-800";
      case 'low': return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const criticalIssues = issues.filter(issue => issue.type === 'critical');
  const warningIssues = issues.filter(issue => issue.type === 'warning');
  const infoIssues = issues.filter(issue => issue.type === 'info');

  return (
    <Card className={`transition-all duration-200 ${getScoreBgColor(score)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div>
                <div className="font-semibold truncate max-w-[300px]" title={url}>
                  {url}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Analysé il y a {Math.floor((new Date().getTime() - lastAudited.getTime()) / (1000 * 60))} min
                </div>
              </div>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onReaudit}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button size="sm" variant="outline">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score SEO</span>
            <span className="text-sm text-muted-foreground">{score}/100</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Résumé des problèmes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
            <div className="text-sm text-muted-foreground">Critiques</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{warningIssues.length}</div>
            <div className="text-sm text-muted-foreground">Avertissements</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-green-600">{infoIssues.length}</div>
            <div className="text-sm text-muted-foreground">Améliorations</div>
          </div>
        </div>

        {/* Liste des problèmes prioritaires */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Problèmes à corriger :</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {issues.slice(0, 5).map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getIssueColor(issue.type)} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIssueIcon(issue.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{issue.title}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getImpactColor(issue.impact)}`}
                        >
                          {issue.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      <details className="group">
                        <summary className="text-xs font-medium cursor-pointer text-primary hover:text-primary/80">
                          Comment corriger
                        </summary>
                        <p className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-primary/20">
                          {issue.howToFix}
                        </p>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {issues.length > 5 && (
              <Button variant="outline" size="sm" className="w-full">
                Voir tous les problèmes ({issues.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};