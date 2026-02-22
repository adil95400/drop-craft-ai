/**
 * Carte des priorités IA - produits à optimiser en priorité
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Brain, Sparkles, Eye, ChevronRight, ImageOff } from 'lucide-react'
import { CockpitAIPriority } from '@/hooks/useCockpitData'

interface AIPrioritiesCardProps {
  priorities: CockpitAIPriority[]
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  seo: { label: 'SEO', color: 'bg-blue-500/10 text-blue-600' },
  content: { label: 'Contenu', color: 'bg-purple-500/10 text-purple-600' },
  pricing: { label: 'Prix', color: 'bg-yellow-500/10 text-yellow-600' },
  stock: { label: 'Stock', color: 'bg-green-500/10 text-green-600' },
}

export function AIPrioritiesCard({ priorities }: AIPrioritiesCardProps) {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? priorities : priorities.slice(0, 8)

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Priorités d'optimisation IA
            <Badge variant="secondary" className="ml-1">{priorities.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/products/ai-content')}>
            <Sparkles className="h-3.5 w-3.5" />
            Optimiser en masse
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {priorities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tous vos produits sont bien optimisés !</p>
          </div>
        ) : (
          <>
            <ScrollArea className={showAll ? "max-h-[400px]" : undefined}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {displayed.map(p => {
                  const cat = categoryLabels[p.category] || categoryLabels.content
                  const scoreColor = p.score >= 60 ? 'text-yellow-600' : 'text-destructive'

                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => navigate('/import/preview', {
                        state: {
                          product: {
                            title: p.name,
                            description: '',
                            price: 0,
                            images: p.image_url ? [p.image_url] : [],
                            category: p.category || '',
                            sku: p.sku || '',
                          },
                          returnTo: '/cockpit',
                        }
                      })}
                    >
                      <div className="flex items-start gap-2.5 mb-2">
                        {/* Thumbnail */}
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Progress value={p.score} className="h-1.5 flex-1" />
                        <span className={cn("text-xs font-bold", scoreColor)}>{p.score}</span>
                      </div>

                      {/* Issues */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", cat.color)}>
                          {cat.label}
                        </Badge>
                        {p.issues.slice(0, 2).map((issue, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                            {issue}
                          </Badge>
                        ))}
                        {p.issues.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{p.issues.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {priorities.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 gap-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Voir moins' : `Voir les ${priorities.length} produits`}
                <ChevronRight className={cn("h-4 w-4 transition-transform", showAll && "rotate-90")} />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
