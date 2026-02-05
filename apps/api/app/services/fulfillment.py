"""
Fulfillment Service - Handle order fulfillment with suppliers
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.core.database import get_supabase
from app.services.suppliers import get_supplier_service

logger = logging.getLogger(__name__)


class FulfillmentService:
    """Automated order fulfillment service"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def fulfill_order(
        self,
        user_id: str,
        order_id: str,
        supplier_id: Optional[str] = None,
        auto_select: bool = True
    ) -> Dict[str, Any]:
        """Fulfill an order with the appropriate supplier"""
        
        logger.info(f"Starting fulfillment for order {order_id}")
        
        # Get order details
        order_result = self.supabase.table("orders").select(
            "*, order_items(*)"
        ).eq("id", order_id).eq("user_id", user_id).single().execute()
        
        if not order_result.data:
            raise ValueError(f"Order not found: {order_id}")
        
        order = order_result.data
        items = order.get("order_items", [])
        
        if not items:
            raise ValueError("Order has no items to fulfill")
        
        # Track fulfillment results
        results = {
            "order_id": order_id,
            "items_fulfilled": 0,
            "items_failed": 0,
            "supplier_orders": [],
            "tracking_numbers": []
        }
        
        # Group items by supplier
        supplier_groups = self._group_by_supplier(items, supplier_id, auto_select)
        
        for supplier, supplier_items in supplier_groups.items():
            try:
                # Get supplier service
                service = get_supplier_service(supplier)
                
                # Prepare supplier order
                supplier_order = self._prepare_supplier_order(order, supplier_items)
                
                # Submit order to supplier
                supplier_result = service.create_order(supplier_order)
                
                results["supplier_orders"].append({
                    "supplier": supplier,
                    "supplier_order_id": supplier_result.get("order_id"),
                    "status": supplier_result.get("status", "pending"),
                    "items": len(supplier_items)
                })
                
                if supplier_result.get("tracking_number"):
                    results["tracking_numbers"].append({
                        "supplier": supplier,
                        "tracking_number": supplier_result["tracking_number"],
                        "carrier": supplier_result.get("carrier")
                    })
                
                results["items_fulfilled"] += len(supplier_items)
                
                # Update order items status
                for item in supplier_items:
                    self._update_item_status(
                        item["id"],
                        "ordered",
                        supplier_result.get("order_id")
                    )
                    
            except Exception as e:
                logger.error(f"Fulfillment failed for supplier {supplier}: {e}")
                results["items_failed"] += len(supplier_items)
                
                for item in supplier_items:
                    self._update_item_status(item["id"], "failed", error=str(e))
        
        # Update order status
        new_status = self._determine_order_status(results)
        self._update_order_status(order_id, new_status, results)
        
        results["order_status"] = new_status
        return results
    
    def _group_by_supplier(
        self,
        items: List[Dict[str, Any]],
        preferred_supplier: Optional[str],
        auto_select: bool
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group order items by supplier"""
        
        groups = {}
        
        for item in items:
            product_id = item.get("product_id")
            
            if preferred_supplier:
                supplier = preferred_supplier
            elif auto_select:
                supplier = self._select_best_supplier(product_id)
            else:
                supplier = item.get("supplier_id") or "default"
            
            if supplier not in groups:
                groups[supplier] = []
            groups[supplier].append(item)
        
        return groups
    
    def _select_best_supplier(self, product_id: str) -> str:
        """Select best supplier for a product based on price, reliability, shipping time"""
        
        # Get product supplier links
        result = self.supabase.table("product_supplier_links").select(
            "supplier_id, price, stock, delivery_days"
        ).eq("product_id", product_id).eq("is_active", True).execute()
        
        if not result.data:
            return "bigbuy"  # Default supplier
        
        # Sort by price and delivery time
        suppliers = sorted(
            result.data,
            key=lambda x: (x.get("price", 999999), x.get("delivery_days", 30))
        )
        
        # Return best supplier with stock
        for supplier in suppliers:
            if supplier.get("stock", 0) > 0:
                return supplier["supplier_id"]
        
        return suppliers[0]["supplier_id"]
    
    def _prepare_supplier_order(
        self,
        order: Dict[str, Any],
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Prepare order data for supplier API"""
        
        # Get shipping address
        shipping = order.get("shipping_address", {})
        if isinstance(shipping, str):
            import json
            shipping = json.loads(shipping)
        
        return {
            "reference": order.get("order_number", order["id"]),
            "shipping_address": {
                "first_name": shipping.get("first_name", ""),
                "last_name": shipping.get("last_name", ""),
                "address1": shipping.get("address1", ""),
                "address2": shipping.get("address2", ""),
                "city": shipping.get("city", ""),
                "postal_code": shipping.get("postal_code", ""),
                "country_code": shipping.get("country_code", "FR"),
                "phone": shipping.get("phone", ""),
                "email": order.get("customer_email", "")
            },
            "items": [
                {
                    "sku": item.get("sku"),
                    "quantity": item.get("quantity", 1),
                    "supplier_sku": item.get("supplier_sku"),
                    "product_id": item.get("product_id")
                }
                for item in items
            ],
            "notes": order.get("notes", ""),
            "shipping_method": order.get("shipping_method", "standard")
        }
    
    def _update_item_status(
        self,
        item_id: str,
        status: str,
        supplier_order_id: str = None,
        error: str = None
    ):
        """Update order item fulfillment status"""
        
        update_data = {
            "fulfillment_status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if supplier_order_id:
            update_data["supplier_order_id"] = supplier_order_id
        if error:
            update_data["fulfillment_error"] = error
        
        self.supabase.table("order_items").update(update_data).eq("id", item_id).execute()
    
    def _update_order_status(
        self,
        order_id: str,
        status: str,
        fulfillment_data: Dict[str, Any]
    ):
        """Update overall order status"""
        
        self.supabase.table("orders").update({
            "status": status,
            "fulfillment_data": fulfillment_data,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", order_id).execute()
    
    def _determine_order_status(self, results: Dict[str, Any]) -> str:
        """Determine overall order status based on fulfillment results"""
        
        if results["items_failed"] == 0 and results["items_fulfilled"] > 0:
            return "fulfilled"
        elif results["items_fulfilled"] > 0 and results["items_failed"] > 0:
            return "partially_fulfilled"
        elif results["items_failed"] > 0:
            return "fulfillment_failed"
        else:
            return "pending"
    
    def get_fulfillment_status(self, order_id: str) -> Dict[str, Any]:
        """Get current fulfillment status for an order"""
        
        order_result = self.supabase.table("orders").select(
            "id, status, fulfillment_data"
        ).eq("id", order_id).single().execute()
        
        if not order_result.data:
            raise ValueError(f"Order not found: {order_id}")
        
        # Get order items with tracking
        items_result = self.supabase.table("order_items").select(
            "id, product_id, quantity, fulfillment_status, tracking_number, carrier"
        ).eq("order_id", order_id).execute()
        
        return {
            "order_id": order_id,
            "status": order_result.data.get("status"),
            "fulfillment_data": order_result.data.get("fulfillment_data", {}),
            "items": items_result.data
        }
    
    def update_tracking(
        self,
        order_id: str,
        tracking_number: str,
        carrier: str,
        item_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Update tracking information for order items"""
        
        update_data = {
            "tracking_number": tracking_number,
            "carrier": carrier,
            "fulfillment_status": "shipped",
            "shipped_at": datetime.utcnow().isoformat()
        }
        
        query = self.supabase.table("order_items").update(update_data).eq("order_id", order_id)
        
        if item_ids:
            query = query.in_("id", item_ids)
        
        query.execute()
        
        # Update order status
        self.supabase.table("orders").update({
            "status": "shipped",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", order_id).execute()
        
        return {"success": True, "tracking_number": tracking_number}
