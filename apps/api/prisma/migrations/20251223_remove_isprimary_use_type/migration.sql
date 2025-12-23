-- Migration to remove isPrimary and use type field exclusively
-- Step 1: Sync existing data - set type='PRIMARY' where isPrimary=true

-- First, ensure all addresses with isPrimary=true also have type='PRIMARY'
UPDATE addresses 
SET type = 'PRIMARY' 
WHERE "isPrimary" = true;

-- Step 2: Handle cases where multiple addresses might be marked as primary
-- Keep only the oldest one as PRIMARY, change others to SERVICE
WITH ranked_primaries AS (
  SELECT 
    id,
    "customerId",
    ROW_NUMBER() OVER (PARTITION BY "customerId" ORDER BY "createdAt" ASC) as rn
  FROM addresses
  WHERE type = 'PRIMARY'
)
UPDATE addresses 
SET type = 'SERVICE'
FROM ranked_primaries
WHERE addresses.id = ranked_primaries.id 
  AND ranked_primaries.rn > 1;

-- Step 3: Drop the old isPrimary-based constraint
DROP INDEX IF EXISTS "addresses_customer_primary_unique";

-- Step 4: Create new constraint based on type='PRIMARY'
CREATE UNIQUE INDEX IF NOT EXISTS "addresses_customer_type_primary_unique" 
ON "addresses" ("customerId") 
WHERE type = 'PRIMARY';

COMMENT ON INDEX "addresses_customer_type_primary_unique" IS 'Ensures each customer can have only one PRIMARY type address';

-- Step 5: Remove the isPrimary column (after ensuring data is migrated)
ALTER TABLE addresses DROP COLUMN IF EXISTS "isPrimary";
