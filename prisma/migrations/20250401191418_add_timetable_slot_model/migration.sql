/*
  Warnings:

  - You are about to drop the column `allSlots` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `grid` on the `Timetable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "allSlots",
DROP COLUMN "grid";

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "slotContent" TEXT,
    "timetableId" INTEGER NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
