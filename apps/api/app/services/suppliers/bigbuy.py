"""
BigBuy supplier integration service
"""

import httpx
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from .base import BaseSupplierService
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

BIGBUY_API_BASE = "https://api.bigbuy.eu"


class BigBuyService(BaseSupplierService):
    """BigBuy API integration"""
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.base_url = BIGBUY_API_BASE
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def validate_credentials(self) -> bool:
        """Validate BigBuy API credentials"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/rest/user/purse.json",
                    headers=self.headers,
                    timeout=30
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"BigBuy credential validation failed: {e}")
            return False
    
    def sync_products(
        self,
        user_id: str,
        limit: int = 1000,
        category_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sync products from BigBuy catalog"""
        import httpx
        
        logger.info(f"Starting BigBuy product sync for user {user_id}")
        
        products_fetched = 0
        products_saved = 0
        errors = []
        
        try:
            with httpx.Client(timeout=60) as client:
                # Get product catalog
                params = {
                    "isoCode": self.config.get("language", "fr"),
                    "pageSize": min(limit, 100)
                }
                
                if category_filter:
                    params["category"] = category_filter
                
                response = client.get(
                    f"{self.base_url}/rest/catalog/products.json",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code != 200:
                    raise Exception(f"BigBuy API error: {response.status_code}")
                
                products = response.json()
                products_fetched = len(products)
                
                # Save to database
                supabase = get_supabase()
                
                for raw_product in products[:limit]:
                    try:
                        normalized = self.normalize_product(raw_product)
                        
                        # Upsert product into unified `products` table
                        supabase.table("products").upsert({
                            "user_id": user_id,
                            "supplier": "bigbuy",
                            "supplier_product_id": str(normalized["external_id"]),
                            "title": normalized["title"],
                            "description": normalized["description"],
                            "cost_price": normalized["cost_price"],
                            "stock_quantity": normalized["stock_quantity"],
                            "sku": normalized["sku"],
                            "images": normalized["images"],
                            "category": normalized["category"],
                            "status": "draft",
                            "updated_at": datetime.utcnow().isoformat()
                        }, on_conflict="supplier,supplier_product_id,user_id").execute()
                        
                        products_saved += 1
                        
                    except Exception as e:
                        errors.append(str(e))
                        logger.warning(f"Failed to save BigBuy product: {e}")
                
        except Exception as e:
            logger.error(f"BigBuy sync error: {e}")
            errors.append(str(e))
        
        return {
            "fetched": products_fetched,
            "saved": products_saved,
            "errors": errors[:10]  # Limit error list
        }
    
    def sync_stock(self, user_id: str) -> Dict[str, Any]:
        """Sync stock levels from BigBuy"""
        import httpx
        
        logger.info(f"Syncing BigBuy stock for user {user_id}")
        
        updated = 0
        
        try:
            with httpx.Client(timeout=60) as client:
                response = client.get(
                    f"{self.base_url}/rest/catalog/productsstockbyreference.json",
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    raise Exception(f"BigBuy stock API error: {response.status_code}")
                
                stock_data = response.json()
                supabase = get_supabase()
                
                for item in stock_data:
                    sku = item.get("sku")
                    stock = item.get("stocks", [{}])[0].get("quantity", 0)
                    
                    if sku:
                        result = supabase.table("products")\
                            .update({
                                "stock_quantity": stock,
                                "updated_at": datetime.utcnow().isoformat()
                            })\
                            .eq("user_id", user_id)\
                            .eq("supplier", "bigbuy")\
                            .eq("sku", sku)\
                            .execute()
                        
                        if result.data:
                            updated += 1
                
        except Exception as e:
            logger.error(f"BigBuy stock sync error: {e}")
        
        return {"updated": updated}
    
    def get_product_details(self, product_id: str) -> Dict[str, Any]:
        """Get detailed product info from BigBuy"""
        import httpx
        
        with httpx.Client(timeout=30) as client:
            response = client.get(
                f"{self.base_url}/rest/catalog/product/{product_id}.json",
                headers=self.headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Product not found: {product_id}")
            
            return self.normalize_product(response.json())
    
    def place_order(
        self,
        product_id: str,
        quantity: int,
        shipping_address: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Place order with BigBuy"""
        import httpx
        
        order_data = {
            "internalReference": f"SHOP_{datetime.utcnow().timestamp()}",
            "cashOnDelivery": False,
            "language": self.config.get("language", "fr"),
            "paymentMethod": "moneybox",
            "carriers": [{"name": "standard"}],
            "shippingAddress": {
                "firstName": shipping_address.get("first_name"),
                "lastName": shipping_address.get("last_name"),
                "country": shipping_address.get("country_code"),
                "postcode": shipping_address.get("postal_code"),
                "town": shipping_address.get("city"),
                "address": shipping_address.get("address1"),
                "phone": shipping_address.get("phone"),
                "email": shipping_address.get("email")
            },
            "products": [
                {"reference": product_id, "quantity": quantity}
            ]
        }
        
        with httpx.Client(timeout=60) as client:
            response = client.post(
                f"{self.base_url}/rest/order/create.json",
                headers=self.headers,
                json=order_data
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Order creation failed: {response.text}")
            
            return response.json()
    
    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status from BigBuy"""
        import httpx
        
        with httpx.Client(timeout=30) as client:
            response = client.get(
                f"{self.base_url}/rest/order/{order_id}.json",
                headers=self.headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Order not found: {order_id}")
            
            data = response.json()
            
            return {
                "order_id": order_id,
                "status": data.get("status"),
                "tracking_number": data.get("trackingNumber"),
                "carrier": data.get("carrier"),
                "shipped_at": data.get("dateShipped")
            }
    
    def normalize_product(self, raw_product: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize BigBuy product to standard format"""
        return {
            "external_id": raw_product.get("id"),
            "title": raw_product.get("name"),
            "description": raw_product.get("description"),
            "price": raw_product.get("retailPrice"),
            "cost_price": raw_product.get("wholesalePrice"),
            "currency": "EUR",
            "stock_quantity": raw_product.get("stock", 0),
            "sku": raw_product.get("sku"),
            "images": [img.get("url") for img in raw_product.get("images", [])],
            "category": raw_product.get("category", {}).get("name"),
            "weight": raw_product.get("weight"),
            "dimensions": {
                "height": raw_product.get("height"),
                "width": raw_product.get("width"),
                "depth": raw_product.get("depth")
            },
            "attributes": raw_product.get("attributes", {}),
            "raw_data": raw_product
        }
