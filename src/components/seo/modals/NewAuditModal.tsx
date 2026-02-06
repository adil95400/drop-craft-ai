/**
 * NewAuditModal — Refactoré sur BaseModal (socle)
 */
import { memo, useState, useCallback } from 'react';
import { BaseModal } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Globe, Map, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: { mode: string; base_url: string; sitemap_url?: string; max_urls: number; page_type_filters: string[] }) => void;
  isCreating: boolean;
}

const MODE_OPTIONS = [
  { value: 'single_url', label: 'URL unique', icon: Globe },
  { value: 'sitemap', label: 'Sitemap', icon: Map },
  { value: 'crawl', label: 'Crawl', icon: Compass },
];

function NewAuditModalComponent({ open, onOpenChange, onSubmit, isCreating }: NewAuditModalProps) {
  const [mode, setMode] = useState('single_url');
  const [url, setUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [maxUrls, setMaxUrls] = useState(200);

  const handleSubmit = useCallback(() => {
    if (!url.trim()) return;
    onSubmit({ mode, base_url: url, sitemap_url: sitemapUrl || undefined, max_urls: maxUrls, page_type_filters: ['product', 'category', 'blog', 'home'] });
    setUrl(''); setSitemapUrl('');
  }, [mode, url, sitemapUrl, maxUrls, onSubmit]);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvel Audit SEO"
      description="Configurez les paramètres d'analyse"
      primaryLabel="Lancer l'audit"
      primaryIcon={<Play className="h-4 w-4" />}
      onPrimary={handleSubmit}
      primaryDisabled={!url.trim()}
      primaryLoading={isCreating}
    >
      <div>
        <Label className="text-sm font-medium mb-2 block">Mode d'audit</Label>
        <div className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const selected = mode === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setMode(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center',
                  selected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                )}>
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>URL de base</Label>
        <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="h-10" />
      </div>
      {mode === 'sitemap' && (
        <div className="space-y-1.5">
          <Label>URL du sitemap</Label>
          <Input placeholder="https://example.com/sitemap.xml" value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} className="h-10" />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>URLs maximum</Label>
          <span className="text-sm font-semibold tabular-nums text-primary">{maxUrls}</span>
        </div>
        <Slider value={[maxUrls]} onValueChange={([v]) => setMaxUrls(v)} min={1} max={5000} step={50} />
        <div className="flex justify-between text-xs text-muted-foreground"><span>1</span><span>5 000</span></div>
      </div>
    </BaseModal>
  );
}

export const NewAuditModal = memo(NewAuditModalComponent);
