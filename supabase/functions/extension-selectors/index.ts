import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version",
};

const SELECTORS_VERSION = "5.7.0";

// Remote selectors configuration - easily updatable without extension republish
const REMOTE_SELECTORS = {
  version: SELECTORS_VERSION,
  updatedAt: new Date().toISOString(),
  
  amazon: {
    title: [
      '#productTitle',
      '.product-title-word-break',
      'h1[data-automation-id="title"]',
      'span#productTitle'
    ],
    price: [
      '#corePrice_feature_div .a-price .a-offscreen',
      '.priceToPay .a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      'span.a-price span.a-offscreen'
    ],
    images: [
      '#imgTagWrapperId img',
      '#landingImage',
      '#main-image-container img',
      '.imgTagWrapper img',
      '#altImages img'
    ],
    description: [
      '#productDescription',
      '#feature-bullets',
      '.a-unordered-list.a-vertical',
      '#aplus_feature_div'
    ],
    reviews: [
      '#cm_cr-review_list .review',
      '.review-views .review',
      '[data-hook="review"]'
    ],
    variants: [
      '#variation_color_name li',
      '#variation_size_name li',
      '.swatchSelect option',
      '#twister-plus-inline-twister li'
    ],
    addToCart: [
      '#add-to-cart-button',
      '#buy-now-button',
      '.a-button-inner input[name="submit.add-to-cart"]'
    ]
  },
  
  aliexpress: {
    title: [
      '.product-title-text',
      'h1[data-pl="product-title"]',
      '.HazeProductCard--title',
      '[class*="ProductTitle"]'
    ],
    price: [
      '[class*="Price--currentPriceText"]',
      '.product-price-value',
      '.uniform-banner-box-price',
      '[class*="price"] span'
    ],
    images: [
      '[class*="Slider--sliderMain"] img',
      '.images-view-item img',
      '.magnifier-image',
      '.pdp-main-image img'
    ],
    description: [
      '#product-description',
      '.product-description',
      '.detail-desc-decorate-richtext',
      '[class*="Description"]'
    ],
    reviews: [
      '.feedback-list-wrap .feedback-item',
      '.buyer-feedback',
      '[class*="Review"]'
    ],
    variants: [
      '[class*="sku-property"]',
      '.sku-item',
      '[data-sku-prop-key]'
    ],
    addToCart: [
      '.add-to-cart-button',
      '[class*="addCart"]',
      '.buy-now-button'
    ]
  },
  
  temu: {
    title: [
      'h1[class*="ProductTitle"]',
      '.product-title',
      '[data-testid="pdp-title"]',
      '.goods-title'
    ],
    price: [
      '[class*="Price"] span',
      '.product-price',
      '[data-testid="pdp-price"]',
      '.sale-price'
    ],
    images: [
      '[class*="ImageContainer"] img',
      '.product-image img',
      '.swiper-slide img',
      '[data-testid="pdp-image"]'
    ],
    description: [
      '[class*="Description"]',
      '.product-description',
      '.detail-content'
    ],
    reviews: [
      '[class*="Review"]',
      '.review-item',
      '.comment-item'
    ],
    variants: [
      '[class*="SkuSelect"]',
      '.sku-item',
      '.option-item'
    ],
    addToCart: [
      '[class*="AddCart"]',
      '.add-to-cart',
      '[data-testid="add-to-cart"]'
    ]
  },
  
  shein: {
    title: [
      'h1.product-intro__head-name',
      '.goods-title',
      '.product-intro h1',
      '[class*="ProductTitle"]'
    ],
    price: [
      '.product-intro__head-price .original',
      '.from',
      '.product-intro__head-price',
      '.goods-price'
    ],
    images: [
      '.product-intro__thumbs-item img',
      '.goods-image img',
      '.crop-image-container img',
      '.swiper-slide img'
    ],
    description: [
      '.product-intro__description',
      '.goods-description',
      '.product-detail'
    ],
    reviews: [
      '.j-expose__common-reviews .comment-item',
      '.review-item',
      '[class*="Review"]'
    ],
    variants: [
      '.product-intro__size-radio',
      '.goods-size__item',
      '[class*="ColorSelect"]'
    ],
    addToCart: [
      '.product-intro__add-btn',
      '.add-to-bag',
      '[class*="addBag"]'
    ]
  },
  
  ebay: {
    title: [
      'h1.x-item-title__mainTitle',
      '.it-ttl',
      '#itemTitle',
      '[data-testid="ux-title-main"]'
    ],
    price: [
      '[data-testid="x-price-primary"] .ux-textspans',
      '#prcIsum',
      '.x-price-primary',
      '.notranslate'
    ],
    images: [
      '#PicturePanel img',
      '.img-wrapper img',
      '.ux-image-carousel-item img',
      '#mainImgHldr img'
    ],
    description: [
      '#desc_ifr',
      '.item-description',
      '#ds_div'
    ],
    reviews: [
      '.reviews-section .ebay-review-item',
      '[data-testid="review"]'
    ],
    variants: [
      '#x-msku',
      '.vim.x-msku__select',
      '.msku-sel option'
    ],
    addToCart: [
      '#atcBtn',
      '.ux-call-to-action',
      '#addToCart'
    ]
  },
  
  shopify: {
    title: [
      '.product__title h1',
      '.product-single__title',
      'h1.title',
      '[data-product-title]'
    ],
    price: [
      '.product__price',
      '.price',
      'span[data-product-price]',
      '.product-price'
    ],
    images: [
      '.product__media img',
      '.product-single__photo img',
      '.product-image',
      '[data-product-image]'
    ],
    description: [
      '.product__description',
      '.product-single__description',
      '.description',
      '[data-product-description]'
    ],
    reviews: [
      '.spr-review',
      '.stamped-review',
      '.yotpo-review',
      '.judgeme-review'
    ],
    variants: [
      'select[name="id"]',
      '.variant-selector',
      '[data-variant-id]'
    ],
    addToCart: [
      '[data-add-to-cart]',
      '.add-to-cart',
      '#AddToCart',
      'button[name="add"]'
    ]
  },
  
  banggood: {
    title: [
      '.product-title',
      'h1.product_title',
      '.product-info h1'
    ],
    price: [
      '.main-price',
      '.price-now',
      '.selling-price'
    ],
    images: [
      '.product-image img',
      '.main-image img',
      '.gallery-image img'
    ],
    addToCart: [
      '#addToCartBtn',
      '.add-to-cart',
      '[class*="add-cart"]'
    ]
  },
  
  dhgate: {
    title: [
      '.product-name',
      '.item-name h1',
      '.product-title'
    ],
    price: [
      '.price-now',
      '.current-price',
      '.product-price'
    ],
    images: [
      '.product-image img',
      '.main-image img'
    ],
    addToCart: [
      '.add-cart-btn',
      '[class*="addCart"]',
      '.buy-now-btn'
    ]
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // GET /extension-selectors - Return remote selectors
    if (req.method === "GET" && (!path || path === 'extension-selectors')) {
      const extensionVersion = req.headers.get("x-extension-version") || "unknown";
      
      console.log(`[extension-selectors] Serving selectors v${SELECTORS_VERSION} to extension v${extensionVersion}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          version: SELECTORS_VERSION,
          selectors: REMOTE_SELECTORS,
          updatedAt: REMOTE_SELECTORS.updatedAt
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // POST /extension-selectors/report - Report broken selector
    if (req.method === "POST" && path === 'report') {
      const body = await req.json();
      const { platform, selectorType, currentUrl, userAgent, localVersion, remoteVersion, details, timestamp } = body;
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Log the report
      const { error } = await supabase.from("activity_logs").insert({
        action: "selector_report",
        entity_type: "extension",
        entity_id: platform,
        description: `Broken selector reported: ${platform}:${selectorType}`,
        details: {
          platform,
          selectorType,
          currentUrl,
          userAgent,
          localVersion,
          remoteVersion,
          details,
          timestamp
        },
        source: "extension",
        severity: "warning"
      });
      
      if (error) {
        console.error("[extension-selectors] Failed to log report:", error);
      }
      
      console.log(`[extension-selectors] Broken selector reported: ${platform}:${selectorType}`);
      
      return new Response(
        JSON.stringify({ success: true, message: "Report received" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      }
    );
    
  } catch (error) {
    console.error("[extension-selectors] Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
