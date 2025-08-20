"""
File parsers for CSV, XML, and URL scraping
"""

import pandas as pd
import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import structlog

logger = structlog.get_logger()

class CSVParser:
    async def parse_and_normalize(self, content: bytes, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
        df = pd.read_csv(content)
        products = []
        for _, row in df.iterrows():
            product = {
                'title': row.get(mapping.get('title', 'name'), ''),
                'sale_price': float(row.get(mapping.get('price', 'price'), 0)),
                'description': row.get(mapping.get('description', 'description'), ''),
                'sku': row.get(mapping.get('sku', 'sku'), ''),
            }
            products.append(product)
        return products

class XMLParser:
    async def fetch_and_import(self, url: str, user_id: str, mapping_config: Dict):
        response = requests.get(url)
        root = ET.fromstring(response.content)
        # Parse XML structure based on mapping_config
        products = []
        for item in root.findall('.//product'):
            product = {
                'title': item.find('name').text if item.find('name') is not None else '',
                'sale_price': float(item.find('price').text) if item.find('price') is not None else 0,
                'user_id': user_id
            }
            products.append(product)
        return products

class URLScraper:
    async def scrape_and_import(self, url: str, user_id: str, mapping_config: Dict):
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        # Basic product extraction logic
        product = {
            'title': soup.find('h1').get_text(strip=True) if soup.find('h1') else '',
            'sale_price': 0,  # Extract from page
            'description': soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else '',
            'user_id': user_id
        }
        return [product]