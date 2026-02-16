/**
 * MarketplaceServiceHub — Service marketplace with categories, cards, and status
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, Star, Zap, ShoppingCart, BarChart3, Truck, Shield, Palette, MessageSquare } from 'lucide-react';

interface MarketplaceService {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  rating: number;
  installs: string;
  pricing: string;
  status: 'available' | 'installed' | 'coming_soon';
  tags: string[];
}

const SERVICES: MarketplaceService[] = [
  { id: '1', name: 'Stripe Payments', description: 'Acceptez les paiements par carte et gérez les abonnements', category: 'Paiements', icon: <ShoppingCart className="h-5 w-5" />, rating: 4.9, installs: '12K+', pricing: 'Gratuit', status: 'installed', tags: ['paiement', 'stripe'] },
  { id: '2', name: 'Google Analytics 4', description: 'Suivi avancé du trafic et des conversions e-commerce', category: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, rating: 4.7, installs: '28K+', pricing: 'Gratuit', status: 'available', tags: ['analytics', 'google'] },
  { id: '3', name: 'ShipStation', description: 'Automatisation des expéditions multi-transporteurs', category: 'Logistique', icon: <Truck className="h-5 w-5" />, rating: 4.5, installs: '8K+', pricing: '9.99€/mois', status: 'available', tags: ['shipping', 'logistique'] },
  { id: '4', name: 'Trustpilot Reviews', description: 'Collecte et affichage automatique des avis clients', category: 'Marketing', icon: <Star className="h-5 w-5" />, rating: 4.6, installs: '15K+', pricing: 'Freemium', status: 'available', tags: ['avis', 'reviews'] },
  { id: '5', name: 'Mailchimp', description: 'Email marketing automation et segmentation avancée', category: 'Marketing', icon: <MessageSquare className="h-5 w-5" />, rating: 4.4, installs: '20K+', pricing: 'Freemium', status: 'available', tags: ['email', 'marketing'] },
  { id: '6', name: 'Canva Design', description: 'Créez des visuels produits professionnels en quelques clics', category: 'Design', icon: <Palette className="h-5 w-5" />, rating: 4.8, installs: '10K+', pricing: 'Gratuit', status: 'coming_soon', tags: ['design', 'images'] },
  { id: '7', name: 'Fraud Shield AI', description: 'Détection de fraude en temps réel propulsée par IA', category: 'Sécurité', icon: <Shield className="h-5 w-5" />, rating: 4.3, installs: '5K+', pricing: '19.99€/mois', status: 'available', tags: ['sécurité', 'fraude'] },
  { id: '8', name: 'Zapier Connector', description: 'Connectez 5000+ apps sans code avec des workflows automatisés', category: 'Automatisation', icon: <Zap className="h-5 w-5" />, rating: 4.7, installs: '18K+', pricing: 'Freemium', status: 'installed', tags: ['automation', 'zapier'] },
];

const CATEGORIES = ['Tous', 'Paiements', 'Analytics', 'Logistique', 'Marketing', 'Design', 'Sécurité', 'Automatisation'];

export function MarketplaceServiceHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  const filtered = SERVICES.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.some(t => t.includes(search.toLowerCase()));
    const matchCat = category === 'Tous' || s.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un service..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Services disponibles', value: SERVICES.length },
          { label: 'Installés', value: SERVICES.filter(s => s.status === 'installed').length },
          { label: 'Catégories', value: CATEGORIES.length - 1 },
          { label: 'À venir', value: SERVICES.filter(s => s.status === 'coming_soon').length },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(service => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">{service.icon}</div>
                  <div>
                    <CardTitle className="text-sm">{service.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{service.category}</p>
                  </div>
                </div>
                <Badge variant={service.status === 'installed' ? 'default' : service.status === 'coming_soon' ? 'secondary' : 'outline'}>
                  {service.status === 'installed' ? 'Installé' : service.status === 'coming_soon' ? 'Bientôt' : 'Disponible'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary fill-primary" />{service.rating}</span>
                <span>{service.installs} installs</span>
                <span className="font-medium">{service.pricing}</span>
              </div>
              <Button variant={service.status === 'installed' ? 'outline' : 'default'} size="sm" className="w-full gap-2" disabled={service.status === 'coming_soon'}>
                {service.status === 'installed' ? 'Configurer' : service.status === 'coming_soon' ? 'Bientôt disponible' : 'Installer'}
                {service.status !== 'coming_soon' && <ExternalLink className="h-3 w-3" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
