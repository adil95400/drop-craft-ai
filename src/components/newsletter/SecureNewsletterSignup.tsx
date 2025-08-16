import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/common/SecureInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Get user's IP for rate limiting (in production, this would be done server-side)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase
        .from('newsletters')
        .insert({
          email: email.toLowerCase().trim(),
          ip_address: ip,
          created_at_date: new Date().toISOString().split('T')[0],
          source: 'website'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Déjà inscrit",
            description: "Cette adresse email est déjà inscrite à notre newsletter.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Inscription réussie !",
          description: "Vous avez été inscrit à notre newsletter.",
        });
        setEmail('');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
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