/**
 * Enhanced Notification Dialog
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Send, Users, Calendar, MessageSquare, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeOptions = [
  { value: "info", label: "Information", icon: "ℹ️" },
  { value: "warning", label: "Avertissement", icon: "⚠️" },
  { value: "success", label: "Succès", icon: "✅" },
  { value: "error", label: "Erreur", icon: "❌" },
  { value: "promotion", label: "Promotion", icon: "🎉" },
];

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "",
    priority: "medium",
    targetUsers: "",
    scheduleDate: "",
    pushNotification: true,
    emailNotification: false,
    smsNotification: false
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.type) {
      toast.error("Titre, message et type requis");
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Notification créée avec succès");
    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({ title: "", message: "", type: "", priority: "medium", targetUsers: "", scheduleDate: "", pushNotification: true, emailNotification: false, smsNotification: false });
  };

  const selectedType = typeOptions.find(t => t.value === formData.type);

  const content = (
    <form onSubmit={handleCreate} className="space-y-6">
      {selectedType && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={cn("p-4 rounded-xl border-2 border-dashed",
            formData.type === "success" && "border-success/30 bg-success/5",
            formData.type === "error" && "border-destructive/30 bg-destructive/5",
            formData.type === "warning" && "border-warning/30 bg-warning/5",
            formData.type === "info" && "border-info/30 bg-info/5",
            formData.type === "promotion" && "border-primary/30 bg-primary/5",
          )}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedType.icon}</span>
            <div>
              <p className="font-medium">{formData.title || "Titre"}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{formData.message || "Message..."}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Titre *</Label>
          <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex: Nouvelle fonctionnalité" required />
        </div>
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
            <SelectContent>
              {typeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.icon} {opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Message *</Label>
        <Textarea value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} placeholder="Décrivez votre notification..." rows={4} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Utilisateurs cibles</Label>
          <Input value={formData.targetUsers} onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))} placeholder="Tous, Admin..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date de programmation</Label>
        <Input type="datetime-local" value={formData.scheduleDate} onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))} />
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
        <p className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Canaux</p>
        <div className="space-y-3">
          {[{ id: 'push', label: 'Push', key: 'pushNotification' }, { id: 'email', label: 'Email', key: 'emailNotification' }, { id: 'sms', label: 'SMS', key: 'smsNotification' }].map(ch => (
            <div key={ch.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
              <Label htmlFor={ch.id}>{ch.label}</Label>
              <Switch id={ch.id} checked={(formData as any)[ch.key]} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [ch.key]: checked }))} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Créer
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader><DrawerTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Nouvelle Notification</DrawerTitle></DrawerHeader>
          <div className="p-4 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Nouvelle Notification</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}