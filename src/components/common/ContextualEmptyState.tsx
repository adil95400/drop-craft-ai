/**
 * ContextualEmptyState - États vides avec actions contextuelles
 * Style AutoDS/Channable avec grille d'actions
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, Package, ShoppingCart, Users, Store,
  Upload, Link2, FileSpreadsheet, Search, Plus, Settings,
  Zap, RefreshCw, BookOpen, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'outline';
}

interface ContextualEmptyStateProps {
  type: 'products' | 'orders' | 'customers' | 'stores' | 'suppliers' | 'custom';
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: QuickAction[];
  children?: ReactNode;
  className?: string;
  showDocLink?: boolean;
  docUrl?: string;
}

// Configurations prédéfinies par type
const PRESETS: Record<string, {
  icon: LucideIcon;
  title: string;
  description: string;
  actions: QuickAction[];
  docUrl: string;
}> = {
  products: {
    icon: Package,
    title: 'Aucun produit dans votre catalogue',
    description: 'Commencez par importer vos premiers produits pour lancer votre boutique.',
    docUrl: '/docs/import',
    actions: [
      {
        icon: Link2,
        label: 'Import par URL',
        description: 'AliExpress, Amazon, Temu...',
        href: '/import/autods',
        variant: 'primary',
      },
      {
        icon: FileSpreadsheet,
        label: 'Import fichier',
        description: 'CSV, Excel, JSON',
        href: '/import/bulk',
      },
      {
        icon: Search,
        label: 'Rechercher fournisseurs',
        description: 'CJ, BigBuy, AliExpress',
        href: '/sourcing',
      },
      {
        icon: Plus,
        label: 'Créer manuellement',
        description: 'Ajouter un produit',
        href: '/products/new',
      },
    ],
  },
  orders: {
    icon: ShoppingCart,
    title: 'Aucune commande pour le moment',
    description: 'Les commandes apparaîtront ici dès que vos clients passeront des commandes.',
    docUrl: '/docs/orders',
    actions: [
      {
        icon: Store,
        label: 'Connecter une boutique',
        description: 'Shopify, WooCommerce...',
        href: '/stores',
        variant: 'primary',
      },
      {
        icon: RefreshCw,
        label: 'Synchroniser',
        description: 'Forcer la synchronisation',
      },
      {
        icon: Plus,
        label: 'Commande manuelle',
        description: 'Créer une commande',
        href: '/orders/create',
      },
    ],
  },
  customers: {
    icon: Users,
    title: 'Aucun client enregistré',
    description: 'Vos clients apparaîtront ici une fois qu\'ils auront passé commande.',
    docUrl: '/docs/customers',
    actions: [
      {
        icon: Store,
        label: 'Connecter une boutique',
        description: 'Importer vos clients',
        href: '/stores',
        variant: 'primary',
      },
      {
        icon: Upload,
        label: 'Importer clients',
        description: 'Depuis un fichier CSV',
        href: '/customers/import',
      },
      {
        icon: Plus,
        label: 'Ajouter un client',
        description: 'Créer manuellement',
        href: '/customers/new',
      },
    ],
  },
  stores: {
    icon: Store,
    title: 'Aucune boutique connectée',
    description: 'Connectez votre boutique pour synchroniser produits et commandes automatiquement.',
    docUrl: '/docs/stores',
    actions: [
      {
        icon: Zap,
        label: 'Shopify',
        description: 'Connexion en 1 clic',
        href: '/stores/connect/shopify',
        variant: 'primary',
      },
      {
        icon: Settings,
        label: 'WooCommerce',
        description: 'Via API REST',
        href: '/stores/connect/woocommerce',
      },
      {
        icon: Store,
        label: 'Autres plateformes',
        description: 'PrestaShop, Wix...',
        href: '/stores',
      },
    ],
  },
  suppliers: {
    icon: Package,
    title: 'Aucun fournisseur configuré',
    description: 'Ajoutez des fournisseurs pour automatiser vos commandes et suivre vos stocks.',
    docUrl: '/docs/suppliers',
    actions: [
      {
        icon: Search,
        label: 'Recherche API',
        description: 'CJ, AliExpress, BigBuy',
        href: '/sourcing',
        variant: 'primary',
      },
      {
        icon: Plus,
        label: 'Ajouter manuellement',
        description: 'Fournisseur personnalisé',
        href: '/suppliers/new',
      },
      {
        icon: Upload,
        label: 'Importer liste',
        description: 'Depuis un fichier',
        href: '/suppliers/import',
      },
    ],
  },
};

export function ContextualEmptyState({
  type,
  title,
  description,
  icon,
  actions,
  children,
  className,
  showDocLink = true,
  docUrl,
}: ContextualEmptyStateProps) {
  const navigate = useNavigate();
  
  const preset = type !== 'custom' ? PRESETS[type] : null;
  
  const displayIcon = icon || preset?.icon || Package;
  const displayTitle = title || preset?.title || 'Aucun élément';
  const displayDescription = description || preset?.description || '';
  const displayActions = actions || preset?.actions || [];
  const displayDocUrl = docUrl || preset?.docUrl || '/docs';
  
  const Icon = displayIcon;

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      navigate(action.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {/* Icône principale */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        {/* Cercles décoratifs */}
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary/10 animate-pulse" />
        <div className="absolute -bottom-1 -left-3 h-4 w-4 rounded-full bg-primary/20" />
      </motion.div>

      {/* Titre */}
      <h3 className="text-xl font-semibold mb-2">{displayTitle}</h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8">{displayDescription}</p>

      {/* Grille d'actions */}
      {displayActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-3xl mb-6">
          {displayActions.map((action, index) => {
            const ActionIcon = action.icon;
            const isPrimary = action.variant === 'primary';
            
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => handleAction(action)}
                className={cn(
                  "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-1",
                  isPrimary
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-card hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors",
                  isPrimary
                    ? "bg-primary-foreground/20"
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <ActionIcon className={cn(
                    "h-6 w-6",
                    isPrimary ? "text-primary-foreground" : "text-primary"
                  )} />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
                {action.description && (
                  <span className={cn(
                    "text-xs mt-1",
                    isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {action.description}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Contenu personnalisé */}
      {children}

      {/* Lien documentation */}
      {showDocLink && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate(displayDocUrl)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Consulter la documentation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ContextualEmptyState;
