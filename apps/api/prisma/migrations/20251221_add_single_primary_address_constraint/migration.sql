-- Add partial unique index to ensure only one primary address per customer
-- This constraint only applies when isPrimary = true, allowing multiple non-primary addresses

-- Create a unique partial index that enforces the constraint at the database level
CREATE UNIQUE INDEX IF NOT EXISTS "addresses_customer_primary_unique" 
ON "addresses" ("customerId") 
WHERE "isPrimary" = true;

-- Add a comment to document the constraint
COMMENT ON INDEX "addresses_customer_primary_unique" IS 'Ensures each customer can have only one primary address';
