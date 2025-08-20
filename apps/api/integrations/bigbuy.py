"""
BigBuy Integration - Real API implementation
"""

import httpx
import os
from typing import List, Optional, Dict, Any
import structlog
from utils.database import get_supabase_client

logger = structlog.get_logger()

class BigBuyAPI:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("BIGBUY_API_KEY")
        self.base_url = "https://api.bigbuy.eu"
        
    async def get_catalog(self, category_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch products from BigBuy catalog"""
        if not self.api_key:
            raise ValueError("BigBuy API key is required")
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"limit": limit}
        
        if category_id:
            params["categoryId"] = category_id
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/catalog/products.json",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    async def get_product_info(self, product_id: str) -> Dict[str, Any]:
        """Get detailed product information"""
        if not self.api_key:
            raise ValueError("BigBuy API key is required")
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/catalog/products/{product_id}.json",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_stock_and_prices(self, product_ids: List[str]) -> Dict[str, Any]:
        """Get real-time stock and prices for products"""
        if not self.api_key:
            raise ValueError("BigBuy API key is required")
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/rest/catalog/products/stock.json",
                headers=headers,
                json={"products": product_ids}
            )
            response.raise_for_status()
            return response.json()
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Fetch BigBuy categories"""
        if not self.api_key:
            raise ValueError("BigBuy API key is required")
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/catalog/categories.json",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    async def sync_catalog(self, user_id: str, category_filter: Optional[str] = None, limit: int = 100):
        """Sync BigBuy catalog to database"""
        try:
            products = await self.get_catalog(category_filter, limit)
            supabase = get_supabase_client()
            
            # Get or create BigBuy supplier
            supplier_result = supabase.table('suppliers').select("*").eq('name', 'BigBuy').eq('user_id', user_id).execute()
            
            if not supplier_result.data:
                supplier_data = {
                    'user_id': user_id,
                    'name': 'BigBuy',
                    'type': 'api',
                    'enabled': True,
                    'website': 'https://www.bigbuy.eu',
                    'country': 'ES',
                    'rating': 4.5,
                    'api_endpoint': self.base_url
                }
                supplier_result = supabase.table('suppliers').insert(supplier_data).execute()
            
            supplier_id = supplier_result.data[0]['id']
            
            logger.info(f"Syncing {len(products)} products from BigBuy")
            
            # Convert and insert products
            for product in products:
                product_data = await self._convert_to_standard_format(product, user_id, supplier_id)
                
                # Upsert product (insert or update if SKU exists)
                supabase.table('products').upsert(product_data, on_conflict='sku').execute()
                
            logger.info(f"Successfully synced {len(products)} products from BigBuy")
            
        except Exception as e:
            logger.error(f"Error syncing BigBuy catalog: {str(e)}")
            raise
    
    async def _convert_to_standard_format(self, bigbuy_product: Dict[str, Any], user_id: str, supplier_id: str) -> Dict[str, Any]:
        """Convert BigBuy product to standard format"""
        
        # Get detailed product info for better data
        try:
            detailed_product = await self.get_product_info(str(bigbuy_product['id']))
        except:
            detailed_product = bigbuy_product
        
        return {
            'user_id': user_id,
            'supplier_id': supplier_id,
            'sku': f"BB_{bigbuy_product['id']}",
            'title': bigbuy_product.get('name', ''),
            'description': detailed_product.get('description', ''),
            'brand': bigbuy_product.get('brand', {}).get('name', ''),
            'cost_price': float(bigbuy_product.get('wholesalePrice', 0)),
            'sale_price': float(bigbuy_product.get('retailPrice', 0)),
            'currency': 'EUR',
            'stock': bigbuy_product.get('stock', 0),
            'weight': bigbuy_product.get('weight', 0),
            'barcode': bigbuy_product.get('ean'),
            'status': 'active' if bigbuy_product.get('active') else 'inactive',
            'images': [img.get('url') for img in bigbuy_product.get('images', []) if img.get('url')],
            'attributes': {
                'bigbuy_id': bigbuy_product['id'],
                'category': bigbuy_product.get('category', {}).get('name'),
                'tags': bigbuy_product.get('tags', []),
                'variations': bigbuy_product.get('variations', []),
                'shipping_info': bigbuy_product.get('shippingInfo', {}),
                'dimensions': {
                    'width': bigbuy_product.get('width'),
                    'height': bigbuy_product.get('height'),
                    'length': bigbuy_product.get('length')
                }
            },
            'external_ids': {
                'bigbuy': bigbuy_product['id']
            },
            'profit_margin': self._calculate_profit_margin(
                float(bigbuy_product.get('wholesalePrice', 0)),
                float(bigbuy_product.get('retailPrice', 0))
            )
        }
    
    def _calculate_profit_margin(self, cost: float, price: float) -> float:
        """Calculate profit margin percentage"""
        if cost == 0:
            return 0
        return round(((price - cost) / cost) * 100, 2)