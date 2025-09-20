import React from 'react'
import { OrderCentralization } from '@/components/orders/OrderCentralization'

const OrdersCenter: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centre de Commandes</h1>
        <p className="text-muted-foreground mt-2">
          Centralisation et gestion automatique de toutes vos commandes multi-plateformes
        </p>
      </div>
      <OrderCentralization />
    </div>
  )
}

export default OrdersCenter