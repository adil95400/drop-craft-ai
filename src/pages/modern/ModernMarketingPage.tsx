/**
 * Modern Marketing Page - Redirection vers interface marketing
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernMarketingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/marketing', { replace: true });
  }, [navigate]);

  return null;
}
