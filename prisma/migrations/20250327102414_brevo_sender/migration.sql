-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "brevoSenderId" TEXT;

-- CreateTable
CREATE TABLE "BrevoSender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrevoSender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrevoSender_userId_idx" ON "BrevoSender"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrevoSender_email_userId_key" ON "BrevoSender"("email", "userId");

-- CreateIndex
CREATE INDEX "Campaign_brevoSenderId_idx" ON "Campaign"("brevoSenderId");

-- AddForeignKey
ALTER TABLE "BrevoSender" ADD CONSTRAINT "BrevoSender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brevoSenderId_fkey" FOREIGN KEY ("brevoSenderId") REFERENCES "BrevoSender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
