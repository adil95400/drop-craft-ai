/**
 * Beta Feedback Widget — Floating button for beta testers to submit feedback
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquarePlus, Bug, Lightbulb, ThumbsUp, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "feature", label: "Suggestion", icon: Lightbulb },
  { value: "praise", label: "J'aime !", icon: ThumbsUp },
] as const;

export default function BetaFeedbackWidget() {
  const { user } = useUnifiedAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("feature");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("activity_logs").insert({
        action: "beta_feedback",
        description: message.trim(),
        entity_type: category,
        source: "beta_widget",
        user_id: user.id,
        details: {
          category,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });
      if (error) throw error;
      toast.success("Merci pour votre retour ! 🎉");
      setMessage("");
      setOpen(false);
    } catch {
      toast.error("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg gap-2 px-4 py-5"
          variant="default"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback Beta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Feedback Bêta
          </DialogTitle>
          <DialogDescription>
            Aidez-nous à améliorer ShopOpti ! Chaque retour compte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">Type de retour</Label>
            <RadioGroup
              value={category}
              onValueChange={setCategory}
              className="flex gap-3"
            >
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={cat.value} className="sr-only" />
                  <cat.icon className="h-4 w-4" />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="feedback-message" className="text-sm font-medium mb-2 block">
              Votre message
            </Label>
            <Textarea
              id="feedback-message"
              placeholder={
                category === "bug"
                  ? "Décrivez le problème rencontré..."
                  : category === "feature"
                  ? "Quelle fonctionnalité aimeriez-vous ?"
                  : "Qu'est-ce que vous appréciez ?"
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || sending}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
