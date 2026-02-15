"""
AliExpress supplier integration service
"""

import httpx
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import hashlib
import time

from .base import BaseSupplierService
from app.core.database import get_supabase

logger = logging.getLogger(__name__)


class AliExpressService(BaseSupplierService):
    """AliExpress Dropshipping API integration"""
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.app_key = config.get("app_key") if config else None
        self.app_secret = config.get("app_secret") if config else None
        self.base_url = "https://api-sg.aliexpress.com/sync"
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """Generate API signature"""
        if not self.app_secret:
            return ""
        
        sorted_params = sorted(params.items())
        sign_str = self.app_secret
        for k, v in sorted_params:
            sign_str += f"{k}{v}"
        sign_str += self.app_secret
        
        return hashlib.md5(sign_str.encode()).hexdigest().upper()
    
    async def validate_credentials(self) -> bool:
        """Validate AliExpress API credentials"""
        try:
            # Try to fetch account info
            async with httpx.AsyncClient() as client:
                params = {
                    "app_key": self.app_key,
                    "timestamp": str(int(time.time() * 1000)),
                    "method": "aliexpress.ds.member.info.get",
                    "sign_method": "md5",
                    "v": "2.0"
                }
                params["sign"] = self._generate_sign(params)
                
                response = await client.get(
                    self.base_url,
                    params=params,
                    timeout=30
                )
                
                data = response.json()
                return "error_response" not in data
                
        except Exception as e:
            logger.error(f"AliExpress credential validation failed: {e}")
            return False
    
    def sync_products(
        self,
        user_id: str,
        limit: int = 1000,
        category_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sync products from AliExpress"""
        import httpx
        
        logger.info(f"Starting AliExpress product sync for user {user_id}")
        
        # Note: AliExpress API requires specific permissions
        # This is a simplified implementation
        
        products_fetched = 0
        products_saved = 0
        errors = []
        
        try:
            params = {
                "app_key": self.app_key,
                "timestamp": str(int(time.time() * 1000)),
                "method": "aliexpress.ds.product.get",
                "sign_method": "md5",
                "v": "2.0",
                "page_size": min(limit, 50),
                "page_no": 1
            }
            
            if category_filter:
                params["category_id"] = category_filter
            
            params["sign"] = self._generate_sign(params)
            
            with httpx.Client(timeout=60) as client:
                response = client.get(self.base_url, params=params)
                
                if response.status_code != 200:
                    raise Exception(f"AliExpress API error: {response.status_code}")
                
                data = response.json()
                
                if "error_response" in data:
                    raise Exception(data["error_response"].get("msg", "Unknown error"))
                
                products = data.get("aliexpress_ds_product_get_response", {}).get("products", {}).get("product", [])
                products_fetched = len(products)
                
                supabase = get_supabase()
                
                for raw_product in products:
                    try:
                        normalized = self.normalize_product(raw_product)
                        
                        supabase.table("products").upsert({
                            "user_id": user_id,
                            "supplier": "aliexpress",
                            "supplier_product_id": str(normalized["external_id"]),
                            "title": normalized["title"],
                            "description": normalized["description"],
                            "cost_price": normalized["cost_price"],
                            "stock_quantity": normalized["stock_quantity"],
                            "images": normalized["images"],
                            "category": normalized["category"],
                            "status": "draft",
                            "updated_at": datetime.utcnow().isoformat()
                        }, on_conflict="supplier,supplier_product_id,user_id").execute()
                        
                        products_saved += 1
                        
                    except Exception as e:
                        errors.append(str(e))
                
        except Exception as e:
            logger.error(f"AliExpress sync error: {e}")
            errors.append(str(e))
        
        return {
            "fetched": products_fetched,
            "saved": products_saved,
            "errors": errors[:10]
        }
    
    def sync_stock(self, user_id: str) -> Dict[str, Any]:
        """Sync stock levels - AliExpress requires per-product checks"""
        logger.info(f"AliExpress stock sync for user {user_id}")
        
        # AliExpress doesn't have bulk stock API
        # Would need to check each product individually
        
        return {"updated": 0, "note": "Per-product stock check required"}
    
    def get_product_details(self, product_id: str) -> Dict[str, Any]:
        """Get detailed product info from AliExpress"""
        import httpx
        
        params = {
            "app_key": self.app_key,
            "timestamp": str(int(time.time() * 1000)),
            "method": "aliexpress.ds.product.get",
            "sign_method": "md5",
            "v": "2.0",
            "product_id": product_id
        }
        params["sign"] = self._generate_sign(params)
        
        with httpx.Client(timeout=30) as client:
            response = client.get(self.base_url, params=params)
            data = response.json()
            
            if "error_response" in data:
                raise Exception(data["error_response"].get("msg", "Product not found"))
            
            product = data.get("aliexpress_ds_product_get_response", {}).get("result", {})
            return self.normalize_product(product)
    
    def place_order(
        self,
        product_id: str,
        quantity: int,
        shipping_address: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Place dropshipping order with AliExpress"""
        import httpx
        
        params = {
            "app_key": self.app_key,
            "timestamp": str(int(time.time() * 1000)),
            "method": "aliexpress.ds.order.create",
            "sign_method": "md5",
            "v": "2.0"
        }
        
        order_data = {
            "product_id": product_id,
            "product_count": quantity,
            "logistics_address": {
                "contact_person": f"{shipping_address.get('first_name')} {shipping_address.get('last_name')}",
                "country": shipping_address.get("country_code"),
                "province": shipping_address.get("state"),
                "city": shipping_address.get("city"),
                "address": shipping_address.get("address1"),
                "address2": shipping_address.get("address2", ""),
                "zip": shipping_address.get("postal_code"),
                "phone_country": shipping_address.get("phone_country", "+1"),
                "mobile_no": shipping_address.get("phone")
            }
        }
        
        params["param_place_order_request4_open_api_d_t_o"] = str(order_data)
        params["sign"] = self._generate_sign(params)
        
        with httpx.Client(timeout=60) as client:
            response = client.post(self.base_url, params=params)
            data = response.json()
            
            if "error_response" in data:
                raise Exception(data["error_response"].get("msg", "Order creation failed"))
            
            return data.get("aliexpress_ds_order_create_response", {})
    
    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status from AliExpress"""
        import httpx
        
        params = {
            "app_key": self.app_key,
            "timestamp": str(int(time.time() * 1000)),
            "method": "aliexpress.ds.order.get",
            "sign_method": "md5",
            "v": "2.0",
            "order_id": order_id
        }
        params["sign"] = self._generate_sign(params)
        
        with httpx.Client(timeout=30) as client:
            response = client.get(self.base_url, params=params)
            data = response.json()
            
            if "error_response" in data:
                raise Exception(data["error_response"].get("msg", "Order not found"))
            
            order = data.get("aliexpress_ds_order_get_response", {}).get("result", {})
            
            return {
                "order_id": order_id,
                "status": order.get("order_status"),
                "tracking_number": order.get("logistics_info_list", [{}])[0].get("logistics_no"),
                "carrier": order.get("logistics_info_list", [{}])[0].get("logistics_company"),
                "shipped_at": order.get("gmt_send_goods")
            }
    
    def normalize_product(self, raw_product: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize AliExpress product to standard format"""
        return {
            "external_id": raw_product.get("product_id"),
            "title": raw_product.get("product_title") or raw_product.get("subject"),
            "description": raw_product.get("product_description"),
            "price": float(raw_product.get("target_sale_price", 0) or 0),
            "cost_price": float(raw_product.get("target_original_price", 0) or 0),
            "currency": raw_product.get("target_sale_price_currency", "USD"),
            "stock_quantity": 999,  # AliExpress doesn't always provide stock
            "sku": raw_product.get("product_id"),
            "images": [raw_product.get("product_main_image_url")] + 
                      raw_product.get("product_small_image_urls", {}).get("string", []),
            "category": raw_product.get("first_level_category_name"),
            "weight": None,
            "dimensions": None,
            "attributes": {
                "second_category": raw_product.get("second_level_category_name"),
                "ship_to_days": raw_product.get("ship_to_days"),
                "orders": raw_product.get("lastest_volume")
            },
            "raw_data": raw_product
        }
