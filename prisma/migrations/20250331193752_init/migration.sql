-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotCombo" (
    "id" SERIAL NOT NULL,
    "slotCode" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "SlotCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" SERIAL NOT NULL,
    "semester" INTEGER NOT NULL,
    "degree" TEXT NOT NULL,
    "grid" JSONB NOT NULL,
    "allSlots" TEXT[],

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- AddForeignKey
ALTER TABLE "SlotCombo" ADD CONSTRAINT "SlotCombo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
