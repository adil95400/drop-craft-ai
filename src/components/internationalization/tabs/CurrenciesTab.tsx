import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Plus, RefreshCw, Search, ArrowRightLeft, Star, Trash2 } from "lucide-react";
import { useInternationalization } from "@/hooks/useInternationalization";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_CURRENCIES = [
  { code: "USD", name: "Dollar américain", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "Livre sterling", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Yen japonais", symbol: "¥", flag: "🇯🇵" },
  { code: "CHF", name: "Franc suisse", symbol: "CHF", flag: "🇨🇭" },
  { code: "CAD", name: "Dollar canadien", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Dollar australien", symbol: "A$", flag: "🇦🇺" },
  { code: "CNY", name: "Yuan chinois", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Roupie indienne", symbol: "₹", flag: "🇮🇳" },
  { code: "BRL", name: "Réal brésilien", symbol: "R$", flag: "🇧🇷" },
  { code: "KRW", name: "Won sud-coréen", symbol: "₩", flag: "🇰🇷" },
  { code: "MXN", name: "Peso mexicain", symbol: "MX$", flag: "🇲🇽" },
  { code: "SGD", name: "Dollar de Singapour", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Dollar de Hong Kong", symbol: "HK$", flag: "🇭🇰" },
  { code: "NOK", name: "Couronne norvégienne", symbol: "kr", flag: "🇳🇴" },
  { code: "SEK", name: "Couronne suédoise", symbol: "kr", flag: "🇸🇪" },
  { code: "DKK", name: "Couronne danoise", symbol: "kr", flag: "🇩🇰" },
  { code: "NZD", name: "Dollar néo-zélandais", symbol: "NZ$", flag: "🇳🇿" },
  { code: "ZAR", name: "Rand sud-africain", symbol: "R", flag: "🇿🇦" },
  { code: "TRY", name: "Livre turque", symbol: "₺", flag: "🇹🇷" },
  { code: "RUB", name: "Rouble russe", symbol: "₽", flag: "🇷🇺" },
  { code: "PLN", name: "Złoty polonais", symbol: "zł", flag: "🇵🇱" },
  { code: "THB", name: "Baht thaïlandais", symbol: "฿", flag: "🇹🇭" },
  { code: "IDR", name: "Roupie indonésienne", symbol: "Rp", flag: "🇮🇩" },
  { code: "MYR", name: "Ringgit malaisien", symbol: "RM", flag: "🇲🇾" },
  { code: "PHP", name: "Peso philippin", symbol: "₱", flag: "🇵🇭" },
  { code: "CZK", name: "Couronne tchèque", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Forint hongrois", symbol: "Ft", flag: "🇭🇺" },
  { code: "ILS", name: "Shekel israélien", symbol: "₪", flag: "🇮🇱" },
  { code: "CLP", name: "Peso chilien", symbol: "CL$", flag: "🇨🇱" },
  { code: "AED", name: "Dirham des EAU", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", name: "Riyal saoudien", symbol: "﷼", flag: "🇸🇦" },
  { code: "TWD", name: "Dollar taïwanais", symbol: "NT$", flag: "🇹🇼" },
  { code: "ARS", name: "Peso argentin", symbol: "AR$", flag: "🇦🇷" },
  { code: "COP", name: "Peso colombien", symbol: "CO$", flag: "🇨🇴" },
  { code: "EGP", name: "Livre égyptienne", symbol: "E£", flag: "🇪🇬" },
  { code: "NGN", name: "Naira nigérian", symbol: "₦", flag: "🇳🇬" },
  { code: "VND", name: "Đồng vietnamien", symbol: "₫", flag: "🇻🇳" },
  { code: "RON", name: "Leu roumain", symbol: "lei", flag: "🇷🇴" },
  { code: "BGN", name: "Lev bulgare", symbol: "лв", flag: "🇧🇬" },
  { code: "HRK", name: "Kuna croate", symbol: "kn", flag: "🇭🇷" },
  { code: "MAD", name: "Dirham marocain", symbol: "MAD", flag: "🇲🇦" },
  { code: "KWD", name: "Dinar koweïtien", symbol: "د.ك", flag: "🇰🇼" },
  { code: "QAR", name: "Riyal qatari", symbol: "﷼", flag: "🇶🇦" },
  { code: "BHD", name: "Dinar bahreïni", symbol: "BD", flag: "🇧🇭" },
  { code: "OMR", name: "Rial omanais", symbol: "﷼", flag: "🇴🇲" },
  { code: "JOD", name: "Dinar jordanien", symbol: "JD", flag: "🇯🇴" },
  { code: "PKR", name: "Roupie pakistanaise", symbol: "₨", flag: "🇵🇰" },
  { code: "BDT", name: "Taka bangladais", symbol: "৳", flag: "🇧🇩" },
  { code: "LKR", name: "Roupie sri-lankaise", symbol: "Rs", flag: "🇱🇰" },
  { code: "KES", name: "Shilling kényan", symbol: "KSh", flag: "🇰🇪" },
  { code: "GHS", name: "Cedi ghanéen", symbol: "₵", flag: "🇬🇭" },
  { code: "TND", name: "Dinar tunisien", symbol: "DT", flag: "🇹🇳" },
  { code: "DZD", name: "Dinar algérien", symbol: "DA", flag: "🇩🇿" },
  { code: "PEN", name: "Sol péruvien", symbol: "S/.", flag: "🇵🇪" },
  { code: "UAH", name: "Hryvnia ukrainienne", symbol: "₴", flag: "🇺🇦" },
  { code: "XOF", name: "Franc CFA (BCEAO)", symbol: "CFA", flag: "🌍" },
  { code: "XAF", name: "Franc CFA (BEAC)", symbol: "FCFA", flag: "🌍" },
];

// Mock exchange rates for demo
const MOCK_RATES: Record<string, number> = {
  USD: 1.0, EUR: 0.92, GBP: 0.79, JPY: 149.5, CHF: 0.88, CAD: 1.36,
  AUD: 1.53, CNY: 7.24, INR: 83.12, BRL: 4.97, KRW: 1320, MXN: 17.15,
  SGD: 1.34, HKD: 7.82, NOK: 10.52, SEK: 10.38, DKK: 6.87, NZD: 1.63,
  ZAR: 18.85, TRY: 28.95, RUB: 92.5, PLN: 4.02, THB: 35.2, IDR: 15650,
  MYR: 4.68, PHP: 55.8, CZK: 22.5, HUF: 355, ILS: 3.72, CLP: 880,
  AED: 3.67, SAR: 3.75, TWD: 31.5, ARS: 350, COP: 3950, EGP: 30.9,
  NGN: 780, VND: 24500, RON: 4.56, BGN: 1.8, HRK: 6.95, MAD: 10.05,
};

export const CurrenciesTab = () => {
  const { useCurrencies, updateCurrencyRates, createCurrency, setDefaultCurrency } = useInternationalization();
  const { data: currencies, isLoading } = useCurrencies();

  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [converterAmount, setConverterAmount] = useState("100");
  const [converterFrom, setConverterFrom] = useState("EUR");
  const [converterTo, setConverterTo] = useState("USD");

  const activeCodes = new Set((currencies || []).map((c: any) => c.currency_code));
  
  const filteredForAdd = useMemo(() => 
    ALL_CURRENCIES.filter(c => 
      !activeCodes.has(c.code) && 
      (c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    ), [search, activeCodes]);

  const convertedAmount = useMemo(() => {
    const fromRate = MOCK_RATES[converterFrom] || 1;
    const toRate = MOCK_RATES[converterTo] || 1;
    return ((parseFloat(converterAmount) || 0) / fromRate * toRate).toFixed(2);
  }, [converterAmount, converterFrom, converterTo]);

  const handleAddCurrency = (cur: typeof ALL_CURRENCIES[0]) => {
    createCurrency.mutate({
      currency_code: cur.code,
      currency_name: cur.name,
      currency_symbol: cur.symbol,
      is_active: true,
      is_default: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currencies?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Devises actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ALL_CURRENCIES.length}+</p>
                <p className="text-sm text-muted-foreground">Devises disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">Temps réel</p>
                <p className="text-sm text-muted-foreground">Conversion automatique</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestion des Devises
          </CardTitle>
          <CardDescription>
            Configurez les devises supportées et les taux de change — {ALL_CURRENCIES.length}+ devises disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => updateCurrencyRates.mutate('EUR')} disabled={updateCurrencyRates.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${updateCurrencyRates.isPending ? 'animate-spin' : ''}`} />
              Actualiser les taux
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Ajouter une devise</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter une devise</DialogTitle>
                  <DialogDescription>{ALL_CURRENCIES.length}+ devises disponibles</DialogDescription>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher (ex: USD, Euro...)" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <ScrollArea className="h-72">
                  <div className="space-y-1">
                    {filteredForAdd.map(c => (
                      <div key={c.code} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{c.flag}</span>
                          <div>
                            <p className="font-medium text-sm">{c.code}</p>
                            <p className="text-xs text-muted-foreground">{c.name}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { handleAddCurrency(c); setAddDialogOpen(false); }}>
                          <Plus className="h-3 w-3 mr-1" />Ajouter
                        </Button>
                      </div>
                    ))}
                    {filteredForAdd.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Aucune devise trouvée</p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Dialog open={converterOpen} onOpenChange={setConverterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><ArrowRightLeft className="h-4 w-4 mr-2" />Convertisseur</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convertisseur de devises</DialogTitle>
                  <DialogDescription>Conversion en temps réel</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Montant</label>
                      <Input type="number" value={converterAmount} onChange={e => setConverterAmount(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">De</label>
                      <select className="w-full border rounded-md p-2 bg-background" value={converterFrom} onChange={e => setConverterFrom(e.target.value)}>
                        {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Vers</label>
                      <select className="w-full border rounded-md p-2 bg-background" value={converterTo} onChange={e => setConverterTo(e.target.value)}>
                        {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 text-center bg-accent/30">
                    <p className="text-sm text-muted-foreground">Résultat</p>
                    <p className="text-3xl font-bold">{convertedAmount} {converterTo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {converterFrom} = {((MOCK_RATES[converterTo] || 1) / (MOCK_RATES[converterFrom] || 1)).toFixed(4)} {converterTo}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active currencies list */}
          {isLoading ? (
            <div className="border rounded-lg p-6 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : currencies && currencies.length > 0 ? (
            <div className="space-y-2">
              {currencies.map((currency: any) => {
                const meta = ALL_CURRENCIES.find(c => c.code === currency.currency_code);
                const rate = MOCK_RATES[currency.currency_code];
                return (
                  <div key={currency.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta?.flag || "💱"}</span>
                      <div>
                        <p className="font-medium">{currency.currency_code} — {currency.currency_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Symbole: {currency.currency_symbol}
                          {rate && ` · 1 USD = ${rate} ${currency.currency_code}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currency.is_default ? (
                        <Badge variant="default" className="gap-1"><Star className="h-3 w-3" />Par défaut</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setDefaultCurrency.mutate(currency.id)}>
                          <Star className="h-3 w-3 mr-1" />Définir par défaut
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border rounded-lg border-dashed p-8 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucune devise configurée</p>
              <p className="text-sm mt-1">Ajoutez des devises pour activer la conversion automatique des prix</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
