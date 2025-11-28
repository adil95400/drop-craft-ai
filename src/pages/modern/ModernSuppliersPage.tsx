/**
 * Modern Suppliers Page - Redirection vers interface fournisseurs
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernSuppliersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/products/suppliers', { replace: true });
  }, [navigate]);

  return null;
}
