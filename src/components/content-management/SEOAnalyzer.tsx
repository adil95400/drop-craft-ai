import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertTriangle, Search, 
  Link, Image, FileText, Type, Hash
} from 'lucide-react';

interface SEOAnalyzerProps {
  title: string;
  content: string;
  metaDescription?: string;
  focusKeyword?: string;
  url?: string;
}

interface SEOCheck {
  id: string;
  label: string;
  status: 'good' | 'warning' | 'error';
  message: string;
  icon: React.ElementType;
}

export function SEOAnalyzer({
  title,
  content,
  metaDescription = '',
  focusKeyword = '',
  url = ''
}: SEOAnalyzerProps) {
  const analysis = useMemo(() => {
    const checks: SEOCheck[] = [];
    let score = 0;
    const maxScore = 100;

    // Title length check
    const titleLength = title.length;
    if (titleLength === 0) {
      checks.push({
        id: 'title-empty',
        label: 'Titre',
        status: 'error',
        message: 'Le titre est vide',
        icon: Type
      });
    } else if (titleLength < 30) {
      checks.push({
        id: 'title-short',
        label: 'Titre',
        status: 'warning',
        message: `Titre trop court (${titleLength} car.). Visez 50-60 caractères.`,
        icon: Type
      });
      score += 5;
    } else if (titleLength > 60) {
      checks.push({
        id: 'title-long',
        label: 'Titre',
        status: 'warning',
        message: `Titre trop long (${titleLength} car.). Peut être tronqué dans les résultats.`,
        icon: Type
      });
      score += 8;
    } else {
      checks.push({
        id: 'title-good',
        label: 'Titre',
        status: 'good',
        message: `Longueur idéale (${titleLength} caractères)`,
        icon: Type
      });
      score += 15;
    }

    // Meta description check
    const metaLength = metaDescription.length;
    if (metaLength === 0) {
      checks.push({
        id: 'meta-empty',
        label: 'Meta Description',
        status: 'error',
        message: 'Meta description manquante',
        icon: FileText
      });
    } else if (metaLength < 120) {
      checks.push({
        id: 'meta-short',
        label: 'Meta Description',
        status: 'warning',
        message: `Meta description courte (${metaLength} car.). Visez 150-160 caractères.`,
        icon: FileText
      });
      score += 5;
    } else if (metaLength > 160) {
      checks.push({
        id: 'meta-long',
        label: 'Meta Description',
        status: 'warning',
        message: `Meta description trop longue (${metaLength} car.)`,
        icon: FileText
      });
      score += 8;
    } else {
      checks.push({
        id: 'meta-good',
        label: 'Meta Description',
        status: 'good',
        message: `Longueur idéale (${metaLength} caractères)`,
        icon: FileText
      });
      score += 15;
    }

    // Content length check
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 300) {
      checks.push({
        id: 'content-short',
        label: 'Longueur du contenu',
        status: 'warning',
        message: `Contenu court (${wordCount} mots). Visez au moins 300 mots.`,
        icon: FileText
      });
      score += 5;
    } else if (wordCount >= 1000) {
      checks.push({
        id: 'content-long',
        label: 'Longueur du contenu',
        status: 'good',
        message: `Excellent! ${wordCount} mots (contenu riche)`,
        icon: FileText
      });
      score += 20;
    } else {
      checks.push({
        id: 'content-medium',
        label: 'Longueur du contenu',
        status: 'good',
        message: `${wordCount} mots (longueur acceptable)`,
        icon: FileText
      });
      score += 15;
    }

    // Focus keyword check
    if (focusKeyword) {
      const keywordLower = focusKeyword.toLowerCase();
      const contentLower = content.toLowerCase();
      const titleLower = title.toLowerCase();
      
      const keywordInTitle = titleLower.includes(keywordLower);
      const keywordInContent = contentLower.includes(keywordLower);
      const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      const keywordDensity = (keywordCount / wordCount) * 100;

      if (!keywordInTitle) {
        checks.push({
          id: 'keyword-title',
          label: 'Mot-clé dans le titre',
          status: 'error',
          message: 'Le mot-clé focus n\'est pas dans le titre',
          icon: Search
        });
      } else {
        checks.push({
          id: 'keyword-title',
          label: 'Mot-clé dans le titre',
          status: 'good',
          message: 'Le mot-clé focus est présent dans le titre',
          icon: Search
        });
        score += 10;
      }

      if (keywordDensity < 0.5) {
        checks.push({
          id: 'keyword-density',
          label: 'Densité du mot-clé',
          status: 'warning',
          message: `Densité faible (${keywordDensity.toFixed(1)}%). Visez 1-2%.`,
          icon: Hash
        });
        score += 3;
      } else if (keywordDensity > 3) {
        checks.push({
          id: 'keyword-density',
          label: 'Densité du mot-clé',
          status: 'warning',
          message: `Densité élevée (${keywordDensity.toFixed(1)}%). Risque de sur-optimisation.`,
          icon: Hash
        });
        score += 5;
      } else {
        checks.push({
          id: 'keyword-density',
          label: 'Densité du mot-clé',
          status: 'good',
          message: `Densité optimale (${keywordDensity.toFixed(1)}%)`,
          icon: Hash
        });
        score += 10;
      }
    }

    // Headings check
    const hasH1 = content.includes('# ') || content.includes('<h1');
    const hasH2 = content.includes('## ') || content.includes('<h2');
    
    if (!hasH1 && !hasH2) {
      checks.push({
        id: 'headings',
        label: 'Structure des titres',
        status: 'warning',
        message: 'Ajoutez des sous-titres pour structurer le contenu',
        icon: Type
      });
      score += 3;
    } else {
      checks.push({
        id: 'headings',
        label: 'Structure des titres',
        status: 'good',
        message: 'Le contenu est bien structuré avec des titres',
        icon: Type
      });
      score += 10;
    }

    // Internal links check
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length +
                      (content.match(/<a\s+href/g) || []).length;
    
    if (linkCount === 0) {
      checks.push({
        id: 'links',
        label: 'Liens',
        status: 'warning',
        message: 'Aucun lien trouvé. Ajoutez des liens internes ou externes.',
        icon: Link
      });
    } else {
      checks.push({
        id: 'links',
        label: 'Liens',
        status: 'good',
        message: `${linkCount} lien(s) trouvé(s)`,
        icon: Link
      });
      score += 5;
    }

    // Images check
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length +
                       (content.match(/<img/g) || []).length;
    
    if (imageCount === 0 && wordCount > 300) {
      checks.push({
        id: 'images',
        label: 'Images',
        status: 'warning',
        message: 'Aucune image trouvée. Les images améliorent l\'engagement.',
        icon: Image
      });
    } else if (imageCount > 0) {
      checks.push({
        id: 'images',
        label: 'Images',
        status: 'good',
        message: `${imageCount} image(s) trouvée(s)`,
        icon: Image
      });
      score += 5;
    }

    // Normalize score
    const normalizedScore = Math.min(100, Math.round((score / maxScore) * 100));

    return { checks, score: normalizedScore };
  }, [title, content, metaDescription, focusKeyword]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'À améliorer';
    return 'Faible';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Analyse SEO
          </CardTitle>
          <Badge variant="outline" className={getScoreColor(analysis.score)}>
            {analysis.score}/100 - {getScoreLabel(analysis.score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={analysis.score} className="h-2" />

        <div className="space-y-2">
          {analysis.checks.map((check) => {
            const Icon = check.icon;
            const StatusIcon = 
              check.status === 'good' ? CheckCircle :
              check.status === 'warning' ? AlertTriangle : XCircle;
            const statusColor = 
              check.status === 'good' ? 'text-green-500' :
              check.status === 'warning' ? 'text-yellow-500' : 'text-red-500';

            return (
              <div key={check.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                <StatusIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${statusColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{check.label}</p>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
