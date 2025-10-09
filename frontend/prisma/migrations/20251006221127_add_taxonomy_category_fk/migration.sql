-- AlterTable
ALTER TABLE "public"."Taxonomy" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "public"."TaxonomyCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCategory_key_key" ON "public"."TaxonomyCategory"("key");

-- AddForeignKey
ALTER TABLE "public"."Taxonomy" ADD CONSTRAINT "Taxonomy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."TaxonomyCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
