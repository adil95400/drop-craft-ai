import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, X, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ExitIntentPopupProps {
  title?: string;
  description?: string;
  offerText?: string;
  ctaText?: string;
  discountCode?: string;
  onEmailSubmit?: (email: string) => void;
  delay?: number;
  showOnce?: boolean;
}

export const ExitIntentPopup = ({
  title = 'Attendez ! Ne partez pas les mains vides',
  description = 'Inscrivez-vous et recevez une offre exclusive',
  offerText = '15% de réduction sur votre première commande',
  ctaText = 'Obtenir mon code',
  discountCode = 'BIENVENUE15',
  onEmailSubmit,
  delay = 0,
  showOnce = true
}: ExitIntentPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [hasShown, setHasShown] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if already shown
    if (showOnce) {
      const wasShown = localStorage.getItem('exitIntent_shown');
      if (wasShown) return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setTimeout(() => {
          setIsOpen(true);
          setHasShown(true);
          if (showOnce) {
            localStorage.setItem('exitIntent_shown', 'true');
          }
        }, delay);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown, delay, showOnce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    onEmailSubmit?.(email);
    setSubmitted(true);
    toast.success('Code envoyé ! Vérifiez votre boîte mail');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(discountCode);
    toast.success('Code copié !');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Offre exclusive
            </Badge>
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Offer highlight */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-lg font-semibold text-center text-primary">
              {offerText}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Votre code de réduction :
              </p>
              <div
                onClick={copyCode}
                className="p-4 bg-muted rounded-lg text-center cursor-pointer hover:bg-muted/80 transition-colors"
              >
                <code className="text-2xl font-bold tracking-wider">
                  {discountCode}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliquez pour copier
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continuer mes achats
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <Button type="submit" className="w-full h-12 gap-2">
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                En continuant, vous acceptez de recevoir nos emails marketing.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
