/*
  Warnings:

  - You are about to drop the column `group` on the `tasks` table. All the data in the column will be lost.
  - Made the column `priority` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PRE_EVENT', 'ON_EVENT', 'POST_EVENT');

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "group",
ADD COLUMN     "type" "TaskType" NOT NULL DEFAULT 'PRE_EVENT',
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

-- DropEnum
DROP TYPE "public"."TaskGroup";
