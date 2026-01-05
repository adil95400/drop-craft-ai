/**
 * Sortable Block Component
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageBlock } from '@/services/LandingPageService';
import { GripVertical, Trash2, Layout, Star, MessageSquare, Target, DollarSign, FormInput, Type, Image, Video, Clock, CheckCircle, HelpCircle } from 'lucide-react';

const BLOCK_ICONS: Record<string, any> = {
  hero: Layout,
  features: Star,
  testimonials: MessageSquare,
  cta: Target,
  pricing: DollarSign,
  form: FormInput,
  text: Type,
  image: Image,
  video: Video,
  countdown: Clock,
  benefits: CheckCircle,
  faq: HelpCircle,
};

const BLOCK_LABELS: Record<string, string> = {
  hero: 'Hero',
  features: 'Caractéristiques',
  testimonials: 'Témoignages',
  cta: 'Appel à l\'action',
  pricing: 'Tarifs',
  form: 'Formulaire',
  text: 'Texte',
  image: 'Image',
  video: 'Vidéo',
  countdown: 'Compte à rebours',
  benefits: 'Avantages',
  faq: 'FAQ',
};

interface SortableBlockProps {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableBlock({ block, isSelected, onSelect, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = BLOCK_ICONS[block.type] || Layout;
  const label = BLOCK_LABELS[block.type] || block.type;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Block Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <Badge variant="outline" className="gap-1">
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Block Preview */}
        <div className="bg-muted/50 rounded-lg p-4 min-h-[60px]">
          {block.type === 'hero' && (
            <div className="text-center">
              <p className="font-bold text-lg">{block.props.title || 'Titre'}</p>
              <p className="text-sm text-muted-foreground">{block.props.subtitle || 'Sous-titre'}</p>
            </div>
          )}
          {block.type === 'cta' && (
            <div className="text-center">
              <p className="font-medium">{block.props.title || 'Appel à l\'action'}</p>
              <div className="mt-2 inline-block bg-primary text-primary-foreground text-xs px-3 py-1 rounded">
                {block.props.buttonText || 'Bouton'}
              </div>
            </div>
          )}
          {block.type === 'features' && (
            <div className="flex justify-center gap-4">
              {(block.props.items || []).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium">{item.title}</p>
                </div>
              ))}
            </div>
          )}
          {block.type === 'testimonials' && (
            <div className="text-center">
              <p className="text-sm italic">"Témoignage client..."</p>
              <p className="text-xs text-muted-foreground mt-1">- Client</p>
            </div>
          )}
          {block.type === 'text' && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {block.props.content?.replace(/<[^>]*>/g, '') || 'Contenu texte...'}
            </p>
          )}
          {block.type === 'form' && (
            <div className="space-y-2">
              <div className="h-6 bg-background rounded border" />
              <div className="h-6 bg-background rounded border" />
              <div className="h-6 bg-primary rounded w-20" />
            </div>
          )}
          {(block.type === 'image' || block.type === 'video') && (
            <div className="h-20 bg-muted rounded flex items-center justify-center">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {block.type === 'pricing' && (
            <div className="flex justify-center gap-2">
              <div className="bg-background rounded p-2 text-center">
                <p className="text-xs font-medium">Plan</p>
                <p className="text-sm font-bold">29€</p>
              </div>
              <div className="bg-primary/10 rounded p-2 text-center border border-primary">
                <p className="text-xs font-medium">Pro</p>
                <p className="text-sm font-bold">79€</p>
              </div>
            </div>
          )}
          {block.type === 'countdown' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{block.props.title}</p>
              <div className="flex justify-center gap-2 text-sm font-mono">
                <span className="bg-background px-2 py-1 rounded">00j</span>
                <span className="bg-background px-2 py-1 rounded">00h</span>
                <span className="bg-background px-2 py-1 rounded">00m</span>
              </div>
            </div>
          )}
          {block.type === 'benefits' && (
            <ul className="text-xs space-y-1">
              {(block.props.items || []).slice(0, 3).map((item: string, i: number) => (
                <li key={i} className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {block.type === 'faq' && (
            <div className="space-y-1">
              {(block.props.items || []).slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="text-xs">
                  <p className="font-medium">{item.question}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
