import { Feature } from '@/data/homeData';

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <div className="bg-card text-card-foreground rounded-lg p-6 shadow-card hover:shadow-premium transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
      <div className="text-center">
        <Icon className="h-12 w-12 text-primary mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}