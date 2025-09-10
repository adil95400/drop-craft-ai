/**
 * Bouton avec état de chargement asynchrone
 */
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AsyncButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void> | void;
  loadingText?: string;
  successText?: string;
  successMessage?: string; // Alias pour successText pour compatibilité
  showSuccessState?: boolean;
  icon?: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  loadingText = "Chargement...",
  successText,
  successMessage,
  showSuccessState = false,
  disabled,
  children,
  icon,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Utiliser successMessage si fourni, sinon successText, sinon "Terminé"
  const finalSuccessText = successMessage || successText || "Terminé";

  const handleClick = async () => {
    if (loading || disabled) return;
    
    try {
      setLoading(true);
      setSuccess(false);
      await onClick();
      
      if (showSuccessState || successMessage) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (error) {
      console.error('AsyncButton error:', error);
      // L'erreur est gérée par le hook useAdminActions
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : success ? (
        finalSuccessText
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};