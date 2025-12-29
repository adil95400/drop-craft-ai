import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  category?: 'marketing' | 'social' | 'product' | 'all';
}

const suggestions = {
  marketing: [
    "Bannière promotionnelle moderne avec dégradé bleu et orange pour une vente flash",
    "Image publicitaire minimaliste pour une marque de luxe avec fond blanc épuré",
    "Visual corporate professionnel avec des formes géométriques abstraites",
    "Header email marketing coloré et dynamique pour une newsletter",
  ],
  social: [
    "Post Instagram esthétique avec citation inspirante et arrière-plan pastel",
    "Story engageante avec effet néon et typographie bold",
    "Image de profil professionnelle avec fond dégradé moderne",
    "Carousel visuel pour présenter 5 avantages d'un produit",
  ],
  product: [
    "Photo produit sur fond blanc avec ombre douce et reflets",
    "Mise en scène lifestyle d'un produit dans un environnement moderne",
    "Image e-commerce avec multiple angles et détails du produit",
    "Mockup packaging élégant avec effets de lumière naturelle",
  ],
  trending: [
    "Image AI art style synthwave rétro-futuriste avec couleurs néon",
    "Illustration 3D isométrique moderne pour interface utilisateur",
    "Design Y2K nostalgique avec effets chrome et étoiles",
    "Visual glassmorphism avec transparence et effet de verre dépoli",
  ]
};

export function PromptSuggestions({ onSelect, category = 'all' }: PromptSuggestionsProps) {
  const getPrompts = () => {
    if (category === 'all') {
      return [
        ...suggestions.marketing.slice(0, 2),
        ...suggestions.social.slice(0, 2),
        ...suggestions.product.slice(0, 2),
        ...suggestions.trending.slice(0, 2),
      ];
    }
    return suggestions[category] || suggestions.marketing;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Suggestions de prompts
      </div>
      <div className="flex flex-wrap gap-2">
        {getPrompts().map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1.5 px-2.5 text-left whitespace-normal max-w-full"
            onClick={() => onSelect(prompt)}
          >
            {prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
        <TrendingUp className="h-3 w-3" />
        <span>Tendances: synthwave, glassmorphism, 3D isometric, Y2K</span>
      </div>
    </div>
  );
}
