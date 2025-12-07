import { SwaggerDocumentation } from '@/components/api/SwaggerDocumentation';
import { Helmet } from 'react-helmet-async';

export default function SwaggerPage() {
  return (
    <>
      <Helmet>
        <title>API Documentation - Swagger | ShopOpti</title>
        <meta name="description" content="Documentation API interactive Swagger pour ShopOpti - Explorez et testez tous les endpoints REST" />
      </Helmet>
      <SwaggerDocumentation />
    </>
  );
}
