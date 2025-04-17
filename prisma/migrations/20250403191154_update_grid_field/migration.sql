/*
  Warnings:

  - Made the column `grid` on table `Timetable` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Timetable" ALTER COLUMN "grid" SET NOT NULL;
