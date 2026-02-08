import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Link, Search, Package, Zap, CheckCircle2,
  RefreshCw, Download, Star, Heart, Palette, Gift, Sparkles, Store
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';

export default function EtsyImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('Etsy');

  const categories = [
    { name: 'Bijoux', icon: Sparkles, count: '15M+' },
    { name: 'Maison & Déco', icon: Gift, count: '20M+' },
    { name: 'Vêtements', icon: Palette, count: '12M+' },
    { name: 'Art', icon: Heart, count: '8M+' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#F1641E] to-[#D5451F] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/import')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour au Hub
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#F1641E]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Import Etsy</h1>
              <p className="text-white/80">Produits artisanaux et faits main uniques</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0"><Sparkles className="w-3 h-3 mr-1" /> Fait Main</Badge>
            <Badge className="bg-white/20 text-white border-0"><Package className="w-3 h-3 mr-1" /> 100M+ Produits</Badge>
            <Badge className="bg-white/20 text-white border-0"><Heart className="w-3 h-3 mr-1" /> Unique & Original</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="shop">Par Boutique</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-[#F1641E]" />Import par URL Etsy</CardTitle>
                <CardDescription>Importez des produits artisanaux uniques depuis Etsy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="https://www.etsy.com/listing/123456789" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                  <Button onClick={() => handleImport(url)} disabled={isImporting} className="bg-[#F1641E] hover:bg-[#D5451F]">
                    {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{progressMessage || `Import Etsy... ${progress}%`}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Spécificités Etsy incluses :</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Titre & description', 'Images artisan', 'Personnalisation', 'Options variantes', 'Prix & frais', 'Délais fabrication', 'Info artisan', 'Avis clients'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>{item}</span></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-[#F1641E]" />Recherche Etsy</CardTitle>
                <CardDescription>Trouvez des produits artisanaux uniques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                  <Button className="bg-[#F1641E] hover:bg-[#D5451F]"><Search className="w-4 h-4 mr-2" />Rechercher</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.name} className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors text-center">
                      <cat.icon className="w-8 h-8 mx-auto mb-2 text-[#F1641E]" />
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shop" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-[#F1641E]" />Import par Boutique</CardTitle>
                <CardDescription>Importez les produits d'une boutique Etsy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="https://www.etsy.com/shop/NomDeLaBoutique" className="flex-1" />
                  <Button className="bg-[#F1641E] hover:bg-[#D5451F]"><Search className="w-4 h-4 mr-2" />Charger</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Produits uniques', value: '100M+', icon: Package, color: 'text-[#F1641E]', bg: 'bg-[#F1641E]/10' },
            { label: 'Artisans actifs', value: '7.5M', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Fait main', value: '100%', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { label: 'Import rapide', value: '<3s', icon: Zap, color: 'text-green-500', bg: 'bg-green-500/10' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bg} rounded-lg`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                  <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
