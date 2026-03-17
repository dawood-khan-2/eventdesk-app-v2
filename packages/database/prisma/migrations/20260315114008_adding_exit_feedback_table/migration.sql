-- CreateTable
CREATE TABLE "exit_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exit_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exit_feedback_userId_key" ON "exit_feedback"("userId");

-- CreateIndex
CREATE INDEX "exit_feedback_userId_idx" ON "exit_feedback"("userId");

-- AddForeignKey
ALTER TABLE "exit_feedback" ADD CONSTRAINT "exit_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
