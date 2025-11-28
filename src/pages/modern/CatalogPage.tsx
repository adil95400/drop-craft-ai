/**
 * Modern Catalog Page - Interface moderne du catalogue
 * Redirige vers le catalogue principal
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CatalogPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/products/catalogue', { replace: true });
  }, [navigate]);

  return null;
}
