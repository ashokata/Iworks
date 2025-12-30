-- Revert: Make addressId required again in estimates table
-- First update any NULL values to empty string (shouldn't be any)
UPDATE "estimates" SET "addressId" = '' WHERE "addressId" IS NULL;

-- Then make the column NOT NULL
ALTER TABLE "estimates" ALTER COLUMN "addressId" SET NOT NULL;
