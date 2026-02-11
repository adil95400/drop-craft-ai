import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Search, ShieldCheck, Zap, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const tldOptions = [
  { tld: '.store', price: '0,99 €', originalPrice: '14,99 €', popular: true, desc: 'Idéal e-commerce' },
  { tld: '.shop', price: '2,99 €', originalPrice: '19,99 €', popular: true, desc: 'Boutique en ligne' },
  { tld: '.com', price: '9,99 €', originalPrice: '12,99 €', popular: false, desc: 'Universel' },
  { tld: '.fr', price: '6,99 €', originalPrice: '9,99 €', popular: false, desc: 'France' },
  { tld: '.io', price: '29,99 €', originalPrice: '39,99 €', popular: false, desc: 'Tech / SaaS' },
  { tld: '.online', price: '1,99 €', originalPrice: '9,99 €', popular: false, desc: 'Présence web' },
];

const features = [
  { icon: ShieldCheck, title: 'SSL gratuit', desc: 'Certificat HTTPS inclus' },
  { icon: Zap, title: 'DNS ultra-rapide', desc: 'Propagation en < 5min' },
  { icon: Globe, title: 'Auto-connect', desc: 'Lié automatiquement à votre boutique' },
];

export default function DomainRegistrationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setSearched(true);
  };

  const handleRegister = (tld: string) => {
    toast.success(`Domaine "${searchQuery}${tld}" ajouté au panier`, {
      description: 'Finalisez votre commande dans la section facturation.',
    });
  };

  return (
    <ChannablePageWrapper
      title="Enregistrement de domaine"
      description="Obtenez un domaine .store gratuit la première année avec votre plan Pro+"
      actions={
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Offre spéciale
        </Badge>
      }
    >
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherchez votre nom de domaine idéal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" /> Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tldOptions.map((opt) => (
            <Card key={opt.tld} className={opt.popular ? 'border-primary ring-1 ring-primary/20' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {searchQuery}{opt.tld}
                  </CardTitle>
                  {opt.popular && <Badge>Populaire</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-primary">{opt.price}</span>
                  <span className="text-sm text-muted-foreground line-through">{opt.originalPrice}</span>
                  <span className="text-xs text-muted-foreground">/an</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
                  <CheckCircle2 className="h-3 w-3" /> Disponible
                </div>
                <Button className="w-full" size="sm" onClick={() => handleRegister(opt.tld)}>
                  Enregistrer <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  );
}
