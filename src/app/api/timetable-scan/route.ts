import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Helper function: try to parse the grid field.
function parseGrid(gridValue: any): any {
  if (typeof gridValue === "string") {
    try {
      return JSON.parse(gridValue);
    } catch (e) {
      return null;
    }
  } else if (typeof gridValue === "object" && gridValue !== null) {
    return gridValue;
  }
  return null;
}

// Helper function: check if the grid (an object with day keys and arrays of cell strings)
// contains all of the specified course codes (case-insensitive).
function gridHasCourses(grid: any, courses: string[]): boolean {
  if (!grid || typeof grid !== "object") return false;
  const found = new Set<string>();
  for (const day in grid) {
    if (Array.isArray(grid[day])) {
      for (const cell of grid[day]) {
        if (typeof cell === "string") {
          found.add(cell.trim().toUpperCase());
        }
      }
    }
  }
  return courses.every(course => found.has(course.toUpperCase()));
}

export async function GET(req: Request) {
  const batchSize = 1000;
  let processed = 0;
  let eligibleCount = 0;
  let withCSE = 0;
  let withoutCSE = 0;

  // Get the total count of timetable records.
  const totalRecords = await prisma.timetable.count();
  
  // Create a ReadableStream to stream progress updates.
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`Starting scan of ${totalRecords} timetable records...\n`);
      for (let skip = 0; skip < totalRecords; skip += batchSize) {
        try {
          const batch = await prisma.timetable.findMany({
            skip,
            take: batchSize,
            select: { id: true, grid: true }
          });
          for (const tt of batch) {
            processed++;
            const grid = parseGrid(tt.grid);
            if (gridHasCourses(grid, ["MAT1002", "ECE1003"])) {
              eligibleCount++;
              if (gridHasCourses(grid, ["CSE2005"])) {
                withCSE++;
              } else {
                withoutCSE++;
              }
            }
          }
          controller.enqueue(
            `Processed ${processed} / ${totalRecords} records; Eligible: ${eligibleCount}; With CSE: ${withCSE}; Without CSE: ${withoutCSE}\n`
          );
        } catch (err: any) {
          controller.enqueue(`Error processing batch starting at ${skip}: ${err.message}\n`);
        }
      }
      controller.enqueue("Scan complete.\n");
      controller.close();
    }
  });
  
  return new Response(stream, { headers: { "Content-Type": "text/plain" } });
}
