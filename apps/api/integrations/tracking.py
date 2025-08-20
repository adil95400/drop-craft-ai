"""
17Track Integration - Real tracking API implementation
"""

import httpx
import os
from typing import List, Optional, Dict, Any
import structlog
from utils.database import get_supabase_client

logger = structlog.get_logger()

class TrackingAPI:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("TRACK17_API_KEY")
        self.base_url = "https://api.17track.net/track/v2.2"
        
    async def track_package(self, tracking_number: str, carrier: Optional[str] = None) -> Dict[str, Any]:
        """Track a single package using 17Track API"""
        if not self.api_key:
            raise ValueError("17Track API key is required")
            
        headers = {
            "17token": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "number": tracking_number
        }
        
        if carrier:
            payload["carrier"] = carrier
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/gettrackinfo",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def track_multiple_packages(self, tracking_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """Track multiple packages in batch"""
        if not self.api_key:
            raise ValueError("17Track API key is required")
            
        headers = {
            "17token": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Format tracking data for 17Track API
        formatted_data = []
        for item in tracking_data:
            track_item = {"number": item["tracking_number"]}
            if item.get("carrier"):
                track_item["carrier"] = item["carrier"]
            formatted_data.append(track_item)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/gettrackinfo",
                headers=headers,
                json=formatted_data
            )
            response.raise_for_status()
            return response.json()
    
    async def get_supported_carriers(self) -> List[Dict[str, Any]]:
        """Get list of supported carriers from 17Track"""
        if not self.api_key:
            raise ValueError("17Track API key is required")
            
        headers = {
            "17token": self.api_key,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/getcarriers",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    async def register_tracking(self, tracking_number: str, carrier: Optional[str] = None) -> Dict[str, Any]:
        """Register a tracking number for monitoring"""
        if not self.api_key:
            raise ValueError("17Track API key is required")
            
        headers = {
            "17token": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "number": tracking_number
        }
        
        if carrier:
            payload["carrier"] = carrier
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/register",
                headers=headers,
                json=[payload]
            )
            response.raise_for_status()
            return response.json()
    
    async def sync_all_shipments(self, user_id: str):
        """Sync tracking status for all user shipments"""
        try:
            supabase = get_supabase_client()
            
            # Get all active shipments for user
            shipments_result = supabase.table('shipments').select("""
                id, tracking_number, carrier, status,
                orders!inner(user_id)
            """).eq('orders.user_id', user_id).not_.is_('tracking_number', 'null').execute()
            
            shipments = shipments_result.data
            
            if not shipments:
                logger.info("No shipments with tracking numbers found")
                return
            
            logger.info(f"Syncing tracking for {len(shipments)} shipments")
            
            # Prepare tracking data for batch request
            tracking_data = []
            for shipment in shipments:
                tracking_data.append({
                    "tracking_number": shipment["tracking_number"],
                    "carrier": shipment.get("carrier"),
                    "shipment_id": shipment["id"]
                })
            
            # Process in batches of 40 (17Track API limit)
            batch_size = 40
            for i in range(0, len(tracking_data), batch_size):
                batch = tracking_data[i:i + batch_size]
                
                try:
                    # Get tracking info from 17Track
                    tracking_results = await self.track_multiple_packages(batch)
                    
                    # Update database with results
                    await self._update_shipments_from_tracking(tracking_results, batch, supabase)
                    
                except Exception as e:
                    logger.error(f"Error processing tracking batch: {str(e)}")
                    continue
                    
            logger.info(f"Completed tracking sync for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error syncing shipments tracking: {str(e)}")
            raise
    
    async def _update_shipments_from_tracking(self, tracking_results: Dict[str, Any], batch_data: List[Dict], supabase):
        """Update shipment records with tracking information"""
        try:
            results = tracking_results.get("data", [])
            
            for i, result in enumerate(results):
                if i >= len(batch_data):
                    break
                    
                shipment_id = batch_data[i]["shipment_id"]
                tracking_info = result.get("track", {})
                
                if not tracking_info:
                    continue
                
                # Extract tracking events
                events = tracking_info.get("events", [])
                latest_status = "pending"
                delivered_at = None
                
                if events:
                    # Get latest event
                    latest_event = events[0]  # 17Track orders events by date desc
                    status_code = latest_event.get("status")
                    
                    # Map 17Track status to our status
                    latest_status = self._map_tracking_status(status_code)
                    
                    # Check if delivered
                    if latest_status == "delivered":
                        delivered_at = latest_event.get("time")
                
                # Update shipment record
                update_data = {
                    "status": latest_status,
                    "tracking_data": {
                        "carrier_code": tracking_info.get("carrier"),
                        "carrier_name": tracking_info.get("carrier_name"),
                        "events": events[:10],  # Keep last 10 events
                        "last_updated": tracking_info.get("updated"),
                        "origin_country": tracking_info.get("origin_country"),
                        "destination_country": tracking_info.get("destination_country")
                    },
                    "last_update": "now()"
                }
                
                if delivered_at:
                    update_data["delivered_at"] = delivered_at
                
                supabase.table('shipments').update(update_data).eq('id', shipment_id).execute()
                
        except Exception as e:
            logger.error(f"Error updating shipments from tracking: {str(e)}")
    
    def _map_tracking_status(self, track17_status: Optional[str]) -> str:
        """Map 17Track status codes to our shipment status"""
        if not track17_status:
            return "pending"
            
        status_mapping = {
            "0": "pending",      # Not found
            "10": "pending",     # Pick up
            "20": "in_transit",  # In transit
            "30": "in_transit",  # Out for delivery  
            "35": "in_transit",  # Undelivered
            "40": "delivered",   # Delivered
            "50": "failed",      # Alert/Exception
            "60": "failed",      # Expired
        }
        
        return status_mapping.get(str(track17_status), "pending")
    
    async def get_tracking_summary(self, user_id: str) -> Dict[str, Any]:
        """Get tracking summary for user"""
        try:
            supabase = get_supabase_client()
            
            # Get shipment counts by status
            result = supabase.table('shipments').select("""
                status,
                orders!inner(user_id)
            """).eq('orders.user_id', user_id).execute()
            
            shipments = result.data
            
            # Count by status
            status_counts = {}
            for shipment in shipments:
                status = shipment['status']
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "total_shipments": len(shipments),
                "by_status": status_counts,
                "pending": status_counts.get("pending", 0),
                "in_transit": status_counts.get("in_transit", 0),
                "delivered": status_counts.get("delivered", 0),
                "failed": status_counts.get("failed", 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting tracking summary: {str(e)}")
            return {}