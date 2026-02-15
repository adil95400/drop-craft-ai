"""
WooCommerce REST API adapter (v3)
Uses consumer_key + consumer_secret + store_url from credentials.
"""

import httpx
import logging
from typing import Dict, List, Any, Optional

from .base import PlatformAdapter, PlatformProduct, SyncResult

logger = logging.getLogger(__name__)


class WooCommerceAdapter(PlatformAdapter):
    platform_name = "woocommerce"

    def _validate_credentials(self) -> None:
        if not self.credentials.get("consumer_key"):
            raise ValueError("WooCommerce consumer_key required")
        if not self.credentials.get("consumer_secret"):
            raise ValueError("WooCommerce consumer_secret required")
        if not self.credentials.get("store_url"):
            raise ValueError("WooCommerce store_url required")

    @property
    def _base_url(self) -> str:
        url = self.credentials["store_url"].rstrip("/")
        if not url.startswith("https://"):
            url = f"https://{url}"
        return f"{url}/wp-json/wc/v3"

    @property
    def _auth(self) -> tuple:
        return (self.credentials["consumer_key"], self.credentials["consumer_secret"])

    async def _request(self, method: str, path: str, json: Any = None, params: Dict = None) -> Any:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method,
                f"{self._base_url}{path}",
                auth=self._auth,
                json=json,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def test_connection(self) -> bool:
        try:
            data = await self._request("GET", "/system_status")
            return isinstance(data, dict)
        except Exception as e:
            logger.warning(f"WooCommerce connection test failed: {e}")
            return False

    def _to_wc_payload(self, product: PlatformProduct) -> Dict:
        payload: Dict[str, Any] = {
            "name": product.title,
            "description": product.description,
            "regular_price": str(product.price),
            "sku": product.sku or "",
            "status": "publish" if product.status == "active" else "draft",
            "manage_stock": True,
            "stock_quantity": product.stock,
        }
        if product.compare_at_price:
            payload["regular_price"] = str(product.compare_at_price)
            payload["sale_price"] = str(product.price)
        if product.weight:
            payload["weight"] = str(product.weight)
        if product.tags:
            payload["tags"] = [{"name": t} for t in product.tags]
        if product.images:
            payload["images"] = [{"src": url} for url in product.images]
        return payload

    async def push_product(self, product: PlatformProduct) -> Dict[str, Any]:
        payload = self._to_wc_payload(product)

        if product.external_id:
            data = await self._request("PUT", f"/products/{product.external_id}", json=payload)
        else:
            data = await self._request("POST", "/products", json=payload)

        return {
            "external_id": str(data.get("id", "")),
            "url": data.get("permalink", ""),
            "slug": data.get("slug", ""),
        }

    async def pull_product(self, external_id: str) -> PlatformProduct:
        data = await self._request("GET", f"/products/{external_id}")
        sale_price = data.get("sale_price") or data.get("price", "0")
        regular_price = data.get("regular_price") or sale_price

        return PlatformProduct(
            external_id=str(data.get("id", "")),
            title=data.get("name", ""),
            description=data.get("description", ""),
            price=float(sale_price) if sale_price else 0,
            compare_at_price=float(regular_price) if regular_price != sale_price else None,
            sku=data.get("sku"),
            stock=data.get("stock_quantity", 0) or 0,
            weight=float(data["weight"]) if data.get("weight") else None,
            images=[img["src"] for img in data.get("images", [])],
            tags=[t["name"] for t in data.get("tags", [])],
            status="active" if data.get("status") == "publish" else "draft",
        )

    async def update_stock(self, external_id: str, quantity: int) -> bool:
        await self._request("PUT", f"/products/{external_id}", json={
            "stock_quantity": quantity,
            "manage_stock": True,
        })
        return True

    async def update_price(self, external_id: str, price: float, compare_at: float = None) -> bool:
        payload: Dict[str, Any] = {}
        if compare_at:
            payload["regular_price"] = str(compare_at)
            payload["sale_price"] = str(price)
        else:
            payload["regular_price"] = str(price)
            payload["sale_price"] = ""
        await self._request("PUT", f"/products/{external_id}", json=payload)
        return True

    async def delete_product(self, external_id: str) -> bool:
        await self._request("DELETE", f"/products/{external_id}", params={"force": True})
        return True
