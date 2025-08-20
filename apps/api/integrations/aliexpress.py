"""
AliExpress Integration - Real API implementation
Note: If no API access, falls back to URL scraping
"""

import httpx
import os
from typing import List, Optional, Dict, Any
import structlog
from bs4 import BeautifulSoup
import json
import re
from utils.database import get_supabase_client

logger = structlog.get_logger()

class AliExpressAPI:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ALIEXPRESS_API_KEY")
        self.base_url = "https://api-sg.aliexpress.com"
        
    async def search_products(self, keyword: str, category: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Search products on AliExpress"""
        if self.api_key:
            return await self._api_search(keyword, category, limit)
        else:
            # Fallback to web scraping if no API key
            return await self._scrape_search(keyword, limit)
    
    async def _api_search(self, keyword: str, category: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Use official AliExpress API"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {
            "keywords": keyword,
            "page_size": min(limit, 50),
            "sort": "default"
        }
        
        if category:
            params["category_id"] = category
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/sync",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            return response.json().get("products", [])
    
    async def _scrape_search(self, keyword: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Scrape AliExpress search results as fallback"""
        try:
            search_url = f"https://www.aliexpress.com/wholesale?SearchText={keyword.replace(' ', '+')}"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(search_url, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract product data from page
                products = []
                product_elements = soup.find_all('div', {'class': re.compile(r'.*item.*')})[:limit]
                
                for element in product_elements:
                    try:
                        product = self._extract_product_from_element(element)
                        if product:
                            products.append(product)
                    except Exception as e:
                        logger.warning(f"Failed to extract product: {str(e)}")
                        continue
                
                return products
                
        except Exception as e:
            logger.error(f"AliExpress scraping error: {str(e)}")
            return []
    
    async def get_product_details(self, product_url: str) -> Dict[str, Any]:
        """Get detailed product info from URL"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(product_url, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract detailed product information
                product = {
                    'title': self._extract_title(soup),
                    'price': self._extract_price(soup),
                    'images': self._extract_images(soup),
                    'description': self._extract_description(soup),
                    'specs': self._extract_specifications(soup),
                    'rating': self._extract_rating(soup),
                    'reviews_count': self._extract_reviews_count(soup),
                    'store_name': self._extract_store_name(soup),
                    'url': product_url
                }
                
                return product
                
        except Exception as e:
            logger.error(f"Product details extraction error: {str(e)}")
            return {}
    
    async def import_trending_products(self, user_id: str, category: Optional[str] = None, limit: int = 50):
        """Import trending products from AliExpress"""
        try:
            # Search for trending products
            products = await self.search_products("trending", category, limit)
            
            if not products:
                # Fallback to popular search terms
                search_terms = ["phone case", "wireless earbuds", "smart watch", "home decor", "fitness"]
                for term in search_terms[:5]:  # Limit to avoid rate limits
                    term_products = await self.search_products(term, None, 10)
                    products.extend(term_products)
            
            supabase = get_supabase_client()
            
            # Get or create AliExpress supplier
            supplier_result = supabase.table('suppliers').select("*").eq('name', 'AliExpress').eq('user_id', user_id).execute()
            
            if not supplier_result.data:
                supplier_data = {
                    'user_id': user_id,
                    'name': 'AliExpress',
                    'type': 'api' if self.api_key else 'scraping',
                    'enabled': True,
                    'website': 'https://www.aliexpress.com',
                    'country': 'CN',
                    'rating': 4.2
                }
                supplier_result = supabase.table('suppliers').insert(supplier_data).execute()
            
            supplier_id = supplier_result.data[0]['id']
            
            logger.info(f"Importing {len(products)} trending products from AliExpress")
            
            # Convert and insert products
            imported_count = 0
            for product in products:
                try:
                    product_data = self._convert_to_standard_format(product, user_id, supplier_id)
                    supabase.table('products').insert(product_data).execute()
                    imported_count += 1
                except Exception as e:
                    logger.warning(f"Failed to import product: {str(e)}")
                    continue
                    
            logger.info(f"Successfully imported {imported_count} products from AliExpress")
            
        except Exception as e:
            logger.error(f"Error importing AliExpress products: {str(e)}")
            raise
    
    def _extract_product_from_element(self, element) -> Optional[Dict[str, Any]]:
        """Extract product data from HTML element"""
        try:
            # This is a simplified extraction - real implementation would need
            # to handle AliExpress's complex and changing HTML structure
            title_elem = element.find('a', {'class': re.compile(r'.*title.*')})
            price_elem = element.find('span', {'class': re.compile(r'.*price.*')})
            image_elem = element.find('img')
            
            if not title_elem or not price_elem:
                return None
                
            return {
                'title': title_elem.get_text(strip=True) if title_elem else '',
                'price': self._parse_price(price_elem.get_text(strip=True)) if price_elem else 0,
                'image': image_elem.get('src') if image_elem else '',
                'url': title_elem.get('href') if title_elem else ''
            }
        except:
            return None
    
    def _extract_title(self, soup) -> str:
        """Extract product title"""
        selectors = ['h1', '.product-title', '[data-pl="product-title"]']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ""
    
    def _extract_price(self, soup) -> float:
        """Extract product price"""
        selectors = ['.price-current', '.product-price', '[data-pl="price"]']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return self._parse_price(elem.get_text(strip=True))
        return 0.0
    
    def _extract_images(self, soup) -> List[str]:
        """Extract product images"""
        images = []
        img_elements = soup.find_all('img')
        for img in img_elements:
            src = img.get('src') or img.get('data-src')
            if src and ('product' in src.lower() or 'item' in src.lower()):
                if src.startswith('//'):
                    src = 'https:' + src
                images.append(src)
        return images[:10]  # Limit to 10 images
    
    def _extract_description(self, soup) -> str:
        """Extract product description"""
        selectors = ['.product-description', '.product-detail', '.item-description']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)[:1000]  # Limit length
        return ""
    
    def _extract_specifications(self, soup) -> Dict[str, Any]:
        """Extract product specifications"""
        specs = {}
        spec_tables = soup.find_all('table', {'class': re.compile(r'.*spec.*')})
        for table in spec_tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    specs[key] = value
        return specs
    
    def _extract_rating(self, soup) -> float:
        """Extract product rating"""
        rating_selectors = ['.rating', '.star-rating', '[data-pl="rating"]']
        for selector in rating_selectors:
            elem = soup.select_one(selector)
            if elem:
                rating_text = elem.get_text(strip=True)
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    return float(rating_match.group(1))
        return 0.0
    
    def _extract_reviews_count(self, soup) -> int:
        """Extract reviews count"""
        review_selectors = ['.reviews-count', '.review-num', '[data-pl="review-count"]']
        for selector in review_selectors:
            elem = soup.select_one(selector)
            if elem:
                count_text = elem.get_text(strip=True)
                count_match = re.search(r'(\d+)', count_text.replace(',', ''))
                if count_match:
                    return int(count_match.group(1))
        return 0
    
    def _extract_store_name(self, soup) -> str:
        """Extract store name"""
        store_selectors = ['.store-name', '.seller-name', '[data-pl="store"]']
        for selector in store_selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ""
    
    def _parse_price(self, price_text: str) -> float:
        """Parse price from text"""
        try:
            # Remove currency symbols and extract number
            price_match = re.search(r'(\d+\.?\d*)', price_text.replace(',', ''))
            if price_match:
                return float(price_match.group(1))
            return 0.0
        except:
            return 0.0
    
    def _convert_to_standard_format(self, aliexpress_product: Dict[str, Any], user_id: str, supplier_id: str) -> Dict[str, Any]:
        """Convert AliExpress product to standard format"""
        
        # Calculate estimated margins (typical AliExpress markup)
        cost_price = aliexpress_product.get('price', 0)
        sale_price = cost_price * 2.5  # Typical 150% markup
        
        return {
            'user_id': user_id,
            'supplier_id': supplier_id,
            'sku': f"AE_{hash(aliexpress_product.get('url', ''))}",
            'title': aliexpress_product.get('title', ''),
            'description': aliexpress_product.get('description', ''),
            'brand': aliexpress_product.get('store_name', 'AliExpress'),
            'cost_price': cost_price,
            'sale_price': sale_price,
            'currency': 'USD',  # AliExpress typically shows USD
            'stock': 100,  # Default stock for scraped products
            'status': 'draft',  # Imported products start as draft
            'images': aliexpress_product.get('images', []),
            'attributes': {
                'aliexpress_url': aliexpress_product.get('url'),
                'rating': aliexpress_product.get('rating', 0),
                'reviews_count': aliexpress_product.get('reviews_count', 0),
                'store_name': aliexpress_product.get('store_name', ''),
                'specifications': aliexpress_product.get('specs', {}),
                'is_trending': True
            },
            'external_ids': {
                'aliexpress_url': aliexpress_product.get('url')
            },
            'profit_margin': 150.0  # Default margin for AliExpress
        }