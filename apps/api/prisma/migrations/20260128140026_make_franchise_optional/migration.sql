-- AlterTable: Make franchiseId optional for super_admin users
ALTER TABLE "users" ALTER COLUMN "franchise_id" DROP NOT NULL;
