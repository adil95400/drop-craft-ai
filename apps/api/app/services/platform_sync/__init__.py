"""
Platform sync adapters — abstraction layer for Shopify, WooCommerce, etc.
"""

from .base import PlatformAdapter, SyncResult
from .registry import get_adapter, SUPPORTED_PLATFORMS

__all__ = ["PlatformAdapter", "SyncResult", "get_adapter", "SUPPORTED_PLATFORMS"]
