// deleteIncompleteTimetables.ts
import { prisma } from "./src/lib/prisma";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Checks if the grid for all days contains at least one cell 
 * (case-insensitive) that includes the given keyword.
 * For "CSE", cells ending with "L" are ignored.
 */
function gridContainsKeyword(grid: Record<string, string[]>, keyword: string): boolean {
  const upperKeyword = keyword.toUpperCase();
  return days.some(day =>
    (grid[day] || []).some(cell => {
      const cellVal = cell.trim().toUpperCase();
      if (upperKeyword === "CSE") {
        // Only count as CSE if it does not end with "L".
        return cellVal.includes(upperKeyword) && !cellVal.endsWith("L");
      }
      return cellVal.includes(upperKeyword);
    })
  );
}

/**
 * Checks if the grid has at least one lab cell.
 * A lab cell is defined as one whose trimmed value ends with "L" (case-insensitive).
 */
function gridContainsLab(grid: Record<string, string[]>): boolean {
  return days.some(day =>
    (grid[day] || []).some(cell => cell.trim().toUpperCase().endsWith("L"))
  );
}

/**
 * Logs the current memory usage.
 */
function logMemoryUsage(stage: string) {
  const mem = process.memoryUsage();
  console.log(
    `${stage} - RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
}

/**
 * A helper delay function to pause execution for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Processes a single timetable record:
 * - Fetches record details (id, allSlots, grid)
 * - Parses the grid and checks if it contains at least one cell with:
 *   "ECE", "CSE" (ignoring cells ending with "L"), "MAT"
 *   and at least one lab cell.
 * - If any of these are missing, deletes the record.
 * - Logs whether the record is kept or deleted.
 */
async function processRecord(recordId: number): Promise<{ id: number; deleted: boolean }> {
  console.log(`Processing record ID: ${recordId}`);
  try {
    const record = await prisma.timetable.findUnique({
      where: { id: recordId },
      select: { id: true, allSlots: true, grid: true },
    });
    if (!record) {
      console.log(`Record ID ${recordId} not found.`);
      return { id: recordId, deleted: false };
    }
    
    let grid: Record<string, string[]>;
    try {
      grid = typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
    } catch (e) {
      console.log(`Record ID ${recordId}: Invalid grid data. Marked for deletion.`);
      await prisma.timetable.delete({ where: { id: recordId } });
      return { id: recordId, deleted: true };
    }
    
    const hasECE = gridContainsKeyword(grid, "ECE");
    const hasCSE = gridContainsKeyword(grid, "CSE");
    const hasMAT = gridContainsKeyword(grid, "MAT");
    const hasLab = gridContainsLab(grid);
    
    console.log(`Record ID ${recordId}: hasECE=${hasECE}, hasCSE=${hasCSE}, hasMAT=${hasMAT}, hasLab=${hasLab}`);
    
    if (hasECE && hasCSE && hasMAT && hasLab) {
      console.log(`Record ID ${recordId}: Kept.`);
      return { id: recordId, deleted: false };
    } else {
      await prisma.timetable.delete({ where: { id: recordId } });
      console.log(`Record ID ${recordId}: Deleted.`);
      return { id: recordId, deleted: true };
    }
  } catch (error) {
    console.error(`Error processing record ID ${recordId}:`, error);
    return { id: recordId, deleted: false };
  }
}

/**
 * Main function: processes timetable records one by one in very small batches.
 * Provides detailed live logging about each record's outcome.
 */
async function deleteIncompleteTimetables() {
  try {
    console.log("Starting deletion of incomplete timetables...");
    const idRecords = await prisma.timetable.findMany({ select: { id: true } });
    console.log(`Total timetable records to process: ${idRecords.length}`);
    
    const ids = idRecords.map(r => r.id);
    let totalDeleted = 0;
    let processedCount = 0;
    
    for (const id of ids) {
      const result = await processRecord(id);
      processedCount++;
      if (result.deleted) totalDeleted++;
      logMemoryUsage(`After processing record ID ${id} (Processed ${processedCount} records)`);
      await delay(100); // 100ms delay between records
    }
    
    console.log(`\nDeletion complete. Processed ${processedCount} records.`);
    console.log(`Total records deleted: ${totalDeleted}`);
  } catch (error) {
    console.error("Error deleting incomplete timetables:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

deleteIncompleteTimetables();
