-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "shareToken" TEXT;
ALTER TABLE "notes" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "notes_shareToken_key" ON "notes"("shareToken");


