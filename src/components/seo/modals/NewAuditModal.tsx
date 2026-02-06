import { memo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, RefreshCw, Globe, Map, Compass } from 'lucide-react';

interface NewAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    mode: string;
    base_url: string;
    sitemap_url?: string;
    max_urls: number;
    page_type_filters: string[];
  }) => void;
  isCreating: boolean;
}

const MODE_OPTIONS = [
  { value: 'single_url', label: 'URL unique', desc: 'Analyser une seule page', icon: Globe },
  { value: 'sitemap', label: 'Sitemap', desc: 'Analyser toutes les URLs du sitemap', icon: Map },
  { value: 'crawl', label: 'Crawl complet', desc: 'Parcourir le site en suivant les liens', icon: Compass },
];

function NewAuditModalComponent({ open, onOpenChange, onSubmit, isCreating }: NewAuditModalProps) {
  const [mode, setMode] = useState('single_url');
  const [url, setUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [maxUrls, setMaxUrls] = useState(200);

  const handleSubmit = useCallback(() => {
    if (!url.trim()) return;
    onSubmit({
      mode,
      base_url: url,
      sitemap_url: sitemapUrl || undefined,
      max_urls: maxUrls,
      page_type_filters: ['product', 'category', 'blog', 'home'],
    });
    setUrl('');
    setSitemapUrl('');
  }, [mode, url, sitemapUrl, maxUrls, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel Audit SEO</DialogTitle>
          <DialogDescription>Configurez les paramètres d'analyse</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Mode selection cards */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Mode d'audit</Label>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMode(opt.value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center
                      ${selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>URL de base</Label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10"
            />
          </div>

          {mode === 'sitemap' && (
            <div className="space-y-1.5">
              <Label>URL du sitemap</Label>
              <Input
                placeholder="https://example.com/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>URLs maximum</Label>
              <span className="text-sm font-semibold tabular-nums text-primary">{maxUrls}</span>
            </div>
            <Slider
              value={[maxUrls]}
              onValueChange={([v]) => setMaxUrls(v)}
              min={1}
              max={5000}
              step={50}
              className="mt-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span><span>5 000</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !url.trim()}>
            {isCreating ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Lancement…</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Lancer l'audit</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const NewAuditModal = memo(NewAuditModalComponent);
