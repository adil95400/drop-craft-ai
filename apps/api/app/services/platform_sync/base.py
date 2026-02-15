"""
Base adapter interface for platform sync (Shopify, WooCommerce, etc.)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class SyncResult:
    success: bool = True
    synced: int = 0
    failed: int = 0
    errors: List[Dict[str, str]] = field(default_factory=list)
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PlatformProduct:
    """Normalized product representation for cross-platform sync"""
    external_id: Optional[str] = None
    title: str = ""
    description: str = ""
    price: float = 0.0
    compare_at_price: Optional[float] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    stock: int = 0
    weight: Optional[float] = None
    images: List[str] = field(default_factory=list)
    variants: List[Dict[str, Any]] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    status: str = "draft"
    metadata: Dict[str, Any] = field(default_factory=dict)


class PlatformAdapter(ABC):
    """Abstract base for all platform integrations"""

    platform_name: str = "unknown"

    def __init__(self, credentials: Dict[str, str]):
        self.credentials = credentials
        self._validate_credentials()

    @abstractmethod
    def _validate_credentials(self) -> None:
        """Raise ValueError if credentials are incomplete"""
        ...

    @abstractmethod
    async def test_connection(self) -> bool:
        """Return True if credentials are valid and API reachable"""
        ...

    @abstractmethod
    async def push_product(self, product: PlatformProduct) -> Dict[str, Any]:
        """Create or update a product on the remote platform.
        Returns {"external_id": "...", "url": "..."} on success."""
        ...

    @abstractmethod
    async def pull_product(self, external_id: str) -> PlatformProduct:
        """Fetch a product from the remote platform by its external ID."""
        ...

    @abstractmethod
    async def update_stock(self, external_id: str, quantity: int) -> bool:
        """Update stock level for a product on the remote platform."""
        ...

    @abstractmethod
    async def update_price(self, external_id: str, price: float, compare_at: float = None) -> bool:
        """Update price for a product on the remote platform."""
        ...

    @abstractmethod
    async def delete_product(self, external_id: str) -> bool:
        """Remove a product from the remote platform."""
        ...

    async def push_products_batch(self, products: List[PlatformProduct]) -> SyncResult:
        """Batch push — default loops one by one; adapters can override for bulk APIs."""
        result = SyncResult()
        for p in products:
            try:
                await self.push_product(p)
                result.synced += 1
            except Exception as e:
                result.failed += 1
                result.errors.append({"sku": p.sku or p.title, "error": str(e)})
        result.success = result.failed == 0
        return result
