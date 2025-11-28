/**
 * Modern Products Page - Redirection vers interface produits
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernProductsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/products', { replace: true });
  }, [navigate]);

  return null;
}
