/*
  Warnings:

  - You are about to drop the column `done` on the `itineraries` table. All the data in the column will be lost.
  - Added the required column `date` to the `itineraries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "itineraries" DROP COLUMN "done",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
