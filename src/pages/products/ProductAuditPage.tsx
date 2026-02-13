/**
 * Page d'audit catalogue — Redirige vers le hub SEO unifié
 * La logique d'audit est consolidée dans ProductScoringPage (ProductSeoHub)
 */
import { Navigate } from 'react-router-dom';

export default function ProductAuditPage() {
  return <Navigate to="/products/scoring" replace />;
}
