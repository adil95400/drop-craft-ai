#!/bin/bash

# Drop Craft AI - Health Check Script
# Comprehensive health monitoring for production systems

set -e

echo "🏥 Drop Craft AI Health Check"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Health check results
PASSED=0
FAILED=0
WARNINGS=0

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "🔍 Checking $name... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" --max-time 10); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ OK (HTTP $response)${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ FAILED (Connection error)${NC}"
        ((FAILED++))
    fi
}

# Function to check feature availability
check_feature() {
    local feature=$1
    local env_var="VITE_${feature}_ENABLED"
    
    if [ "${!env_var}" = "true" ]; then
        echo -e "🔧 $feature: ${GREEN}ENABLED${NC}"
    else
        echo -e "🔧 $feature: ${YELLOW}DISABLED${NC}"
        ((WARNINGS++))
    fi
}

# Function to check API key availability
check_api_key() {
    local service=$1
    local key_var="${service}_API_KEY"
    
    if [ ! -z "${!key_var}" ] && [ "${!key_var}" != "your_api_key_here" ]; then
        echo -e "🔑 $service API Key: ${GREEN}CONFIGURED${NC}"
    else
        echo -e "🔑 $service API Key: ${YELLOW}MISSING${NC}"
        ((WARNINGS++))
    fi
}

# Start health checks
echo -e "${BLUE}📊 System Health Overview${NC}"
echo "--------------------------------"

# Check core endpoints
if [ ! -z "$VITE_FRONTEND_URL" ]; then
    check_endpoint "Frontend" "$VITE_FRONTEND_URL"
    check_endpoint "Health Endpoint" "$VITE_FRONTEND_URL/health.json"
else
    echo -e "${YELLOW}⚠️  Frontend URL not configured${NC}"
    ((WARNINGS++))
fi

if [ ! -z "$VITE_SUPABASE_URL" ]; then
    check_endpoint "Supabase API" "$VITE_SUPABASE_URL/rest/v1/"
    check_endpoint "Supabase Functions" "$VITE_SUPABASE_URL/functions/v1/" 404
else
    echo -e "${RED}✗ Supabase URL not configured${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🔧 Feature Status${NC}"
echo "--------------------------------"

# Check feature flags
features=("ALIEXPRESS" "BIGBUY" "SHOPIFY" "AI_OPTIMIZATION" "STRIPE" "TRACKING")
for feature in "${features[@]}"; do
    check_feature "$feature"
done

echo ""
echo -e "${BLUE}🔑 API Keys Status${NC}"
echo "--------------------------------"

# Check API keys (note: actual keys stored in Supabase secrets)
api_services=("ALIEXPRESS" "BIGBUY" "OPENAI" "STRIPE" "TRACK17")
for service in "${api_services[@]}"; do
    check_api_key "$service"
done

echo ""
echo -e "${BLUE}🚀 Integration Tests${NC}"
echo "--------------------------------"

# Test Supabase functions if enabled
if [ "$VITE_ALIEXPRESS_ENABLED" = "true" ] && [ ! -z "$VITE_SUPABASE_URL" ]; then
    echo -n "🧪 Testing AliExpress integration... "
    
    response=$(curl -s -X POST "$VITE_SUPABASE_URL/functions/v1/aliexpress-integration" \
        -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"test": true}' \
        --max-time 15 \
        -w "%{http_code}" -o /dev/null) 2>/dev/null
    
    if [ "$response" -eq "200" ] || [ "$response" -eq "400" ]; then
        echo -e "${GREEN}✓ ACCESSIBLE${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        ((FAILED++))
    fi
fi

# Test real-time sync if enabled
if [ "$VITE_REAL_TIME_SYNC_ENABLED" = "true" ] && [ ! -z "$VITE_SUPABASE_URL" ]; then
    echo -n "🧪 Testing real-time sync... "
    
    response=$(curl -s -X POST "$VITE_SUPABASE_URL/functions/v1/real-data-sync" \
        -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"platforms": [], "syncType": "products"}' \
        --max-time 10 \
        -w "%{http_code}" -o /dev/null) 2>/dev/null
    
    if [ "$response" -eq "200" ] || [ "$response" -eq "400" ]; then
        echo -e "${GREEN}✓ ACCESSIBLE${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        ((FAILED++))
    fi
fi

echo ""
echo -e "${BLUE}📈 Performance Checks${NC}"
echo "--------------------------------"

# Check response times
if [ ! -z "$VITE_FRONTEND_URL" ]; then
    echo -n "⚡ Frontend response time... "
    
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$VITE_FRONTEND_URL" --max-time 10)
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        echo -e "${GREEN}✓ ${response_time}s (Good)${NC}"
        ((PASSED++))
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠ ${response_time}s (Slow)${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ ${response_time}s (Very Slow)${NC}"
        ((FAILED++))
    fi
fi

# Check SSL certificates
if [ ! -z "$VITE_FRONTEND_URL" ]; then
    echo -n "🔒 SSL certificate... "
    
    if echo | timeout 10 openssl s_client -servername $(echo "$VITE_FRONTEND_URL" | sed 's|https://||' | sed 's|/.*||') -connect $(echo "$VITE_FRONTEND_URL" | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Valid${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Could not verify${NC}"
        ((WARNINGS++))
    fi
fi

echo ""
echo -e "${BLUE}💾 Database Health${NC}"
echo "--------------------------------"

# Check database connectivity via Supabase
if [ ! -z "$VITE_SUPABASE_URL" ]; then
    echo -n "🗄️  Database connectivity... "
    
    db_response=$(curl -s -X GET "$VITE_SUPABASE_URL/rest/v1/profiles?limit=1" \
        -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
        -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
        --max-time 10 \
        -w "%{http_code}" -o /dev/null) 2>/dev/null
    
    if [ "$db_response" -eq "200" ] || [ "$db_response" -eq "401" ]; then
        echo -e "${GREEN}✓ Connected${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Connection failed (HTTP $db_response)${NC}"
        ((FAILED++))
    fi
fi

echo ""
echo -e "${BLUE}📊 Health Summary${NC}"
echo "==============================="

echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"

# Overall health status
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n🎉 Overall Status: ${GREEN}HEALTHY${NC}"
        exit 0
    else
        echo -e "\n⚡ Overall Status: ${YELLOW}HEALTHY WITH WARNINGS${NC}"
        exit 0
    fi
else
    echo -e "\n🚨 Overall Status: ${RED}UNHEALTHY${NC}"
    echo ""
    echo "❗ Action Required:"
    echo "  1. Check failed endpoints and fix connectivity issues"
    echo "  2. Verify API keys are properly configured"
    echo "  3. Review application logs for errors"
    echo "  4. Ensure all required services are running"
    exit 1
fi