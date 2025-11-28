/**
 * Modern Orders Page - Redirection vers interface commandes
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernOrdersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/orders', { replace: true });
  }, [navigate]);

  return null;
}
