/*
  Warnings:

  - You are about to drop the column `support_material_url` on the `lessons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "support_material_url",
ADD COLUMN     "support_materials" TEXT[] DEFAULT ARRAY[]::TEXT[];
