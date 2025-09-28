/*
  Warnings:

  - The `verbosity` column on the `Persona` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Persona" DROP COLUMN "verbosity",
ADD COLUMN     "verbosity" INTEGER;
