-- Add image_url column to product_master table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE product_master
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN product_master.image_url IS 'URL to product image stored in Supabase Storage (bucket: product-images)';

-- Index for faster image queries
CREATE INDEX IF NOT EXISTS idx_product_master_image_url
ON product_master (image_url)
WHERE image_url IS NOT NULL;
