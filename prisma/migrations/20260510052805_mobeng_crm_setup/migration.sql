-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('UPLOAD', 'API');

-- CreateEnum
CREATE TYPE "ImportDuplicateMode" AS ENUM ('SKIP', 'UPDATE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "AutomationJob" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TransactionImportLog" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "duplicateMode" "ImportDuplicateMode" NOT NULL DEFAULT 'SKIP',
    "status" "ImportStatus" NOT NULL DEFAULT 'SUCCESS',
    "branchId" TEXT,
    "importedById" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionImportLog_source_idx" ON "TransactionImportLog"("source");

-- CreateIndex
CREATE INDEX "TransactionImportLog_status_idx" ON "TransactionImportLog"("status");

-- CreateIndex
CREATE INDEX "TransactionImportLog_branchId_idx" ON "TransactionImportLog"("branchId");

-- CreateIndex
CREATE INDEX "TransactionImportLog_importedById_idx" ON "TransactionImportLog"("importedById");

-- CreateIndex
CREATE INDEX "TransactionImportLog_importedAt_idx" ON "TransactionImportLog"("importedAt");

-- CreateIndex
CREATE INDEX "AutomationJob_scheduledAt_idx" ON "AutomationJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "AutomationJob_lockedAt_idx" ON "AutomationJob"("lockedAt");

-- AddForeignKey
ALTER TABLE "TransactionImportLog" ADD CONSTRAINT "TransactionImportLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionImportLog" ADD CONSTRAINT "TransactionImportLog_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
