-- Migration: Simplify Estimates Structure
-- Remove EstimateOption table and move line items directly under Estimate
-- Add expiration date and customer approval fields

-- Step 1: Add new fields to Estimate table
ALTER TABLE "estimates" 
  ADD COLUMN IF NOT EXISTS "expirationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "customerCanApprove" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "multipleOptionsAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Step 2: Add estimateId column to estimate_line_items (nullable first)
ALTER TABLE "estimate_line_items"
  ADD COLUMN IF NOT EXISTS "estimateId" TEXT;

-- Step 3: Migrate data - copy estimateId from estimate_options to line items
UPDATE "estimate_line_items" el
SET "estimateId" = eo."estimateId"
FROM "estimate_options" eo
WHERE el."estimateOptionId" = eo.id;

-- Step 4: Make estimateId required
ALTER TABLE "estimate_line_items"
  ALTER COLUMN "estimateId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "estimate_line_items"
  ADD CONSTRAINT "estimate_line_items_estimateId_fkey" 
  FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Create new index on estimateId
CREATE INDEX IF NOT EXISTS "estimate_line_items_estimateId_idx" 
  ON "estimate_line_items"("estimateId");

-- Step 7: Create new composite index on estimateId and type
CREATE INDEX IF NOT EXISTS "estimate_line_items_estimateId_type_idx" 
  ON "estimate_line_items"("estimateId", "type");

-- Step 8: Remove old indexes and constraints from estimate_line_items
DROP INDEX IF EXISTS "estimate_line_items_estimateOptionId_idx";
ALTER TABLE "estimate_line_items" 
  DROP CONSTRAINT IF EXISTS "estimate_line_items_estimateOptionId_fkey";

-- Step 9: Drop the old estimateOptionId column
ALTER TABLE "estimate_line_items"
  DROP COLUMN IF EXISTS "estimateOptionId";

-- Step 10: Remove isSelected column (not needed in simplified structure)
ALTER TABLE "estimate_line_items"
  DROP COLUMN IF EXISTS "isSelected";

-- Step 11: Drop estimate_options table
DROP TABLE IF EXISTS "estimate_options";

-- Step 12: Remove approvedOptionId from estimates (no longer needed)
ALTER TABLE "estimates"
  DROP COLUMN IF EXISTS "approvedOptionId";
