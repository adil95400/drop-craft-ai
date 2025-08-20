#!/bin/bash

# Drop Craft AI - Data Synchronization Script
# Syncs data from all enabled integrations

set -e

echo "🔄 Starting data synchronization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Function to call Supabase edge function
call_function() {
    local function_name=$1
    local payload=$2
    
    echo -e "${BLUE}📡 Calling $function_name...${NC}"
    
    response=$(curl -s -X POST \
        "$VITE_SUPABASE_URL/functions/v1/$function_name" \
        -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ $function_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ $function_name failed${NC}"
        echo "$response"
        return 1
    fi
}

# Sync catalog products
if [ "$VITE_ALIEXPRESS_ENABLED" = "true" ]; then
    echo -e "${YELLOW}🛒 Syncing AliExpress products...${NC}"
    call_function "aliexpress-integration" '{
        "importType": "trending_products",
        "filters": {
            "category": "Electronics",
            "minPrice": 10,
            "maxPrice": 200
        }
    }'
fi

if [ "$VITE_BIGBUY_ENABLED" = "true" ]; then
    echo -e "${YELLOW}📦 Syncing BigBuy products...${NC}"
    call_function "bigbuy-integration" '{
        "action": "import_products",
        "products": [],
        "user_id": "sync"
    }'
fi

# Sync Shopify data if enabled
if [ "$VITE_SHOPIFY_ENABLED" = "true" ]; then
    echo -e "${YELLOW}🛍️  Syncing Shopify data...${NC}"
    call_function "shopify-integration" '{
        "action": "sync_products",
        "integration_id": "shopify_main"
    }'
    
    call_function "shopify-integration" '{
        "action": "sync_orders",
        "integration_id": "shopify_main"
    }'
fi

# Update tracking information
if [ "$VITE_TRACKING_ENABLED" = "true" ]; then
    echo -e "${YELLOW}📍 Updating tracking information...${NC}"
    call_function "tracking-integration" '{
        "action": "update_all_tracking"
    }'
fi

# Optimize with AI if enabled
if [ "$VITE_AI_OPTIMIZATION_ENABLED" = "true" ]; then
    echo -e "${YELLOW}🤖 Running AI optimization...${NC}"
    call_function "ai-optimizer" '{
        "job_type": "price_optimization",
        "input_data": {
            "category": "all",
            "limit": 100
        }
    }'
fi

# Generate analytics reports
echo -e "${YELLOW}📊 Generating analytics reports...${NC}"
call_function "ai-insights" '{
    "report_type": "daily_summary",
    "date": "'$(date +%Y-%m-%d)'"
}'

# Cleanup old data
echo -e "${YELLOW}🧹 Cleaning up old data...${NC}"
call_function "maintenance" '{
    "action": "cleanup_old_imports",
    "days_old": 30
}'

echo -e "${GREEN}🎉 Data synchronization completed!${NC}"
echo ""
echo "📈 Summary:"
echo "  • Products updated from all enabled sources"
echo "  • Orders synchronized"
echo "  • Tracking information updated"
echo "  • AI optimization completed"
echo "  • Analytics reports generated"
echo "  • Old data cleaned up"
echo ""
echo "⏰ Next sync: $(date -d '+1 hour' '+%Y-%m-%d %H:%M:%S')"