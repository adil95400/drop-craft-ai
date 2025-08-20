"""
Shopify Integration - Real API implementation
"""

import httpx
import os
from typing import List, Optional, Dict, Any
import structlog
from utils.database import get_supabase_client

logger = structlog.get_logger()

class ShopifyAPI:
    def __init__(self, shop_domain: Optional[str] = None, access_token: Optional[str] = None):
        self.shop_domain = shop_domain
        self.access_token = access_token
        self.client_id = os.getenv("SHOPIFY_CLIENT_ID")
        self.client_secret = os.getenv("SHOPIFY_CLIENT_SECRET")
        self.base_url = f"https://{shop_domain}.myshopify.com" if shop_domain else None
        
    def get_oauth_url(self, shop_domain: str, redirect_uri: str) -> str:
        """Generate Shopify OAuth URL"""
        scopes = "read_products,write_products,read_orders,write_orders"
        return (
            f"https://{shop_domain}.myshopify.com/admin/oauth/authorize?"
            f"client_id={self.client_id}&"
            f"scope={scopes}&"
            f"redirect_uri={redirect_uri}&"
            f"state=nonce"
        )
    
    async def exchange_code_for_token(self, shop_domain: str, code: str) -> str:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{shop_domain}.myshopify.com/admin/oauth/access_token",
                json={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code
                }
            )
            response.raise_for_status()
            return response.json()["access_token"]
    
    async def get_products(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch products from Shopify"""
        if not self.access_token or not self.base_url:
            raise ValueError("Access token and shop domain required")
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/admin/api/2024-01/products.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"limit": limit}
            )
            response.raise_for_status()
            return response.json().get("products", [])
    
    async def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create product in Shopify"""
        if not self.access_token or not self.base_url:
            raise ValueError("Access token and shop domain required")
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/admin/api/2024-01/products.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                json={"product": product_data}
            )
            response.raise_for_status()
            return response.json()["product"]
    
    async def get_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch orders from Shopify"""
        if not self.access_token or not self.base_url:
            raise ValueError("Access token and shop domain required")
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/admin/api/2024-01/orders.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"limit": limit, "status": "any"}
            )
            response.raise_for_status()
            return response.json().get("orders", [])
    
    async def push_products(self, user_id: str, product_ids: Optional[List[str]] = None):
        """Push products from database to Shopify"""
        try:
            supabase = get_supabase_client()
            
            # Get products from database
            query = supabase.table('products').select("*").eq('user_id', user_id)
            if product_ids:
                query = query.in_('id', product_ids)
            
            result = query.execute()
            products = result.data
            
            logger.info(f"Pushing {len(products)} products to Shopify")
            
            # Convert and push each product
            for product in products:
                shopify_product = self._convert_to_shopify_format(product)
                created_product = await self.create_product(shopify_product)
                
                # Update database with Shopify ID
                supabase.table('products').update({
                    'shopify_id': str(created_product['id']),
                    'external_ids': {
                        **product.get('external_ids', {}),
                        'shopify': created_product['id']
                    }
                }).eq('id', product['id']).execute()
                
                logger.info(f"Product {product['title']} pushed to Shopify with ID {created_product['id']}")
                
        except Exception as e:
            logger.error(f"Error pushing products to Shopify: {str(e)}")
            raise
    
    async def sync_orders(self, user_id: str, shop_id: str):
        """Sync orders FROM Shopify TO database"""
        try:
            orders = await self.get_orders(limit=100)
            supabase = get_supabase_client()
            
            for order in orders:
                # Convert Shopify order to our format
                order_data = {
                    'user_id': user_id,
                    'shop_id': shop_id,
                    'external_id': str(order['id']),
                    'order_number': order['order_number'],
                    'total_amount': float(order['total_price']),
                    'currency': order['currency'],
                    'status': self._map_shopify_status(order['fulfillment_status']),
                    'customer_jsonb': {
                        'email': order.get('customer', {}).get('email'),
                        'name': f"{order.get('customer', {}).get('first_name', '')} {order.get('customer', {}).get('last_name', '')}".strip(),
                        'phone': order.get('customer', {}).get('phone')
                    },
                    'shipping_address': order.get('shipping_address', {}),
                    'billing_address': order.get('billing_address', {}),
                    'financial_status': order.get('financial_status', 'pending'),
                    'fulfillment_status': order.get('fulfillment_status', 'unfulfilled')
                }
                
                # Upsert order (insert or update if exists)
                supabase.table('orders').upsert(order_data, on_conflict='external_id').execute()
                
                # Handle order items
                for line_item in order.get('line_items', []):
                    item_data = {
                        'order_id': order_data['external_id'],  # Will be resolved by FK
                        'product_name': line_item['name'],
                        'product_sku': line_item.get('sku'),
                        'qty': line_item['quantity'],
                        'price': float(line_item['price']),
                        'total_price': float(line_item['price']) * line_item['quantity']
                    }
                    supabase.table('order_items').insert(item_data).execute()
                    
            logger.info(f"Synced {len(orders)} orders from Shopify")
            
        except Exception as e:
            logger.error(f"Error syncing orders from Shopify: {str(e)}")
            raise
    
    def _convert_to_shopify_format(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Convert database product to Shopify format"""
        return {
            "title": product['title'],
            "body_html": product.get('description', ''),
            "vendor": product.get('brand', 'Drop Craft AI'),
            "product_type": product.get('category', ''),
            "handle": product['title'].lower().replace(' ', '-'),
            "status": "active" if product.get('status') == 'active' else "draft",
            "variants": [{
                "sku": product.get('sku', ''),
                "price": str(product['sale_price']),
                "inventory_quantity": product.get('stock', 0),
                "weight": product.get('weight', 0),
                "weight_unit": "kg"
            }],
            "images": [{"src": img} for img in product.get('images', [])],
            "seo_title": product.get('seo_title'),
            "seo_description": product.get('seo_description'),
            "tags": ",".join(product.get('seo_keywords', []))
        }
    
    def _map_shopify_status(self, shopify_status: Optional[str]) -> str:
        """Map Shopify fulfillment status to our status"""
        status_map = {
            'fulfilled': 'delivered',
            'partial': 'processing',
            'restocked': 'cancelled',
            None: 'pending'
        }
        return status_map.get(shopify_status, 'pending')