"""
Shopify REST Admin API adapter (2024-01 stable)
Uses access_token + shop_domain from store credentials.
"""

import httpx
import logging
from typing import Dict, List, Any, Optional

from .base import PlatformAdapter, PlatformProduct, SyncResult

logger = logging.getLogger(__name__)

API_VERSION = "2024-01"


class ShopifyAdapter(PlatformAdapter):
    platform_name = "shopify"

    def _validate_credentials(self) -> None:
        if not self.credentials.get("access_token"):
            raise ValueError("Shopify access_token required")
        if not self.credentials.get("shop_domain"):
            raise ValueError("Shopify shop_domain required (e.g. myshop.myshopify.com)")

    @property
    def _base_url(self) -> str:
        domain = self.credentials["shop_domain"].rstrip("/")
        if not domain.startswith("https://"):
            domain = f"https://{domain}"
        return f"{domain}/admin/api/{API_VERSION}"

    @property
    def _headers(self) -> Dict[str, str]:
        return {
            "X-Shopify-Access-Token": self.credentials["access_token"],
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, path: str, json: Any = None) -> Dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method,
                f"{self._base_url}{path}",
                headers=self._headers,
                json=json,
            )
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", "2"))
                import asyncio
                await asyncio.sleep(retry_after)
                resp = await client.request(method, f"{self._base_url}{path}", headers=self._headers, json=json)
            resp.raise_for_status()
            return resp.json()

    async def test_connection(self) -> bool:
        try:
            data = await self._request("GET", "/shop.json")
            return "shop" in data
        except Exception as e:
            logger.warning(f"Shopify connection test failed: {e}")
            return False

    def _to_shopify_payload(self, product: PlatformProduct) -> Dict:
        payload: Dict[str, Any] = {
            "title": product.title,
            "body_html": product.description,
            "status": "active" if product.status == "active" else "draft",
            "tags": ", ".join(product.tags) if product.tags else "",
        }
        variants = []
        if product.variants:
            for v in product.variants:
                variants.append({
                    "price": str(v.get("price", product.price)),
                    "sku": v.get("sku", ""),
                    "inventory_quantity": v.get("stock", 0),
                    "compare_at_price": str(v["compare_at_price"]) if v.get("compare_at_price") else None,
                    "weight": v.get("weight", product.weight),
                    "title": v.get("title", "Default"),
                })
        else:
            variants.append({
                "price": str(product.price),
                "sku": product.sku or "",
                "inventory_quantity": product.stock,
                "compare_at_price": str(product.compare_at_price) if product.compare_at_price else None,
                "weight": product.weight,
                "title": "Default",
            })
        payload["variants"] = variants

        if product.images:
            payload["images"] = [{"src": url} for url in product.images]

        return payload

    async def push_product(self, product: PlatformProduct) -> Dict[str, Any]:
        payload = {"product": self._to_shopify_payload(product)}

        if product.external_id:
            data = await self._request("PUT", f"/products/{product.external_id}.json", json=payload)
        else:
            data = await self._request("POST", "/products.json", json=payload)

        shopify_product = data.get("product", {})
        return {
            "external_id": str(shopify_product.get("id", "")),
            "url": f"https://{self.credentials['shop_domain']}/admin/products/{shopify_product.get('id', '')}",
            "handle": shopify_product.get("handle", ""),
        }

    async def pull_product(self, external_id: str) -> PlatformProduct:
        data = await self._request("GET", f"/products/{external_id}.json")
        sp = data.get("product", {})
        variants_raw = sp.get("variants", [])
        first_variant = variants_raw[0] if variants_raw else {}

        return PlatformProduct(
            external_id=str(sp.get("id", "")),
            title=sp.get("title", ""),
            description=sp.get("body_html", ""),
            price=float(first_variant.get("price", 0)),
            compare_at_price=float(first_variant["compare_at_price"]) if first_variant.get("compare_at_price") else None,
            sku=first_variant.get("sku"),
            barcode=first_variant.get("barcode"),
            stock=first_variant.get("inventory_quantity", 0),
            weight=first_variant.get("weight"),
            images=[img["src"] for img in sp.get("images", [])],
            variants=[{
                "external_id": str(v.get("id", "")),
                "title": v.get("title", ""),
                "price": float(v.get("price", 0)),
                "sku": v.get("sku"),
                "stock": v.get("inventory_quantity", 0),
            } for v in variants_raw],
            tags=[t.strip() for t in sp.get("tags", "").split(",") if t.strip()],
            status="active" if sp.get("status") == "active" else "draft",
        )

    async def update_stock(self, external_id: str, quantity: int) -> bool:
        data = await self._request("GET", f"/products/{external_id}.json")
        variant = data.get("product", {}).get("variants", [{}])[0]
        inventory_item_id = variant.get("inventory_item_id")
        if not inventory_item_id:
            return False

        # Get locations
        loc_data = await self._request("GET", "/locations.json")
        locations = loc_data.get("locations", [])
        if not locations:
            return False

        location_id = locations[0]["id"]
        await self._request("POST", "/inventory_levels/set.json", json={
            "location_id": location_id,
            "inventory_item_id": inventory_item_id,
            "available": quantity,
        })
        return True

    async def update_price(self, external_id: str, price: float, compare_at: float = None) -> bool:
        data = await self._request("GET", f"/products/{external_id}.json")
        variant = data.get("product", {}).get("variants", [{}])[0]
        variant_id = variant.get("id")
        if not variant_id:
            return False

        update_payload: Dict[str, Any] = {"price": str(price)}
        if compare_at is not None:
            update_payload["compare_at_price"] = str(compare_at)

        await self._request("PUT", f"/variants/{variant_id}.json", json={"variant": update_payload})
        return True

    async def delete_product(self, external_id: str) -> bool:
        await self._request("DELETE", f"/products/{external_id}.json")
        return True
