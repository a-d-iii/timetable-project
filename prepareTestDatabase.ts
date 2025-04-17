// prepareTestDatabase.ts
import { prisma } from "./src/lib/prisma";

// Days as keys in your grid.
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Checks if the grid for all days contains at least one cell 
 * (case-insensitively) that includes the given keyword.
 * For the "CSE" check, cells ending with "L" (lab variants) are ignored.
 */
function gridContainsKeyword(grid: Record<string, string[]>, keyword: string): boolean {
  const upperKeyword = keyword.toUpperCase();
  return days.some(day =>
    (grid[day] || []).some(cell => {
      const cellVal = cell.trim().toUpperCase();
      if (upperKeyword === "CSE") {
        // Only count as CSE if it includes "CSE" but does NOT end with "L"
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
 * Checks whether a record’s grid is "suitable":
 * Must have at least one occurrence of "ECE", one occurrence of "MAT",
 * one proper "CSE" cell (includes "CSE" but does NOT end with "L"),
 * and at least one lab cell.
 */
function isRecordSuitable(grid: Record<string, string[]>): boolean {
  const hasECE = gridContainsKeyword(grid, "ECE");
  const hasMAT = gridContainsKeyword(grid, "MAT");
  const hasCSE = gridContainsKeyword(grid, "CSE");
  const hasLab = gridContainsLab(grid);
  return hasECE && hasMAT && hasCSE && hasLab;
}

/**
 * Logs current memory usage.
 */
function logMemoryUsage(stage: string) {
  const mem = process.memoryUsage();
  console.log(
    `${stage} - RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
}

/**
 * A helper delay function.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts to insert a record from the main Timetable into TestTimetables if it's suitable.
 * Returns true if inserted; false otherwise.
 */
async function tryInsertRecord(record: { 
  id: number; 
  allSlots: string[]; 
  grid: any; 
  semester: number; 
  degree: string 
}): Promise<boolean> {
  try {
    const grid: Record<string, string[]> =
      typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
      
    if (!isRecordSuitable(grid)) {
      console.log(`Record ID ${record.id}: Not suitable for TestTimetables.`);
      return false;
    }

    const newRec = await prisma.testTimetables.create({ // using plural here
      data: {
        semester: record.semester,
        degree: record.degree,
        allSlots: record.allSlots,
        grid: grid,
      },
    });
    console.log(`Inserted main record ID ${record.id} as TestTimetables with new ID: ${newRec.id}`);
    return true;
  } catch (error) {
    console.error(`Error inserting record ID ${record.id}:`, error);
    return false;
  }
}

/**
 * Main function:
 *  - Clears the existing TestTimetables table.
 *  - Repeatedly selects 10,000 random records from Timetable (including semester and degree),
 *    checks each record for suitability, and if suitable, inserts it into TestTimetables.
 *  - Continues until 50,000 records have been inserted.
 */
async function prepareTestDatabase() {
  try {
    console.log("Starting test database preparation...");

    // Clear TestTimetables table.
    console.log("Clearing existing data in TestTimetables...");
    await prisma.$executeRawUnsafe(`DELETE FROM "TestTimetables";`);
    console.log("TestTimetables table cleared.");

    // Create the TestTimetables table if it does not exist.
    console.log("Creating TestTimetables table if not exists...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TestTimetables" (
        LIKE "Timetable" INCLUDING ALL
      );
    `);
    console.log("TestTimetables table is ready.");

    const TARGET_COUNT = 50000;
    let insertedCount = 0;
    let iteration = 0;

    while (insertedCount < TARGET_COUNT) {
      iteration++;
      console.log(`\nIteration ${iteration}: Selecting 10000 random records...`);
      const randomRecords = await prisma.$queryRawUnsafe<
        Array<{ id: number; allSlots: string[]; grid: any; semester: number; degree: string }>
      >(`
        SELECT id, "allSlots", "grid", semester, degree
        FROM "Timetable"
        ORDER BY random()
        LIMIT 10000;
      `);
      
      console.log(`Iteration ${iteration}: Fetched ${randomRecords.length} records.`);
      
      for (const record of randomRecords) {
        try {
          const inserted = await tryInsertRecord(record);
          if (inserted) {
            insertedCount++;
            if (insertedCount % 1000 === 0) {
              console.log(`Total inserted so far: ${insertedCount}`);
            }
            if (insertedCount >= TARGET_COUNT) break;
          }
        } catch (e) {
          console.error(`Error processing record ID ${record.id}:`, e);
        }
      }
      
      console.log(`Iteration ${iteration}: Total inserted so far: ${insertedCount}`);
      logMemoryUsage(`After iteration ${iteration}`);
      await delay(200);
      if (global.gc) global.gc();
    }
    
    console.log(`\nPreparation complete. Total inserted records: ${insertedCount}`);
  } catch (error) {
    console.error("Error preparing test database:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

prepareTestDatabase()
  .then(() => console.log("Test database prepared successfully."))
  .catch(error => console.error(error));
