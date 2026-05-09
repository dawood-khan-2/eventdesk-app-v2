/*
  Warnings:

  - You are about to drop the column `onboardingCompletedAt` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "onboardingCompletedAt",
ADD COLUMN     "onboardingChecklistDismissedAt" TIMESTAMP(3);
