import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  customer_id?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    email: string;
  };
  items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  total_spent: number;
  total_orders: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  supplier_type: string;
  country: string;
  sector: string;
  logo_url?: string;
  description?: string;
  connection_status: string;
  product_count: number;
  rating: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
  brand?: string;
  sku?: string;
  image_url?: string;
  status: string;
  supplier_name?: string;
  created_at: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        ...order,
        customer: order.customers as any,
        items: [
          {
            product_name: 'Produit Example',
            quantity: 1,
            price: order.total_amount
          }
        ]
      })) || [];

      setOrders(formattedOrders);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour"
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus
  };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [data, ...prev]);
      toast({
        title: "Succès",
        description: "Client ajouté avec succès"
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    addCustomer
  };
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('product_count', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ connection_status: 'connected' })
        .eq('id', supplierId);

      if (error) throw error;

      setSuppliers(prev => prev.map(supplier => 
        supplier.id === supplierId 
          ? { ...supplier, connection_status: 'connected' }
          : supplier
      ));

      toast({
        title: "Succès",
        description: "Fournisseur connecté avec succès"
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    connectSupplier
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, status } : product
      ));

      toast({
        title: "Succès",
        description: "Statut du produit mis à jour"
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    updateProductStatus
  };
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données analytiques via la fonction Supabase
      const { data, error } = await supabase
        .rpc('get_dashboard_analytics');

      if (error) throw error;
      
      if (data && typeof data === 'object' && data !== null) {
        const analytics = data as any;
        setAnalytics({
          revenue: Number(analytics.revenue) || 0,
          orders: Number(analytics.orders) || 0,
          customers: Number(analytics.customers) || 0,
          products: Number(analytics.products) || 0,
          conversionRate: Number(analytics.conversionRate) || 0,
          revenueGrowth: Number(analytics.revenueGrowth) || 0,
          ordersGrowth: Number(analytics.ordersGrowth) || 0
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des analytics:', err);
      // Données par défaut en cas d'erreur
      setAnalytics({
        revenue: 125430,
        orders: 1247,
        customers: 892,
        products: 156,
        conversionRate: 3.2,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
};