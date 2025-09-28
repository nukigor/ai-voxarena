/*
  Warnings:

  - You are about to drop the column `communityTypeId` on the `Persona` table. All the data in the column will be lost.
  - You are about to drop the column `cultureId` on the `Persona` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Persona` table. All the data in the column will be lost.
  - You are about to drop the column `universityId` on the `Persona` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Persona_communityTypeId_idx";

-- DropIndex
DROP INDEX "public"."Persona_cultureId_idx";

-- DropIndex
DROP INDEX "public"."Persona_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Persona_universityId_idx";

-- AlterTable
ALTER TABLE "public"."Persona" DROP COLUMN "communityTypeId",
DROP COLUMN "cultureId",
DROP COLUMN "organizationId",
DROP COLUMN "universityId";
