"""
Adapter registry — maps platform names to concrete adapter classes.
"""

from typing import Dict
from .base import PlatformAdapter
from .shopify_adapter import ShopifyAdapter
from .woocommerce_adapter import WooCommerceAdapter

SUPPORTED_PLATFORMS = ["shopify", "woocommerce"]

_REGISTRY: Dict[str, type] = {
    "shopify": ShopifyAdapter,
    "woocommerce": WooCommerceAdapter,
}


def get_adapter(platform: str, credentials: Dict[str, str]) -> PlatformAdapter:
    """Instantiate the right adapter for the given platform."""
    cls = _REGISTRY.get(platform.lower())
    if not cls:
        raise ValueError(f"Unsupported platform: {platform}. Supported: {', '.join(SUPPORTED_PLATFORMS)}")
    return cls(credentials)
