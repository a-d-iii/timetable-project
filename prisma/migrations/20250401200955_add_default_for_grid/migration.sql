/*
  Warnings:

  - You are about to drop the `TimetableSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TimetableSlot" DROP CONSTRAINT "TimetableSlot_timetableId_fkey";

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "allSlots" TEXT[],
ADD COLUMN     "grid" JSONB;

-- DropTable
DROP TABLE "TimetableSlot";
