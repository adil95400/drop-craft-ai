import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WinnerProduct } from '../types';

export const useWinnersNotifications = (products: WinnerProduct[]) => {
  const { toast } = useToast();

  // Check for high-score products
  useEffect(() => {
    if (products.length === 0) return;

    const exceptional = products.filter(p => (p.final_score || 0) > 90);
    
    if (exceptional.length > 0) {
      const savedNotified = localStorage.getItem('winners-notified') || '[]';
      const notified = new Set(JSON.parse(savedNotified));
      
      const newExceptional = exceptional.filter(p => !notified.has(p.id));
      
      if (newExceptional.length > 0) {
        toast({
          title: "🔥 Nouveaux Winners Exceptionnels !",
          description: `${newExceptional.length} produits avec score > 90 détectés`,
          duration: 5000
        });

        // Mark as notified
        newExceptional.forEach(p => notified.add(p.id));
        localStorage.setItem('winners-notified', JSON.stringify(Array.from(notified)));
      }
    }
  }, [products, toast]);

  // Check for price drops
  const checkPriceDrops = useCallback(() => {
    const savedPrices = localStorage.getItem('winners-price-tracking') || '{}';
    const priceHistory: Record<string, number> = JSON.parse(savedPrices);
    const drops = [];

    for (const product of products) {
      const previousPrice = priceHistory[product.id];
      if (previousPrice && product.price < previousPrice * 0.9) {
        drops.push({ product, oldPrice: previousPrice, newPrice: product.price });
      }
      priceHistory[product.id] = product.price;
    }

    if (drops.length > 0) {
      toast({
        title: "💰 Baisse de prix détectée !",
        description: `${drops.length} produits ont baissé de prix`,
        duration: 5000
      });
    }

    localStorage.setItem('winners-price-tracking', JSON.stringify(priceHistory));
  }, [products, toast]);

  useEffect(() => {
    checkPriceDrops();
  }, [checkPriceDrops]);

  return {
    checkPriceDrops
  };
};
