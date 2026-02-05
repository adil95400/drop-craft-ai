"""
Base supplier service interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class BaseSupplierService(ABC):
    """Abstract base class for supplier integrations"""
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        self.api_key = api_key
        self.config = config or {}
    
    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Validate API credentials"""
        pass
    
    @abstractmethod
    def sync_products(
        self,
        user_id: str,
        limit: int = 1000,
        category_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sync products from supplier"""
        pass
    
    @abstractmethod
    def sync_stock(self, user_id: str) -> Dict[str, Any]:
        """Sync stock levels"""
        pass
    
    @abstractmethod
    def get_product_details(self, product_id: str) -> Dict[str, Any]:
        """Get detailed product information"""
        pass
    
    @abstractmethod
    def place_order(
        self,
        product_id: str,
        quantity: int,
        shipping_address: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Place an order with the supplier"""
        pass
    
    @abstractmethod
    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status and tracking"""
        pass
    
    def normalize_product(self, raw_product: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize product data to standard format"""
        # Default implementation - override for supplier-specific normalization
        return {
            "external_id": raw_product.get("id"),
            "title": raw_product.get("name") or raw_product.get("title"),
            "description": raw_product.get("description"),
            "price": raw_product.get("price"),
            "cost_price": raw_product.get("cost_price") or raw_product.get("wholesale_price"),
            "currency": raw_product.get("currency", "EUR"),
            "stock_quantity": raw_product.get("stock") or raw_product.get("quantity"),
            "sku": raw_product.get("sku"),
            "images": raw_product.get("images", []),
            "category": raw_product.get("category"),
            "weight": raw_product.get("weight"),
            "dimensions": raw_product.get("dimensions"),
            "attributes": raw_product.get("attributes", {}),
            "raw_data": raw_product
        }
