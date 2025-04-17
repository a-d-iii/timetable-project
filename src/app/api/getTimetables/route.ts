import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  
  try {
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        return NextResponse.json({ message: "Invalid timetable ID" }, { status: 400 });
      }
      // Return the timetable with that specific ID (if exists) in an array.
      const timetable = await prisma.timetable.findUnique({ where: { id } });
      return NextResponse.json(timetable ? [timetable] : []);
    }
    // Otherwise, return a default set (for example, the first 1000 timetables)
    const timetables = await prisma.timetable.findMany({ take: 1000 });
    return NextResponse.json(timetables);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching timetables" }, { status: 500 });
  }
}
