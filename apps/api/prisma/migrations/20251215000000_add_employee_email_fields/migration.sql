-- AlterTable
-- Add email, firstName, lastName, phone fields to employees table
-- These fields allow employees to exist independently of user accounts
-- Employees can be matched with users by email when users verify their email

ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employees_tenantId_email_idx" ON "employees"("tenantId", "email");

-- Comment
COMMENT ON COLUMN "employees"."email" IS 'Email address for matching employees with user accounts';
COMMENT ON COLUMN "employees"."firstName" IS 'First name (for employees without user accounts)';
COMMENT ON COLUMN "employees"."lastName" IS 'Last name (for employees without user accounts)';
COMMENT ON COLUMN "employees"."phone" IS 'Phone number (for employees without user accounts)';

