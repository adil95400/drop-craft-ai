import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Shield, Calculator, FileText, Globe, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LegalCompliancePage = () => {
  const { toast } = useToast();
  const [vatCountry, setVatCountry] = useState('FR');
  const [vatAmount, setVatAmount] = useState('100');
  const [vatRateType, setVatRateType] = useState<'standard' | 'reduced'>('standard');
  const [vatResult, setVatResult] = useState<any>(null);
  const [ossAnnualSales, setOssAnnualSales] = useState('');
  const [ossResult, setOssResult] = useState<any>(null);
  const [vatNumber, setVatNumber] = useState('');
  const [vatValidation, setVatValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateVat = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vat-calculator', {
        body: { action: 'calculate', country_code: vatCountry, amount: parseFloat(vatAmount), rate_type: vatRateType },
      });
      if (error) throw error;
      setVatResult(data);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkOss = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vat-calculator', {
        body: { action: 'check-oss-threshold', annual_eu_sales: parseFloat(ossAnnualSales), seller_country: 'FR' },
      });
      if (error) throw error;
      setOssResult(data);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const validateVatNumber = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vat-calculator', {
        body: { action: 'validate-vat-number', vat_number: vatNumber },
      });
      if (error) throw error;
      setVatValidation(data);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const EU_COUNTRIES = [
    { code: 'AT', name: 'Autriche' }, { code: 'BE', name: 'Belgique' }, { code: 'BG', name: 'Bulgarie' },
    { code: 'HR', name: 'Croatie' }, { code: 'CY', name: 'Chypre' }, { code: 'CZ', name: 'Tchéquie' },
    { code: 'DK', name: 'Danemark' }, { code: 'EE', name: 'Estonie' }, { code: 'FI', name: 'Finlande' },
    { code: 'FR', name: 'France' }, { code: 'DE', name: 'Allemagne' }, { code: 'GR', name: 'Grèce' },
    { code: 'HU', name: 'Hongrie' }, { code: 'IE', name: 'Irlande' }, { code: 'IT', name: 'Italie' },
    { code: 'LV', name: 'Lettonie' }, { code: 'LT', name: 'Lituanie' }, { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malte' }, { code: 'NL', name: 'Pays-Bas' }, { code: 'PL', name: 'Pologne' },
    { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Roumanie' }, { code: 'SK', name: 'Slovaquie' },
    { code: 'SI', name: 'Slovénie' }, { code: 'ES', name: 'Espagne' }, { code: 'SE', name: 'Suède' },
    { code: 'GB', name: 'Royaume-Uni' }, { code: 'CH', name: 'Suisse' }, { code: 'NO', name: 'Norvège' },
  ];

  return (
    <ChannablePageWrapper
      title="Conformité légale"
      description="RGPD, TVA/OSS, et conformité réglementaire pour le e-commerce"
    >
      <Tabs defaultValue="vat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vat" className="gap-2"><Calculator className="h-4 w-4" />Calculateur TVA</TabsTrigger>
          <TabsTrigger value="oss" className="gap-2"><Globe className="h-4 w-4" />OSS/IOSS</TabsTrigger>
          <TabsTrigger value="gdpr" className="gap-2"><Shield className="h-4 w-4" />RGPD</TabsTrigger>
          <TabsTrigger value="legal" className="gap-2"><FileText className="h-4 w-4" />Documents</TabsTrigger>
        </TabsList>

        {/* VAT Calculator */}
        <TabsContent value="vat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Calculateur TVA multi-pays</CardTitle>
                <CardDescription>Calculez la TVA applicable selon le pays de destination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pays de destination</Label>
                  <Select value={vatCountry} onValueChange={setVatCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EU_COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant HT (€)</Label>
                  <Input type="number" value={vatAmount} onChange={e => setVatAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type de taux</Label>
                  <Select value={vatRateType} onValueChange={(v: 'standard' | 'reduced') => setVatRateType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Taux standard</SelectItem>
                      <SelectItem value="reduced">Taux réduit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calculateVat} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Calculer la TVA
                </Button>
              </CardContent>
            </Card>

            {vatResult && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Résultat — {vatResult.country}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Montant HT</span><span className="font-semibold">{vatResult.net_amount} €</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taux TVA ({vatResult.rate_type})</span><Badge variant="secondary">{vatResult.vat_rate}%</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Montant TVA</span><span className="font-semibold text-primary">{vatResult.vat_amount} €</span></div>
                  <hr />
                  <div className="flex justify-between text-lg"><span className="font-bold">Total TTC</span><span className="font-bold text-primary">{vatResult.total_with_vat} €</span></div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* VAT Number Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Validation numéro de TVA</CardTitle>
              <CardDescription>Vérifiez le format d'un numéro de TVA intracommunautaire</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label>Numéro de TVA</Label>
                <Input placeholder="FR12345678901" value={vatNumber} onChange={e => setVatNumber(e.target.value)} />
              </div>
              <Button onClick={validateVatNumber} disabled={loading || !vatNumber}>Valider</Button>
              {vatValidation && (
                <div className="flex items-center gap-2">
                  {vatValidation.valid_format ? (
                    <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Format valide</Badge>
                  ) : (
                    <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Format invalide</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OSS/IOSS */}
        <TabsContent value="oss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Vérification seuil OSS</CardTitle>
              <CardDescription>Le guichet unique (OSS) s'applique au-delà de 10 000 € de ventes B2C intra-UE annuelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ventes B2C intra-UE annuelles (€)</Label>
                <Input type="number" placeholder="Ex: 15000" value={ossAnnualSales} onChange={e => setOssAnnualSales(e.target.value)} />
              </div>
              <Button onClick={checkOss} disabled={loading || !ossAnnualSales}>Vérifier le seuil</Button>
              {ossResult && (
                <Card className={ossResult.exceeds_threshold ? 'border-destructive/50 bg-destructive/5' : 'border-green-500/50 bg-green-500/5'}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {ossResult.exceeds_threshold ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold">
                        {ossResult.exceeds_threshold ? 'Seuil dépassé — OSS obligatoire' : 'Sous le seuil — OSS optionnel'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ossResult.recommendation}</p>
                    <div className="flex gap-4 text-sm">
                      <span>Ventes : <strong>{ossResult.annual_eu_sales.toLocaleString()} €</strong></span>
                      <span>Seuil : <strong>{ossResult.oss_threshold.toLocaleString()} €</strong></span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IOSS — Import One-Stop Shop</CardTitle>
              <CardDescription>Pour les envois importés de valeur ≤ 150 € depuis des pays hors UE</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Le système IOSS permet de collecter la TVA au moment de l'achat pour les colis ≤ 150 €.</p>
                <p>• Les colis transitent en douane sans TVA additionnelle pour l'acheteur.</p>
                <p>• Inscription obligatoire dans un État membre de l'UE (ou via intermédiaire fiscal).</p>
                <p>• Les taux TVA du pays de destination s'appliquent.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR */}
        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold">Bandeau cookies</h3>
                <Badge className="bg-green-500/10 text-green-600">Actif</Badge>
                <p className="text-xs text-muted-foreground">Consentement granulaire (nécessaire, analytique, performance)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold">Export des données</h3>
                <Badge className="bg-green-500/10 text-green-600">Actif</Badge>
                <p className="text-xs text-muted-foreground">Droit d'accès — export JSON complet</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold">Anonymisation</h3>
                <Badge className="bg-green-500/10 text-green-600">Actif</Badge>
                <p className="text-xs text-muted-foreground">Droit à l'oubli — anonymisation client</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registre de traitement</CardTitle>
              <CardDescription>Traitements de données personnelles identifiés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Gestion des commandes', basis: 'Exécution contractuelle', retention: '5 ans' },
                  { name: 'Marketing & newsletters', basis: 'Consentement', retention: '3 ans' },
                  { name: 'Analyse de performance', basis: 'Intérêt légitime', retention: '26 mois' },
                  { name: 'Support client', basis: 'Exécution contractuelle', retention: '3 ans' },
                  { name: 'Facturation', basis: 'Obligation légale', retention: '10 ans' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-sm">{t.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{t.basis}</Badge>
                      <Badge variant="secondary">{t.retention}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Documents */}
        <TabsContent value="legal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Conditions Générales de Vente', path: '/cgv', status: 'active', icon: FileText },
              { title: 'Conditions Générales d\'Utilisation', path: '/cgu', status: 'active', icon: FileText },
              { title: 'Politique de Confidentialité', path: '/privacy', status: 'active', icon: Shield },
              { title: 'Mentions Légales', path: '/legal', status: 'active', icon: FileText },
            ].map((doc, i) => (
              <Card key={i}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <doc.icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.path}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">Publié</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default LegalCompliancePage;
