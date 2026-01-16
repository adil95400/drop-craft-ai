import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useCreateSalesChannel } from '@/hooks/useMultiChannel';
import { 
  Loader2, 
  ShoppingCart, 
  Package, 
  Tag, 
  Settings, 
  Store, 
  Globe,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Shield,
  RefreshCw,
  Link2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  channel_type: z.enum(['shopify', 'amazon', 'ebay', 'woocommerce', 'prestashop', 'custom']),
  auto_sync: z.boolean().default(true),
  sync_interval_minutes: z.number().min(15).max(1440).default(60),
  api_url: z.string().optional(),
  api_key: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const channelOptions = [
  { 
    value: 'shopify', 
    label: 'Shopify', 
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Plateforme e-commerce populaire',
    features: ['Sync automatique', 'Webhooks temps réel', 'Multi-devises']
  },
  { 
    value: 'amazon', 
    label: 'Amazon', 
    icon: Package,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Marketplace mondiale',
    features: ['FBA intégré', 'Gestion stock', 'Multi-pays']
  },
  { 
    value: 'ebay', 
    label: 'eBay', 
    icon: Tag,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Enchères et vente directe',
    features: ['Enchères auto', 'Frais optimisés', 'Analytics']
  },
  { 
    value: 'woocommerce', 
    label: 'WooCommerce', 
    icon: Settings,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'WordPress e-commerce',
    features: ['API REST', 'Extensions', 'Personnalisable']
  },
  { 
    value: 'prestashop', 
    label: 'PrestaShop', 
    icon: Store,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    description: 'Solution open-source',
    features: ['Multi-boutique', 'SEO avancé', 'Modules']
  },
  { 
    value: 'custom', 
    label: 'API Personnalisée', 
    icon: Globe,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    description: 'Connexion API sur mesure',
    features: ['Configuration libre', 'Webhooks', 'Flexible']
  },
];

const syncIntervalOptions = [
  { value: 15, label: '15 min', description: 'Temps réel' },
  { value: 30, label: '30 min', description: 'Fréquent' },
  { value: 60, label: '1 heure', description: 'Standard' },
  { value: 180, label: '3 heures', description: 'Économique' },
  { value: 720, label: '12 heures', description: 'Journalier' },
  { value: 1440, label: '24 heures', description: 'Minimal' },
];

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const [step, setStep] = useState(1);
  const createChannel = useCreateSalesChannel();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      channel_type: 'shopify',
      auto_sync: true,
      sync_interval_minutes: 60,
      api_url: '',
      api_key: '',
    },
  });

  const selectedChannel = channelOptions.find(c => c.value === form.watch('channel_type'));
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const onSubmit = async (values: FormValues) => {
    await createChannel.mutateAsync({
      name: values.name,
      channel_type: values.channel_type,
      sync_config: {
        auto_sync: values.auto_sync,
        sync_interval_minutes: values.sync_interval_minutes,
      },
      api_credentials: values.api_url ? { api_url: values.api_url, api_key: values.api_key } : {},
      status: 'inactive',
    });
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  const nextStep = () => {
    if (step === 1 && !form.getValues('channel_type')) return;
    if (step === 2 && !form.getValues('name')) {
      form.trigger('name');
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const ChannelIcon = selectedChannel?.icon || Globe;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        {/* Header with gradient */}
        <div className={cn(
          "relative px-6 pt-6 pb-4 bg-gradient-to-r",
          selectedChannel?.color || "from-primary to-primary/80"
        )}>
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <DialogHeader className="text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ChannelIcon className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {step === 1 && "Choisir une plateforme"}
                    {step === 2 && "Configuration du canal"}
                    {step === 3 && "Paramètres de synchronisation"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 mt-0.5">
                    Étape {step} sur {totalSteps}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {/* Progress bar */}
            <div className="mt-4">
              <Progress value={progress} className="h-1.5 bg-white/20" />
              <div className="flex justify-between mt-2 text-xs text-white/60">
                <span className={step >= 1 ? "text-white" : ""}>Plateforme</span>
                <span className={step >= 2 ? "text-white" : ""}>Détails</span>
                <span className={step >= 3 ? "text-white" : ""}>Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {/* Step 1: Choose Platform */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="channel_type"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-3">
                            {channelOptions.map((option) => {
                              const Icon = option.icon;
                              const isSelected = field.value === option.value;
                              return (
                                <motion.button
                                  key={option.value}
                                  type="button"
                                  onClick={() => field.onChange(option.value)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={cn(
                                    "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                                    isSelected 
                                      ? `${option.borderColor} ${option.bgColor} shadow-lg` 
                                      : "border-border/50 hover:border-border bg-card/50 hover:bg-card"
                                  )}
                                >
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className={cn("p-1 rounded-full bg-gradient-to-r", option.color)}>
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    </motion.div>
                                  )}
                                  
                                  <div className="flex items-start gap-3">
                                    <div className={cn(
                                      "p-2.5 rounded-lg bg-gradient-to-br",
                                      option.color
                                    )}>
                                      <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground">{option.label}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {option.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {isSelected && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-3 pt-3 border-t border-border/50"
                                    >
                                      <div className="flex flex-wrap gap-1.5">
                                        {option.features.map((feature, idx) => (
                                          <Badge 
                                            key={idx} 
                                            variant="secondary" 
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {feature}
                                          </Badge>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 2: Channel Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Selected platform summary */}
                    {selectedChannel && (
                      <div className={cn(
                        "p-4 rounded-xl border",
                        selectedChannel.bgColor,
                        selectedChannel.borderColor
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-gradient-to-br", selectedChannel.color)}>
                            <ChannelIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedChannel.label}</p>
                            <p className="text-xs text-muted-foreground">{selectedChannel.description}</p>
                          </div>
                          <Badge className="ml-auto" variant="outline">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Sélectionné
                          </Badge>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            Nom du canal
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={`Ma boutique ${selectedChannel?.label || ''}`}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Un nom unique pour identifier ce canal dans votre tableau de bord
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('channel_type') === 'custom' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Link2 className="h-4 w-4 text-primary" />
                            Configuration API
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="api_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL de l'API</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://api.example.com/v1"
                                    className="h-11"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clé API</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password"
                                    placeholder="sk_live_..."
                                    className="h-11"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription className="text-xs flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Stockée de manière sécurisée
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Sync Settings */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="auto_sync"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-card/50">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <RefreshCw className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">
                                Synchronisation automatique
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Les produits seront synchronisés automatiquement
                              </FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <AnimatePresence>
                      {form.watch('auto_sync') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <FormField
                            control={form.control}
                            name="sync_interval_minutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  Fréquence de synchronisation
                                </FormLabel>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {syncIntervalOptions.map((option) => (
                                    <motion.button
                                      key={option.value}
                                      type="button"
                                      onClick={() => field.onChange(option.value)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={cn(
                                        "p-3 rounded-lg border text-center transition-all",
                                        field.value === option.value
                                          ? "border-primary bg-primary/10 shadow-sm"
                                          : "border-border/50 hover:border-border bg-card/50"
                                      )}
                                    >
                                      <p className="font-semibold text-sm">{option.label}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {option.description}
                                      </p>
                                    </motion.button>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Summary Card */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Résumé de configuration</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Plateforme</span>
                          <span className="font-medium flex items-center gap-1.5">
                            {selectedChannel && <ChannelIcon className="h-3.5 w-3.5" />}
                            {selectedChannel?.label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Nom</span>
                          <span className="font-medium">{form.watch('name') || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Sync auto</span>
                          <Badge variant={form.watch('auto_sync') ? 'default' : 'secondary'} className="text-xs">
                            {form.watch('auto_sync') ? 'Activée' : 'Désactivée'}
                          </Badge>
                        </div>
                        {form.watch('auto_sync') && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Intervalle</span>
                            <span className="font-medium">
                              {syncIntervalOptions.find(o => o.value === form.watch('sync_interval_minutes'))?.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={step === 1 ? handleClose : prevStep}
                  className="gap-2"
                >
                  {step === 1 ? (
                    'Annuler'
                  ) : (
                    <>
                      <ArrowLeft className="h-4 w-4" />
                      Retour
                    </>
                  )}
                </Button>

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2"
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={createChannel.isPending}
                    className="gap-2 min-w-[160px]"
                  >
                    {createChannel.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Créer le canal
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
