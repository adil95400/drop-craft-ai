import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAIEnrichment, type EnrichLanguage, type EnrichTone } from '@/hooks/useAIEnrichment'
import {
  Sparkles, Loader2, CheckCircle2, AlertTriangle, Clock, Wand2, Globe, MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface AIEnrichmentPanelProps {
  selectedProductIds: string[]
  onComplete?: () => void
}

const LANGUAGES: { value: EnrichLanguage; label: string }[] = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'nl', label: '🇳🇱 Nederlands' },
]

const TONES: { value: EnrichTone; label: string; description: string }[] = [
  { value: 'professionnel', label: 'Professionnel', description: 'Sérieux et fiable' },
  { value: 'créatif', label: 'Créatif', description: 'Engageant et original' },
  { value: 'luxe', label: 'Luxe', description: 'Premium et exclusif' },
  { value: 'décontracté', label: 'Décontracté', description: 'Friendly et accessible' },
  { value: 'technique', label: 'Technique', description: 'Précis et détaillé' },
]

export default function AIEnrichmentPanel({ selectedProductIds, onComplete }: AIEnrichmentPanelProps) {
  const locale = useDateFnsLocale()
  const { jobs, activeJob, isEnriching, enrich } = useAIEnrichment()
  const [language, setLanguage] = useState<EnrichLanguage>('fr')
  const [tone, setTone] = useState<EnrichTone>('professionnel')

  const handleEnrich = () => {
    if (selectedProductIds.length === 0) return
    enrich({ productIds: selectedProductIds, language, tone })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': case 'processing': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>
      case 'completed': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Terminé</Badge>
      case 'failed': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Échoué</Badge>
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Enrichissement IA automatique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Langue
            </label>
            <Select value={language} onValueChange={(v) => setLanguage(v as EnrichLanguage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Ton
            </label>
            <Select value={tone} onValueChange={(v) => setTone(v as EnrichTone)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — <span className="text-muted-foreground">{t.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action */}
        <Button
          onClick={handleEnrich}
          disabled={isEnriching || selectedProductIds.length === 0}
          className="w-full"
        >
          {isEnriching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          Enrichir {selectedProductIds.length} produit(s) avec l'IA
        </Button>

        {selectedProductIds.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Sélectionnez des produits pour activer l'enrichissement
          </p>
        )}

        {/* Active job progress */}
        {activeJob && (activeJob.status === 'running' || activeJob.status === 'processing') && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Enrichissement en cours...</span>
              <span className="text-muted-foreground">{activeJob.progress_percent || 0}%</span>
            </div>
            <Progress value={activeJob.progress_percent || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">{activeJob.progress_message}</p>
          </div>
        )}

        {/* Recent jobs */}
        {jobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Historique</h4>
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  <span className="text-xs text-muted-foreground">
                    {(job.processed_items || 0) - (job.failed_items || 0)}/{job.total_items || 0} enrichis
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
