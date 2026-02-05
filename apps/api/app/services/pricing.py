"""
Pricing Service - Dynamic pricing and margin optimization
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from app.core.database import get_supabase

logger = logging.getLogger(__name__)


class PricingService:
    """Dynamic pricing and margin optimization service"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def analyze(
        self,
        product_ids: List[str],
        competitor_analysis: bool = True,
        positioning: str = "competitive"
    ) -> Dict[str, Any]:
        """Analyze pricing for products"""
        
        results = {
            "analyzed": 0,
            "recommendations": [],
            "summary": {}
        }
        
        for product_id in product_ids:
            try:
                recommendation = self._analyze_product(
                    product_id, 
                    competitor_analysis, 
                    positioning
                )
                results["recommendations"].append(recommendation)
                results["analyzed"] += 1
            except Exception as e:
                logger.warning(f"Failed to analyze product {product_id}: {e}")
        
        # Generate summary
        results["summary"] = self._generate_summary(results["recommendations"])
        
        return results
    
    def _analyze_product(
        self,
        product_id: str,
        competitor_analysis: bool,
        positioning: str
    ) -> Dict[str, Any]:
        """Analyze pricing for a single product"""
        
        # Get product data
        result = self.supabase.table("products").select(
            "id, title, cost_price, sale_price, category"
        ).eq("id", product_id).single().execute()
        
        if not result.data:
            raise ValueError(f"Product not found: {product_id}")
        
        product = result.data
        cost = float(product.get("cost_price", 0) or 0)
        current_price = float(product.get("sale_price", 0) or 0)
        
        # Calculate current margin
        current_margin = self._calculate_margin(cost, current_price)
        
        # Get competitor prices if enabled
        competitor_prices = []
        if competitor_analysis:
            competitor_prices = self._get_competitor_prices(product_id)
        
        # Calculate recommended price
        recommended = self._calculate_recommended_price(
            cost=cost,
            current_price=current_price,
            competitor_prices=competitor_prices,
            positioning=positioning
        )
        
        return {
            "product_id": product_id,
            "title": product.get("title"),
            "cost_price": cost,
            "current_price": current_price,
            "current_margin": current_margin,
            "recommended_price": recommended["price"],
            "recommended_margin": recommended["margin"],
            "competitor_avg": recommended.get("competitor_avg"),
            "price_change": recommended["price"] - current_price,
            "reasoning": recommended["reasoning"]
        }
    
    def _calculate_margin(self, cost: float, price: float) -> float:
        """Calculate profit margin percentage"""
        if price <= 0:
            return 0
        return round(((price - cost) / price) * 100, 2)
    
    def _get_competitor_prices(self, product_id: str) -> List[float]:
        """Get competitor prices for a product"""
        
        # Check for monitored competitor prices
        result = self.supabase.table("competitor_prices").select(
            "price"
        ).eq("product_id", product_id).gte(
            "last_checked", 
            (datetime.utcnow() - timedelta(days=7)).isoformat()
        ).execute()
        
        if result.data:
            return [float(r["price"]) for r in result.data if r.get("price")]
        
        return []
    
    def _calculate_recommended_price(
        self,
        cost: float,
        current_price: float,
        competitor_prices: List[float],
        positioning: str
    ) -> Dict[str, Any]:
        """Calculate recommended price based on strategy"""
        
        # Define margin targets based on positioning
        margin_targets = {
            "aggressive": {"min": 15, "target": 25, "max": 35},
            "competitive": {"min": 20, "target": 35, "max": 50},
            "premium": {"min": 35, "target": 50, "max": 70},
            "luxury": {"min": 50, "target": 65, "max": 80}
        }
        
        target = margin_targets.get(positioning, margin_targets["competitive"])
        
        # Base price calculation
        base_price = cost / (1 - target["target"] / 100) if cost > 0 else current_price
        
        reasoning = []
        
        # Adjust based on competitor prices
        competitor_avg = None
        if competitor_prices:
            competitor_avg = sum(competitor_prices) / len(competitor_prices)
            competitor_min = min(competitor_prices)
            competitor_max = max(competitor_prices)
            
            if positioning == "aggressive":
                # Price at or below competitor minimum
                recommended = min(base_price, competitor_min * 0.95)
                reasoning.append(f"Prix agressif: 5% sous le minimum concurrent ({competitor_min:.2f}€)")
            elif positioning == "competitive":
                # Price slightly below average
                recommended = min(base_price, competitor_avg * 0.97)
                reasoning.append(f"Prix compétitif: légèrement sous la moyenne ({competitor_avg:.2f}€)")
            elif positioning == "premium":
                # Price above average
                recommended = max(base_price, competitor_avg * 1.1)
                reasoning.append(f"Positionnement premium: 10% au-dessus de la moyenne")
            else:
                recommended = base_price
                reasoning.append(f"Prix calculé sur marge cible de {target['target']}%")
        else:
            recommended = base_price
            reasoning.append(f"Prix basé sur marge cible de {target['target']}% (pas de données concurrents)")
        
        # Ensure minimum margin
        min_price = cost / (1 - target["min"] / 100) if cost > 0 else recommended
        if recommended < min_price:
            recommended = min_price
            reasoning.append(f"Ajusté pour maintenir marge minimum de {target['min']}%")
        
        # Round to nice price point
        recommended = self._round_to_nice_price(recommended)
        final_margin = self._calculate_margin(cost, recommended)
        
        return {
            "price": recommended,
            "margin": final_margin,
            "competitor_avg": competitor_avg,
            "reasoning": reasoning
        }
    
    def _round_to_nice_price(self, price: float) -> float:
        """Round to a psychologically appealing price point"""
        
        if price < 10:
            # Round to .99
            return round(price) - 0.01 if price >= 1 else round(price, 2)
        elif price < 100:
            # Round to .99 or .90
            base = int(price)
            return base + 0.99 if price - base > 0.5 else base + 0.49
        elif price < 1000:
            # Round to nearest 5 or 10, then subtract 1
            base = round(price / 5) * 5
            return base - 1 if base > price else base + 4
        else:
            # Round to nearest 10, subtract 1
            base = round(price / 10) * 10
            return base - 1
    
    def _generate_summary(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics"""
        
        if not recommendations:
            return {}
        
        total_products = len(recommendations)
        price_increases = sum(1 for r in recommendations if r["price_change"] > 0)
        price_decreases = sum(1 for r in recommendations if r["price_change"] < 0)
        
        avg_current_margin = sum(r["current_margin"] for r in recommendations) / total_products
        avg_recommended_margin = sum(r["recommended_margin"] for r in recommendations) / total_products
        
        total_price_change = sum(r["price_change"] for r in recommendations)
        
        return {
            "total_products": total_products,
            "price_increases": price_increases,
            "price_decreases": price_decreases,
            "unchanged": total_products - price_increases - price_decreases,
            "avg_current_margin": round(avg_current_margin, 2),
            "avg_recommended_margin": round(avg_recommended_margin, 2),
            "margin_improvement": round(avg_recommended_margin - avg_current_margin, 2),
            "total_price_impact": round(total_price_change, 2)
        }
    
    def apply_recommendations(
        self,
        user_id: str,
        recommendations: List[Dict[str, Any]],
        auto_apply: bool = False
    ) -> Dict[str, Any]:
        """Apply pricing recommendations to products"""
        
        applied = 0
        skipped = 0
        
        for rec in recommendations:
            product_id = rec["product_id"]
            new_price = rec["recommended_price"]
            
            if auto_apply or rec.get("approved", False):
                try:
                    self.supabase.table("products").update({
                        "sale_price": new_price,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", product_id).eq("user_id", user_id).execute()
                    
                    # Log price change
                    self.supabase.table("price_history").insert({
                        "product_id": product_id,
                        "user_id": user_id,
                        "old_price": rec["current_price"],
                        "new_price": new_price,
                        "reason": "ai_optimization",
                        "created_at": datetime.utcnow().isoformat()
                    }).execute()
                    
                    applied += 1
                except Exception as e:
                    logger.error(f"Failed to apply price for {product_id}: {e}")
                    skipped += 1
            else:
                skipped += 1
        
        return {
            "applied": applied,
            "skipped": skipped
        }
    
    def create_pricing_rule(
        self,
        user_id: str,
        name: str,
        rule_type: str,
        conditions: Dict[str, Any],
        actions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an automated pricing rule"""
        
        result = self.supabase.table("pricing_rules").insert({
            "user_id": user_id,
            "name": name,
            "rule_type": rule_type,
            "conditions": conditions,
            "actions": actions,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return result.data[0] if result.data else {}
    
    def get_pricing_rules(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all pricing rules for a user"""
        
        result = self.supabase.table("pricing_rules").select(
            "*"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return result.data or []
