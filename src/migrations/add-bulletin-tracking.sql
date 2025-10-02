-- Migration: Add Bulletin Chain tracking columns
-- Date: 2025-10-02
-- Purpose: Track Bulletin Chain uploads for 10-day re-submission strategy

-- Add storage provider tracking
ALTER TABLE products ADD COLUMN storage_provider TEXT DEFAULT 'ipfs' CHECK(storage_provider IN ('ipfs', 'bulletin'));

-- Add Bulletin Chain upload timestamp
ALTER TABLE products ADD COLUMN bulletin_uploaded_at DATETIME;

-- Add Bulletin Chain content hash (may differ from IPFS hash)
ALTER TABLE products ADD COLUMN bulletin_content_hash TEXT;

-- Create index for re-submission queries
CREATE INDEX IF NOT EXISTS idx_products_bulletin_resubmit
ON products(storage_provider, bulletin_uploaded_at, is_active)
WHERE storage_provider = 'bulletin' AND is_active = 1;

-- Notes:
-- - storage_provider: 'ipfs' (permanent) or 'bulletin' (2-week cache)
-- - bulletin_uploaded_at: timestamp of last Bulletin Chain submission
-- - Re-submission needed when: NOW() - bulletin_uploaded_at > 10 days
-- - Content expires when: NOW() - bulletin_uploaded_at > 14 days
