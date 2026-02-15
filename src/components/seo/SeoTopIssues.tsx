/**
 * Sprint 8: Top SEO Issues Card
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const ISSUE_LABELS: Record<string, string> = {
  title_missing: 'Titre manquant',
  title_short: 'Titre trop court',
  title_long: 'Titre trop long',
  title_spam: 'Titre spammeux',
  title_repetitive: 'Titre répétitif',
  desc_missing: 'Description manquante',
  desc_short: 'Description courte',
  desc_very_short: 'Description très courte',
  desc_same_as_title: 'Description = Titre',
  meta_title_missing: 'Meta titre manquant',
  meta_title_long: 'Meta titre trop long',
  meta_desc_missing: 'Meta description manquante',
  meta_desc_long: 'Meta description longue',
  no_images: 'Aucune image',
  missing_alt: 'Alt texte manquant',
  no_price: 'Prix non défini',
};

interface Props {
  topIssues: { rule: string; count: number }[];
}

export default function SeoTopIssues({ topIssues }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Problèmes les plus fréquents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun problème détecté 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {topIssues.slice(0, 8).map((issue, i) => (
              <div key={issue.rule} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{ISSUE_LABELS[issue.rule] || issue.rule}</span>
                <Badge variant="secondary" className="text-xs">
                  {issue.count} produit{issue.count > 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
