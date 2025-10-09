import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShippingService } from '@/services/ShippingService';
import { useToast } from '@/hooks/use-toast';

export const useShippingManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Shipping Zones
  const { data: shippingZones, isLoading: zonesLoading } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: ShippingService.getShippingZones
  });

  const createZone = useMutation({
    mutationFn: ShippingService.createShippingZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast({ title: 'Zone d\'expédition créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const updateZone = useMutation({
    mutationFn: ({ id, updates }: any) => ShippingService.updateShippingZone(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast({ title: 'Zone mise à jour' });
    }
  });

  const deleteZone = useMutation({
    mutationFn: ShippingService.deleteShippingZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast({ title: 'Zone supprimée' });
    }
  });

  // Warehouses
  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: ShippingService.getWarehouses
  });

  const createWarehouse = useMutation({
    mutationFn: ShippingService.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'Entrepôt créé avec succès' });
    }
  });

  const updateWarehouse = useMutation({
    mutationFn: ({ id, updates }: any) => ShippingService.updateWarehouse(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'Entrepôt mis à jour' });
    }
  });

  const deleteWarehouse = useMutation({
    mutationFn: ShippingService.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'Entrepôt supprimé' });
    }
  });

  // Shipping Rates
  const { data: shippingRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: () => ShippingService.getShippingRates()
  });

  const createRate = useMutation({
    mutationFn: ShippingService.createShippingRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast({ title: 'Tarif d\'expédition créé' });
    }
  });

  const updateRate = useMutation({
    mutationFn: ({ id, updates }: any) => ShippingService.updateShippingRate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast({ title: 'Tarif mis à jour' });
    }
  });

  const deleteRate = useMutation({
    mutationFn: ShippingService.deleteShippingRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast({ title: 'Tarif supprimé' });
    }
  });

  // Calculate Shipping
  const calculateShipping = useMutation({
    mutationFn: ShippingService.calculateShipping,
    onError: (error: Error) => {
      toast({ title: 'Erreur de calcul', description: error.message, variant: 'destructive' });
    }
  });

  // Shipment Tracking
  const { data: shipments, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => ShippingService.getShipments()
  });

  const generateTracking = useMutation({
    mutationFn: ShippingService.generateTracking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({ title: 'Numéro de suivi généré avec succès' });
    }
  });

  const updateTracking = useMutation({
    mutationFn: ShippingService.updateTracking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({ title: 'Suivi mis à jour' });
    }
  });

  const bulkGenerateTracking = useMutation({
    mutationFn: ShippingService.bulkGenerateTracking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({ title: `${data.results.filter((r: any) => r.success).length} numéros générés` });
    }
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['shipping-analytics'],
    queryFn: ShippingService.getShippingAnalytics
  });

  return {
    // Zones
    shippingZones,
    zonesLoading,
    createZone,
    updateZone,
    deleteZone,
    // Warehouses
    warehouses,
    warehousesLoading,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    // Rates
    shippingRates,
    ratesLoading,
    createRate,
    updateRate,
    deleteRate,
    // Calculator
    calculateShipping,
    isCalculating: calculateShipping.isPending,
    // Tracking
    shipments,
    shipmentsLoading,
    generateTracking,
    updateTracking,
    bulkGenerateTracking,
    // Analytics
    analytics
  };
};
