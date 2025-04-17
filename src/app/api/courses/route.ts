// src/app/api/courses/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Parse query parameters from the URL
  const { searchParams } = new URL(request.url);
  const semesterParam = searchParams.get("semester");
  const degree = searchParams.get("degree");

  // Convert semester to a number if provided
  const semester = semesterParam ? Number(semesterParam) : undefined;

  try {
    // Fetch courses that match the provided semester and degree.
    // If either parameter is missing, that filter is omitted.
    const courses = await prisma.course.findMany({
      where: {
        ...(semester !== undefined ? { semester } : {}),
        ...(degree ? { degree } : {}),
      },
      include: {
        slotCombos: true,
      },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Error fetching courses" }, { status: 500 });
  }
}
