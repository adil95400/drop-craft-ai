/**
 * Modern Billing Page - Redirection vers interface facturation
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernBillingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/billing', { replace: true });
  }, [navigate]);

  return null;
}
