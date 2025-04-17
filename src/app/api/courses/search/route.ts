// src/app/api/courses/search/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        slotCombos: true,
      },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error searching courses:", error);
    return NextResponse.json({ error: "Error searching courses" }, { status: 500 });
  }
}
