// addEngToTestFinal.ts
import { prisma } from "./src/lib/prisma";

// Base timetable layout used for mapping slot codes to grid positions.
const baseTimetable: Record<string, string[]> = {
  Monday:    ["L1", "TA1/L2", "TB1/L3", "E1/L4", "E1/L5", "L6", "Lunch", "TA2/L37", "TB2/L38", "E2/L39", "E2/L40", "L41", "L42"],
  Tuesday:   ["TDDI/L7", "B1/L8/SC2", "G1/L9/TE1", "A1/L10/SF2", "F1/L11", "L12", "Lunch", "B2/L43/SC1", "G2/L44/TE2", "A2/L45/SF1", "F2/L46", "TFF2/L47", "L48"],
  Wednesday: ["TEE1/L13", "G1/L14/TF1", "A1/L15/SE2", "C1/L16", "B1/L17/SD2", "L18", "Lunch", "G2/L49/TF2", "A2/L50/SE1", "C2/L51", "B2/L52/SD1", "TDD2/L53", "L54"],
  Thursday:  ["TG1/L19", "C1/L20", "D1/L21", "A1/L22/SB2", "F1/L23", "L24", "Lunch", "C2/L55", "D2/L56", "A2/L57/SB1", "F2/L58", "TEE2/L59", "L60"],
  Friday:    ["TFF1/L25", "B1/L26/SA2", "TC1/L27", "E1/L28", "D1/L29", "L30", "Lunch", "B2/L61/SA1", "TC2/L62", "E2/L63", "D2/L64", "TG2/L65", "L66"],
  Saturday:  ["L31", "G1/L32/TD1", "D1/L33", "F1/L34", "C1/L35", "L36", "Lunch", "G2/L67/TD2", "D2/L68", "F2/L69", "C2/L70", "L71", "L72"],
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Build a mapping from each slot code (in uppercase) to its positions (day and index) in the base timetable.
 */
function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      const codes = cell.split("/").map(c => c.trim().toUpperCase());
      codes.forEach(code => {
        if (code === "LUNCH") return;
        if (!mapping[code]) mapping[code] = [];
        mapping[code].push({ day, index });
      });
    });
  }
  return mapping;
}
const globalSlotMapping = buildGlobalSlotMapping();

/**
 * Given an array of slot codes, return a set of grid cell keys (e.g., "Monday-3") that those codes occupy.
 */
function getOccupiedCells(slotCodes: string[]): Set<string> {
  const cells = new Set<string>();
  slotCodes.forEach(code => {
    const norm = code.trim().toUpperCase();
    const positions = globalSlotMapping[norm] || [];
    positions.forEach(pos => cells.add(`${pos.day}-${pos.index}`));
  });
  return cells;
}

/**
 * Overlays the ENG course ("ENG2001") on a grid using the given ENG slot codes.
 * Only fills cells that are empty.
 */
function computeNewGridWithENG(baseGrid: Record<string, string[]>, engSlotCodes: string[]): Record<string, string[]> {
  const newGrid = JSON.parse(JSON.stringify(baseGrid));
  const engOccupied = getOccupiedCells(engSlotCodes);
  engSlotCodes.forEach(code => {
    const norm = code.trim().toUpperCase();
    const positions = globalSlotMapping[norm] || [];
    positions.forEach(({ day, index }) => {
      if (!newGrid[day][index] || newGrid[day][index].trim() === "") {
        newGrid[day][index] = "ENG2001";
      }
    });
  });
  return newGrid;
}

/**
 * getDedupedEngSlotCombos():
 * Retrieves the ENG2001 course from the database and deduplicates its slot combos.
 * It only considers combos for ENG theory—any combo with a code ending in "L" is skipped.
 */
async function getDedupedEngSlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const engCourse = await prisma.course.findUnique({
    where: { code: "ENG2001" },
    include: { slotCombos: true },
  });
  if (!engCourse) {
    throw new Error("ENG2001 course not found in the database.");
  }
  const seen = new Set<string>();
  const deduped: Array<{ id: number; slotCode: string }> = [];
  engCourse.slotCombos.forEach((combo: any) => {
    const codes = combo.slotCode.split("+").map((s: string) => s.trim().toUpperCase());
    // Skip if any code ends with "L" (lab variant)
    if (codes.some((code: string) => code.endsWith("L"))) {
      return;
    }
    codes.sort();
    const signature = codes.join("+");
    if (!seen.has(signature)) {
      seen.add(signature);
      deduped.push({ id: combo.id, slotCode: combo.slotCode });
    }
  });
  console.log(`Deduped ENG2001 slot combos count (theory only): ${deduped.length}`);
  return deduped;
}

