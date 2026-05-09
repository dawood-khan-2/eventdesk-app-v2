/*
  Warnings:

  - You are about to drop the column `onboardingChecklistDismissedAt` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "onboardingChecklistDismissedAt",
ADD COLUMN     "onboardingWizardStep" TEXT;
