/**
 * Enhanced Integration Dialog
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsUnified } from "@/hooks/unified";
import { supabase } from "@/integrations/supabase/client";
import { logError } from '@/utils/consoleCleanup';
import { Link2, Key, Globe, Shield, CheckCircle, Zap, ArrowRight, Store, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface CreateIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformOptions = [
  { value: "shopify", label: "Shopify", icon: "🛒" },
  { value: "woocommerce", label: "WooCommerce", icon: "🔮" },
  { value: "aliexpress", label: "AliExpress", icon: "📦" },
  { value: "amazon", label: "Amazon", icon: "📱" },
  { value: "stripe", label: "Stripe", icon: "💳" },
  { value: "paypal", label: "PayPal", icon: "💰" },
];

export const CreateIntegrationDialog = ({ open, onOpenChange }: CreateIntegrationDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrationsUnified();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", type: "", apiKey: "", apiSecret: "", webhookUrl: "", description: "", enabled: true
  });

  const selectedPlatform = platformOptions.find(p => p.value === formData.type);
  const progress = (currentStep / 3) * 100;

  const handleNext = () => {
    if (currentStep === 1 && (!formData.name || !formData.type)) {
      toast({ title: "Champs obligatoires manquants", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && !formData.apiKey) {
      toast({ title: "Clé API requise", variant: "destructive" });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.type || !formData.apiKey) {
      toast({ title: "Erreur", description: "Champs obligatoires manquants", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Erreur", description: "Non connecté", variant: "destructive" }); return; }
      const credentials: Record<string, string> = {};
      if (formData.apiKey) credentials.api_key = formData.apiKey;
      if (formData.apiSecret) credentials.api_secret = formData.apiSecret;
      
      // Use the unified hook API format
      addIntegration({
        template: { id: formData.type, name: formData.name },
        config: {
          platform_url: formData.webhookUrl || undefined,
          is_active: formData.enabled,
          connection_status: 'disconnected' as const
        },
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      });
      
      toast({ title: "Intégration créée" });
      onOpenChange(false);
      setCurrentStep(1);
      setFormData({ name: "", type: "", apiKey: "", apiSecret: "", webhookUrl: "", description: "", enabled: true });
    } catch (error) {
      logError(error as Error, 'Failed to create integration');
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const renderStep = () => {
    if (currentStep === 1) return (
      <div className="space-y-6">
        <div className="text-center pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3"><Link2 className="h-8 w-8 text-primary" /></div>
          <h3 className="font-semibold text-lg">Choisissez votre plateforme</h3>
        </div>
        <div className="space-y-2"><Label>Nom *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ma boutique" /></div>
        <div className="space-y-2">
          <Label>Plateforme *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {platformOptions.map((p) => (
              <button key={p.value} type="button" onClick={() => setFormData({ ...formData, type: p.value })}
                className={cn("p-4 rounded-xl border-2 text-left transition-all", formData.type === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                <span className="text-2xl block mb-2">{p.icon}</span><span className="font-medium text-sm">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
    if (currentStep === 2) return (
      <div className="space-y-6">
        <div className="text-center pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3"><Key className="h-8 w-8 text-amber-500" /></div>
          <h3 className="font-semibold">Credentials {selectedPlatform?.label}</h3>
        </div>
        <div className="space-y-2"><Label>Clé API *</Label><Input type="password" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} placeholder="sk_live_xxx" /></div>
        <div className="space-y-2"><Label>Secret API</Label><Input type="password" value={formData.apiSecret} onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })} placeholder="Optionnel" /></div>
      </div>
    );
    return (
      <div className="space-y-6">
        <div className="text-center pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-3"><Zap className="h-8 w-8 text-green-500" /></div>
          <h3 className="font-semibold">Configuration finale</h3>
        </div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" /></div>
        <div className="space-y-2"><Label>URL Webhook</Label><Input value={formData.webhookUrl} onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })} placeholder="https://..." /></div>
        <div className="flex items-center justify-between p-3 rounded-lg border"><Label>Activer</Label><Switch checked={formData.enabled} onCheckedChange={(enabled) => setFormData({ ...formData, enabled })} /></div>
      </div>
    );
  };

  const footer = (
    <div className="space-y-4 w-full">
      <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>Étape {currentStep}/3</span><span>{Math.round(progress)}%</span></div><Progress value={progress} className="h-1.5" /></div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={currentStep === 1 ? () => onOpenChange(false) : () => setCurrentStep(s => s - 1)}>{currentStep === 1 ? "Annuler" : "Retour"}</Button>
        {currentStep < 3 ? <Button onClick={handleNext}><ArrowRight className="h-4 w-4 mr-2" /> Continuer</Button> : <Button onClick={handleCreate} disabled={isAdding}>{isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />} Créer</Button>}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]"><DrawerHeader><DrawerTitle>Nouvelle Intégration</DrawerTitle></DrawerHeader><div className="p-4 overflow-y-auto">{renderStep()}</div><DrawerFooter>{footer}</DrawerFooter></DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nouvelle Intégration</DialogTitle><DialogDescription>Connectez vos services externes</DialogDescription></DialogHeader>{renderStep()}<DialogFooter>{footer}</DialogFooter></DialogContent>
    </Dialog>
  );
};