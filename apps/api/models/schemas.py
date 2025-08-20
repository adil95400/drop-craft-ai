"""
Pydantic models for API requests and responses
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

# === IMPORT SCHEMAS ===

class URLImportRequest(BaseModel):
    url: HttpUrl
    mapping_config: Optional[Dict[str, Any]] = {}

class XMLImportRequest(BaseModel):
    url: HttpUrl
    mapping_config: Optional[Dict[str, Any]] = {}

class FTPSyncRequest(BaseModel):
    host: str
    username: str
    password: str
    directory: str = "/"
    file_patterns: Optional[List[str]] = ["*.csv", "*.xml"]

# === SUPPLIER SCHEMAS ===

class BigBuySyncRequest(BaseModel):
    api_key: str
    category_filter: Optional[str] = None
    limit: Optional[int] = 100

# === SHOPIFY SCHEMAS ===

class ShopifyConnectRequest(BaseModel):
    shop_domain: str
    redirect_uri: str

class ShopifySyncRequest(BaseModel):
    shop_domain: str
    access_token: str
    product_ids: Optional[List[str]] = None

# === AI SCHEMAS ===

class SEOGenerationRequest(BaseModel):
    product_id: str
    language: Optional[str] = "fr"
    fields: Optional[List[str]] = ["title", "description", "keywords"]

# === PRODUCT SCHEMAS ===

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sku: Optional[str] = None
    cost_price: Optional[float] = 0
    sale_price: float
    currency: str = "EUR"
    stock: Optional[int] = 0
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    images: Optional[List[str]] = []
    attributes: Optional[Dict[str, Any]] = {}

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    currency: Optional[str] = None
    stock: Optional[int] = None
    status: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    images: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None

# === ORDER SCHEMAS ===

class OrderResponse(BaseModel):
    id: str
    order_number: str
    total_amount: float
    currency: str
    status: str
    customer_jsonb: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

# === INTEGRATION SCHEMAS ===

class IntegrationResponse(BaseModel):
    id: str
    platform: str
    name: str
    domain: Optional[str]
    enabled: bool
    connected_at: Optional[datetime]
    last_sync_at: Optional[datetime]

# === RESPONSE SCHEMAS ===

class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None