/**
 * Modern Import Page - Redirection vers interface import
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernImportPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/products/import', { replace: true });
  }, [navigate]);

  return null;
}
