import { Plan } from '@/data/homeData';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

interface PricingCardProps {
  plan: Plan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  return (
    <div className={`relative bg-card text-card-foreground rounded-lg p-8 shadow-card transition-all duration-300 hover:shadow-premium hover:scale-[1.02] ${
      plan.popular ? 'border-2 border-primary' : 'border border-border'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Le plus populaire
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold">{plan.price.includes('€') ? plan.price : `€${plan.price}`}</span>
          {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
        </div>
        <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
        
        <ul className="text-left space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
          asChild
        >
          <Link to="/auth" aria-label={`Souscrire au plan ${plan.name}`}>
            {plan.cta}
          </Link>
        </Button>
      </div>
    </div>
  );
}