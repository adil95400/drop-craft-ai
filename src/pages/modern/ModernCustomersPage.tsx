/**
 * Modern Customers Page - Redirection vers interface clients
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModernCustomersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/customers', { replace: true });
  }, [navigate]);

  return null;
}
