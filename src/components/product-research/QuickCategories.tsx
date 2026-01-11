import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'Tout', icon: '🔥', count: 12845 },
  { id: 'fashion', label: 'Mode', icon: '👗', count: 3421 },
  { id: 'electronics', label: 'Tech', icon: '📱', count: 2156 },
  { id: 'beauty', label: 'Beauté', icon: '💄', count: 1987 },
  { id: 'home', label: 'Maison', icon: '🏠', count: 1654 },
  { id: 'sports', label: 'Sport', icon: '⚽', count: 1234 },
  { id: 'toys', label: 'Jouets', icon: '🎮', count: 987 },
  { id: 'pets', label: 'Animaux', icon: '🐕', count: 765 },
  { id: 'baby', label: 'Bébé', icon: '👶', count: 543 },
  { id: 'auto', label: 'Auto', icon: '🚗', count: 432 },
];

export function QuickCategories({ selectedCategory, onSelectCategory }: QuickCategoriesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat, index) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectCategory(cat.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200",
            selectedCategory === cat.id
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
              : "bg-background hover:bg-muted border-border hover:border-primary/50"
          )}
        >
          <span className="text-lg">{cat.icon}</span>
          <span className="font-medium">{cat.label}</span>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs ml-1",
              selectedCategory === cat.id && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {cat.count.toLocaleString()}
          </Badge>
        </motion.button>
      ))}
    </div>
  );
}
