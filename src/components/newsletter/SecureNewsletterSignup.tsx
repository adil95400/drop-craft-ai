import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/common/SecureInput';
import { useToast } from '@/hooks/use-toast';
import { logError } from "@/utils/consoleCleanup";

interface SecureNewsletterSignupProps {
  className?: string;
}

export const SecureNewsletterSignup = ({ className }: SecureNewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate newsletter signup since the table doesn't exist
      // In production, this would send to an actual newsletter service
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store in localStorage as a simple fallback
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      const normalizedEmail = email.toLowerCase().trim();
      
      if (subscribers.includes(normalizedEmail)) {
        toast({
          title: "Déjà inscrit",
          description: "Cette adresse email est déjà inscrite à notre newsletter.",
          variant: "destructive",
        });
      } else {
        subscribers.push(normalizedEmail);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
        
        toast({
          title: "Inscription réussie !",
          description: "Vous avez été inscrit à notre newsletter.",
        });
        setEmail('');
      }
    } catch (error) {
      logError(error as Error, 'Error subscribing to newsletter');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-2">
        <SecureInput
          type="email"
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          maxLength={254} // RFC 5321 email length limit
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Inscription...' : "S'inscrire"}
        </Button>
      </div>
    </form>
  );
};