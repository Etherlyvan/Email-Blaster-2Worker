/*
  Warnings:

  - A unique constraint covering the columns `[email,name,userId]` on the table `BrevoSender` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BrevoSender_email_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "BrevoSender_email_name_userId_key" ON "BrevoSender"("email", "name", "userId");
