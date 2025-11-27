import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Maximize2, Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';

interface StorePreviewProps {
  storeId: string;
  storeName: string;
  themeConfig: any;
  onRefresh?: () => void;
}

export function StorePreview({ storeId, storeName, themeConfig, onRefresh }: StorePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const deviceSizes = {
    desktop: { width: '100%', height: '800px' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  useEffect(() => {
    // Generate preview HTML based on theme configuration
    if (iframeRef.current) {
      const previewHTML = generateStoreHTML(storeName, themeConfig);
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHTML);
        iframeDoc.close();
        setIsLoading(false);
      }
    }
  }, [storeName, themeConfig]);

  const generateStoreHTML = (name: string, config: any) => {
    const primaryColor = config?.colors?.primary || '#8B5CF6';
    const secondaryColor = config?.colors?.secondary || '#D946EF';
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
          }
          .header {
            background: white;
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .nav {
            display: flex;
            gap: 2rem;
          }
          .nav a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }
          .nav a:hover {
            color: ${primaryColor};
          }
          .hero {
            padding: 4rem 2rem;
            text-align: center;
            background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
          }
          .hero h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero p {
            font-size: 1.25rem;
            color: #666;
            margin-bottom: 2rem;
          }
          .cta-button {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            border: none;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .products {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }
          .products h2 {
            font-size: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }
          .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
          }
          .product-card {
            background: white;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.2s;
          }
          .product-card:hover {
            transform: translateY(-4px);
          }
          .product-image {
            width: 100%;
            height: 250px;
            background: linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
          }
          .product-info {
            padding: 1.5rem;
          }
          .product-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .product-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: ${primaryColor};
          }
          .footer {
            background: #1a1a1a;
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            margin-top: 4rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${name}</div>
          <nav class="nav">
            <a href="#accueil">Accueil</a>
            <a href="#produits">Produits</a>
            <a href="#a-propos">À propos</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
        
        <div class="hero">
          <h1>Bienvenue chez ${name}</h1>
          <p>Découvrez notre collection exclusive de produits premium</p>
          <button class="cta-button">Explorer maintenant</button>
        </div>
        
        <div class="products">
          <h2>Nos Produits Phares</h2>
          <div class="product-grid">
            ${[1, 2, 3, 4, 5, 6].map(i => `
              <div class="product-card">
                <div class="product-image">🎁</div>
                <div class="product-info">
                  <div class="product-title">Produit Premium ${i}</div>
                  <div class="product-price">${(i * 10 + 20).toFixed(2)}€</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 ${name}. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Preview en temps réel</h3>
          <Badge variant="outline">Live</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={device === 'desktop' ? 'default' : 'outline'}
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={device === 'tablet' ? 'default' : 'outline'}
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={device === 'mobile' ? 'default' : 'outline'}
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative bg-muted rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="flex items-center justify-center p-8" style={{ backgroundColor: '#f3f4f6' }}>
          <iframe
            ref={iframeRef}
            className="bg-white rounded-lg shadow-xl transition-all duration-300"
            style={{
              width: deviceSizes[device].width,
              height: deviceSizes[device].height,
              border: 'none',
              maxWidth: '100%'
            }}
            title="Store Preview"
          />
        </div>
      </div>
    </Card>
  );
}
