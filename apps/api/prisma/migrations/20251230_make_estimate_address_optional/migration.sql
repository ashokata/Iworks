-- AlterTable: Make addressId optional in estimates table
ALTER TABLE "estimates" ALTER COLUMN "addressId" DROP NOT NULL;