/**
 * For a given TestTimetables record, tests ALL deduplicated ENG2001 slot combos.
 * For every valid ENG combo (i.e. where all corresponding grid cells are empty),
 * it generates a new timetable by overlaying ENG2001 into those empty cells
 * and unions the ENG slot codes with the original allSlots.
 * Inserts the new record into TestTimetables (appending to the 80k) for each valid possibility.
 * Returns the number of new records generated for that original record.
 */
async function processTestTimetableRecordAllForEng(record: { id: number; semester: number; degree: string; allSlots: string[]; grid: any }): Promise<number> {
  console.log(`Processing TestTimetables record ID: ${record.id} for ENG addition`);
  let baseGrid: Record<string, string[]>;
  try {
    baseGrid = typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
  } catch (e) {
    console.error(`Record ID ${record.id}: Invalid grid data. Skipping.`);
    return 0;
  }
  
  let newInsertions = 0;
  const engSlotCombos = await getDedupedEngSlotCombos();
  
  for (const engCombo of engSlotCombos) {
    const engCodes = engCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
    const engOccupiedCells = getOccupiedCells(engCodes);
    
    let conflict = false;
    for (const cellKey of engOccupiedCells) {
      const [day, indexStr] = cellKey.split("-");
      const index = parseInt(indexStr, 10);
      if (baseGrid[day][index] && baseGrid[day][index].trim() !== "") {
        conflict = true;
        break;
      }
    }
    if (conflict) {
      console.log(`Record ID ${record.id}: ENG combo "${engCombo.slotCode}" conflicts. Skipping this combo.`);
      continue;
    }
    
    const newGrid = computeNewGridWithENG(baseGrid, engCodes);
    const newAllSlots = Array.from(new Set([...record.allSlots, ...engCodes]));
    
    try {
      const newRec = await prisma.testTimetables.create({
        data: {
          semester: record.semester,
          degree: record.degree,
          allSlots: newAllSlots,
          grid: newGrid,
        },
      });
      console.log(`Record ID ${record.id}: Generated new record with ENG using combo "${engCombo.slotCode}". New ID: ${newRec.id}`);
      newInsertions++;
    } catch (err) {
      console.error(`Error inserting new record for TestTimetables record ID ${record.id} with ENG combo "${engCombo.slotCode}":`, err);
    }
  }
  return newInsertions;
}

/**
 * Main function for ENG addition:
 * - Processes all records in TestTimetables (the current 80k test subset).
 * - For each record, generates new records with ENG augmentation for every valid ENG theory slot combo.
 * - Then, deletes from TestTimetables any record that does not have a valid ENG theory entry,
 *   i.e. a cell that contains "ENG2001" that is not immediately followed by "L".
 */
async function addEngToTestDatabase() {
  try {
    console.log("Starting ENG addition process on TestTimetables...");

    // Fetch all records from TestTimetables.
    const testRecords = await prisma.testTimetables.findMany({
      select: { id: true, semester: true, degree: true, allSlots: true, grid: true },
    });
    console.log(`Found ${testRecords.length} records in TestTimetables to process for ENG addition.`);
    
    let totalNew = 0;
    let processedCount = 0;
    for (const record of testRecords) {
      const newCount = await processTestTimetableRecordAllForEng(record);
      totalNew += newCount;
      processedCount++;
      console.log(`Processed record ID ${record.id}; New ENG records generated: ${newCount}`);
    }
    
    console.log(`Finished processing ${processedCount} records. Total new ENG-augmented records generated: ${totalNew}`);
    
    // Now delete any TestTimetables records that do not have a valid ENG theory entry.
    // We want to ensure that "ENG2001" appears in the grid and is not immediately followed by an "L".
    console.log("Deleting TestTimetables records without a valid ENG theory entry...");
    const deleteQuery = `
      DELETE FROM "TestTimetables"
      WHERE NOT (CAST("grid" AS text) ~* 'ENG2001([^L]|$)')
    `;
    const deleteResult: any = await prisma.$executeRawUnsafe(deleteQuery);
    console.log(`Deletion complete. Removed ${deleteResult.count || "an unknown number of"} records from TestTimetables.`);
    
  } catch (error) {
    console.error("Error during ENG addition process:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

addEngToTestDatabase()
  .then(() => console.log("ENG addition process finished successfully."))
  .catch(error => console.error(error));
