import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Zap, HeadphonesIcon, Award, TrendingUp } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    title: 'Sécurisé SSL',
    description: 'Données cryptées'
  },
  {
    icon: Lock,
    title: 'RGPD Conforme',
    description: 'Protection des données'
  },
  {
    icon: Zap,
    title: '99.9% Uptime',
    description: 'Disponibilité garantie'
  },
  {
    icon: HeadphonesIcon,
    title: 'Support 24/7',
    description: 'Assistance continue'
  },
  {
    icon: Award,
    title: 'Certifié',
    description: 'Qualité reconnue'
  },
  {
    icon: TrendingUp,
    title: '15k+ Utilisateurs',
    description: 'Communauté active'
  }
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <Card
            key={index}
            className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-4 text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-sm font-semibold">{badge.title}</div>
              <div className="text-xs text-muted-foreground">{badge.description}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
