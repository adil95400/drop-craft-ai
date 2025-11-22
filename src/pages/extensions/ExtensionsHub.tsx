import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Puzzle, Store, Terminal, Palette, Shield, Download } from 'lucide-react';

export default function ExtensionsHub() {
  const extensions = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Découvrez et installez des extensions pour votre boutique',
      icon: Store,
      route: '/extensions/marketplace',
      badge: 'Nouveau'
    },
    {
      id: 'cli',
      title: 'Outils CLI',
      description: 'Gérez vos extensions en ligne de commande',
      icon: Terminal,
      route: '/extensions/cli',
      badge: 'Pro'
    },
    {
      id: 'white-label',
      title: 'White-Label',
      description: 'Personnalisez l\'interface à vos couleurs',
      icon: Palette,
      route: '/extensions/white-label',
      badge: 'Ultra Pro'
    },
    {
      id: 'sso',
      title: 'Enterprise SSO',
      description: 'Authentification unique pour votre équipe',
      icon: Shield,
      route: '/extensions/sso',
      badge: 'Ultra Pro'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hub Extensions</h1>
        <p className="text-muted-foreground mt-2">
          Étendez les fonctionnalités de votre plateforme avec nos extensions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {extensions.map((extension) => {
          const Icon = extension.icon;
          return (
            <Card key={extension.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                {extension.badge && (
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {extension.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">{extension.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{extension.description}</p>
              <Link to={extension.route}>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Accéder
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
