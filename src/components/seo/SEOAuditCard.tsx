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
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-info";
    if (score >= 70) return "text-warning";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-success/10 border-success/20";
    if (score >= 80) return "bg-info/10 border-info/20";
    if (score >= 70) return "bg-warning/10 border-warning/20";
    if (score >= 60) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-info" />;
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'warning': return "bg-warning/10 text-warning border-warning/20";
      case 'info': return "bg-info/10 text-info border-info/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return "bg-destructive/10 text-destructive";
      case 'medium': return "bg-warning/10 text-warning";
      case 'low': return "bg-success/10 text-success";
      default: return "bg-muted text-muted-foreground";
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
            <div className="text-2xl font-bold text-destructive">{criticalIssues.length}</div>
            <div className="text-sm text-muted-foreground">Critiques</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-warning">{warningIssues.length}</div>
            <div className="text-sm text-muted-foreground">Avertissements</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-success">{infoIssues.length}</div>
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