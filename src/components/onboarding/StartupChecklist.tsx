/**
 * Checklist de démarrage persistante - Phase 3.1
 * Affiche les étapes restantes après l'onboarding
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle2, 
  Circle, 
  Store, 
  Package, 
  ShoppingCart, 
  Zap, 
  BarChart3,
  X,
  Sparkles,
  ArrowRight,
  Trophy
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  completed: boolean;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'completed'>[] = [
  {
    id: 'connect_store',
    title: 'Connecter une boutique',
    description: 'Liez Shopify, WooCommerce ou autre',
    icon: Store,
    route: '/integrations'
  },
  {
    id: 'import_products',
    title: 'Importer des produits',
    description: 'Ajoutez vos premiers produits',
    icon: Package,
    route: '/products'
  },
  {
    id: 'setup_automation',
    title: 'Configurer l\'automatisation',
    description: 'Activez les règles IA',
    icon: Zap,
    route: '/automation'
  },
  {
    id: 'first_order',
    title: 'Traiter une commande',
    description: 'Gérez votre première vente',
    icon: ShoppingCart,
    route: '/orders'
  },
  {
    id: 'view_analytics',
    title: 'Consulter les analytics',
    description: 'Analysez vos performances',
    icon: BarChart3,
    route: '/analytics'
  }
];

export function StartupChecklist() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadChecklistProgress();
  }, [user?.id]);

  const loadChecklistProgress = () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Use localStorage for checklist progress (no migration needed)
      const storageKey = `shopopti_checklist_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const progress = stored ? JSON.parse(stored) : {};
      
      // Check if dismissed
      if (progress.dismissed) {
        setIsVisible(false);
        setLoading(false);
        return;
      }

      setChecklist(
        DEFAULT_CHECKLIST.map(item => ({
          ...item,
          completed: progress[item.id] || false
        }))
      );
    } catch (error) {
      console.error('Error loading checklist:', error);
      setChecklist(DEFAULT_CHECKLIST.map(item => ({ ...item, completed: false })));
    } finally {
      setLoading(false);
    }
  };

  const completeItem = (itemId: string) => {
    if (!user?.id) return;

    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: true } : item
    );
    setChecklist(updatedChecklist);

    // Save to localStorage
    const storageKey = `shopopti_checklist_${user.id}`;
    const progress = updatedChecklist.reduce((acc, item) => {
      acc[item.id] = item.completed;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem(storageKey, JSON.stringify(progress));

    // Check if all completed
    if (updatedChecklist.every(item => item.completed)) {
      setTimeout(() => setIsVisible(false), 2000);
    }
  };

  const dismissChecklist = () => {
    setIsVisible(false);
    
    if (user?.id) {
      const storageKey = `shopopti_checklist_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ dismissed: true }));
    }
  };

  const handleItemClick = (item: ChecklistItem) => {
    completeItem(item.id);
    navigate(item.route);
  };

  if (loading || !isVisible || checklist.length === 0) return null;

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;
  const allCompleted = completedCount === checklist.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 w-80"
      >
        <Card className="shadow-2xl border-2 overflow-hidden">
          {/* Header */}
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Démarrage rapide</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <span className="text-xs">{isMinimized ? '▲' : '▼'}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={dismissChecklist}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <Badge variant="outline" className="text-xs">
                {completedCount}/{checklist.length}
              </Badge>
            </div>
          </CardHeader>

          {/* Content */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-4">
                  {allCompleted ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-4"
                    >
                      <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-3">
                        <Trophy className="h-8 w-8 text-success" />
                      </div>
                      <p className="font-semibold text-success">Félicitations ! 🎉</p>
                      <p className="text-sm text-muted-foreground">
                        Vous avez complété toutes les étapes
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      {checklist.map((item, index) => {
                        const ItemIcon = item.icon;
                        
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleItemClick(item)}
                            className={`w-full p-3 rounded-lg border text-left transition-all duration-200 flex items-center gap-3 ${
                              item.completed
                                ? 'bg-success/5 border-success/30 opacity-60'
                                : 'hover:bg-accent hover:border-primary/50'
                            }`}
                          >
                            <div className={`p-1.5 rounded-md ${
                              item.completed ? 'bg-success/10' : 'bg-primary/10'
                            }`}>
                              {item.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <ItemIcon className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${item.completed ? 'line-through' : ''}`}>
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            </div>
                            {!item.completed && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default StartupChecklist;
