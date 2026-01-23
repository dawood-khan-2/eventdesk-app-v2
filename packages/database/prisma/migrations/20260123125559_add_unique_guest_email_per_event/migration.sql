/*
  Warnings:

  - A unique constraint covering the columns `[eventId,email]` on the table `guests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "guests_eventId_email_key" ON "guests"("eventId", "email");
