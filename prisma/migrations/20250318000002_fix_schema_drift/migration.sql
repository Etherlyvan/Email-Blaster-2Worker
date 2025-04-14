-- AlterTable
ALTER TABLE "EmailDelivery" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);