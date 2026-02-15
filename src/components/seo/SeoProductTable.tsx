/**
 * Sprint 8: SEO Product Score Table
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { type ProductSeoScore } from '@/hooks/useSeoDashboard';
import { Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const gradeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  A: 'default',
  B: 'default',
  C: 'secondary',
  D: 'destructive',
  F: 'destructive',
};

interface Props {
  products: ProductSeoScore[];
}

export default function SeoProductTable({ products }: Props) {
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = products
    .filter(p => p.product_title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'asc'
      ? a.result.overall_score - b.result.overall_score
      : b.result.overall_score - a.result.overall_score
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Scores par produit</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-48"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              Score {sortDir === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[480px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Produit</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Titre</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Meta</TableHead>
                <TableHead className="text-center">Images</TableHead>
                <TableHead className="text-center">Problèmes</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <>
                    <TableRow
                      key={p.product_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpanded(expanded === p.product_id ? null : p.product_id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.product_image && (
                            <img
                              src={p.product_image}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                              loading="lazy"
                            />
                          )}
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {p.product_title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{p.result.overall_score}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={gradeVariant[p.result.grade]}>{p.result.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{p.result.categories.title.score}</TableCell>
                      <TableCell className="text-center text-sm">{p.result.categories.description.score}</TableCell>
                      <TableCell className="text-center text-sm">{p.result.categories.meta.score}</TableCell>
                      <TableCell className="text-center text-sm">{p.result.categories.images.score}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {p.result.issues.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expanded === p.product_id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>

                    {expanded === p.product_id && (
                      <TableRow key={`${p.product_id}-detail`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Issues */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Problèmes ({p.result.issues.length})</h4>
                              {p.result.issues.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Aucun problème ✓</p>
                              ) : (
                                <ul className="space-y-1">
                                  {p.result.issues.map((issue, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <Badge
                                        variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                                        className="text-[10px] px-1 py-0 mt-0.5"
                                      >
                                        {issue.severity}
                                      </Badge>
                                      <span>{issue.message}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Recommendations */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Recommandations</h4>
                              {p.result.recommendations.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Tout est optimisé ✓</p>
                              ) : (
                                <ul className="space-y-1">
                                  {p.result.recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                                        {rec.impact}
                                      </Badge>
                                      <span>{rec.message}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
