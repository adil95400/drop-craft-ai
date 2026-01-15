-- Add columns for variants, videos, and additional product data
ALTER TABLE public.imported_products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS original_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reviews_summary JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS seller_info JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.imported_products.variants IS 'Product variants with attributes like color, size, price';
COMMENT ON COLUMN public.imported_products.video_urls IS 'Product video URLs';
COMMENT ON COLUMN public.imported_products.original_images IS 'Original high-quality image URLs before optimization';
COMMENT ON COLUMN public.imported_products.specifications IS 'Product technical specifications';
COMMENT ON COLUMN public.imported_products.shipping_info IS 'Shipping options and costs';
COMMENT ON COLUMN public.imported_products.reviews_summary IS 'Summary of product reviews and ratings';
COMMENT ON COLUMN public.imported_products.seller_info IS 'Information about the seller/vendor';