/**
 * useCrossModuleRealtime — Realtime listeners for key tables
 * Emits CrossModuleEventBus events on INSERT/UPDATE to orders, products, pricing_rules
 * Complements the polling-based useAutoEmitCrossModuleEvents with instant reactivity.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCrossModuleEvents } from '@/services/cross-module/CrossModuleEventBus';
import { useAuth } from '@/contexts/AuthContext';

export function useCrossModuleRealtime() {
  const emit = useCrossModuleEvents(s => s.emit);
  const { user } = useAuth();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('cross-module-realtime')
      // Orders: new order → stock / fulfillment / marketing
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const order = payload.new as any;
        if (!order?.id || order.user_id !== user.id) return;
        if (processedIds.current.has(`order-${order.id}`)) return;
        processedIds.current.add(`order-${order.id}`);

        emit('orders.created', 'realtime-orders', {
          orderId: order.id,
          total: order.total_amount,
          status: order.status,
        });
      })
      // Products: imported / updated → pricing rules application
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        const product = payload.new as any;
        if (!product?.id || product.user_id !== user.id) return;
        if (processedIds.current.has(`prod-${product.id}`)) return;
        processedIds.current.add(`prod-${product.id}`);

        emit('products.imported', 'realtime-products', {
          productId: product.id,
          title: product.title,
          hasPrice: (product.price || 0) > 0,
          hasCost: (product.cost_price || 0) > 0,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        const newP = payload.new as any;
        const oldP = payload.old as any;
        if (!newP?.id || newP.user_id !== user.id) return;

        // Stock change detection
        if (oldP.stock_quantity !== newP.stock_quantity) {
          if ((newP.stock_quantity || 0) <= 5 && (newP.stock_quantity || 0) > 0) {
            emit('stock.low', 'realtime-stock', {
              productId: newP.id,
              title: newP.title,
              stock: newP.stock_quantity,
            });
          }
          emit('stock.updated', 'realtime-stock', {
            productId: newP.id,
            oldStock: oldP.stock_quantity,
            newStock: newP.stock_quantity,
          });
        }

        // Price change detection
        if (oldP.price !== newP.price) {
          emit('pricing.auto_adjusted', 'realtime-pricing', {
            productId: newP.id,
            oldPrice: oldP.price,
            newPrice: newP.price,
          });
        }
      })
      .subscribe();

    // Bounded set cleanup
    const cleanup = setInterval(() => {
      if (processedIds.current.size > 500) {
        const arr = [...processedIds.current];
        processedIds.current = new Set(arr.slice(-200));
      }
    }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanup);
    };
  }, [user?.id, emit]);
}
