// addStsToTestFinal.ts
import { prisma } from "./src/lib/prisma";

// Base timetable layout (used for mapping slot codes to grid positions)
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
 * buildGlobalSlotMapping():
 * Builds a mapping from each slot code (in uppercase) to an array of positions (day and index) in the base timetable.
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
 * getOccupiedCells():
 * Given an array of slot codes, returns a set of grid cell keys (e.g., "Monday-3") occupied by those codes.
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
 * computeNewGridWithENG():
 * Overlays ENG2001 into the empty cells corresponding to the given ENG slot codes.
 * (This function is reused for STS as well but will be renamed below.)
 */
function computeNewGridWithCourse(baseGrid: Record<string, string[]>, courseLabel: string, slotCodes: string[]): Record<string, string[]> {
  const newGrid = JSON.parse(JSON.stringify(baseGrid));
  const occupied = getOccupiedCells(slotCodes);
  slotCodes.forEach(code => {
    const norm = code.trim().toUpperCase();
    const positions = globalSlotMapping[norm] || [];
    positions.forEach(({ day, index }) => {
      if (!newGrid[day][index] || newGrid[day][index].trim() === "") {
        newGrid[day][index] = courseLabel;
      }
    });
  });
  return newGrid;
}

/**
 * getDedupedStsSlotCombos():
 * Retrieves the STS1009 course from the database and deduplicates its slot combos based
 * on a signature (sorted, uppercase codes joined by "+").
 * (We consider all combos since STS1009 is to be added as a theory course.)
 */
async function getDedupedStsSlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const stsCourse = await prisma.course.findUnique({
    where: { code: "STS1009" },
    include: { slotCombos: true },
  });
  if (!stsCourse) {
    throw new Error("STS1009 course not found in the database.");
  }
  const seen = new Set<string>();
  const deduped: Array<{ id: number; slotCode: string }> = [];
  stsCourse.slotCombos.forEach((combo: any) => {
    const codes = combo.slotCode.split("+").map((s: string) => s.trim().toUpperCase());
    codes.sort();
    const signature = codes.join("+");
    if (!seen.has(signature)) {
      seen.add(signature);
      deduped.push({ id: combo.id, slotCode: combo.slotCode });
    }
  });
  console.log(`Deduped STS1009 slot combos count: ${deduped.length}`);
  return deduped;
}

/**
 * processTestTimetableRecordAllForSts():
 * For a given TestTimetables record, it tests every deduplicated STS1009 slot combo.
 * For each STS combo that fits (i.e. all grid cells the combo would occupy are empty),
 * it generates a new timetable by overlaying "STS1009" onto those cells and merging the slot codes
 * with the record's allSlots.
 * It inserts each valid possibility as a new record into TestTimetables.
 * Returns the number of new records generated for that original record.
 */
async function processTestTimetableRecordAllForSts(record: { id: number; semester: number; degree: string; allSlots: string[]; grid: any }): Promise<number> {
  console.log(`Processing TestTimetables record ID: ${record.id} for STS addition`);
  let baseGrid: Record<string, string[]>;

  try {
    baseGrid = typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
  } catch (e) {
    console.error(`Record ID ${record.id}: Invalid grid data. Skipping.`);
    return 0;
  }
  
  let newInsertions = 0;
  const stsSlotCombos = await getDedupedStsSlotCombos();
  
  for (const stsCombo of stsSlotCombos) {
    const stsCodes = stsCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
    const stsOccupiedCells = getOccupiedCells(stsCodes);
    
    let conflict = false;
    for (const cellKey of stsOccupiedCells) {
      const [day, indexStr] = cellKey.split("-");
      const index = parseInt(indexStr, 10);
      if (baseGrid[day][index] && baseGrid[day][index].trim() !== "") {
        conflict = true;
        break;
      }
    }
    if (conflict) {
      console.log(`Record ID ${record.id}: STS combo "${stsCombo.slotCode}" conflicts. Skipping this combo.`);
      continue;
    }
    
    const newGrid = computeNewGridWithCourse(baseGrid, "STS1009", stsCodes);
    const newAllSlots = Array.from(new Set([...record.allSlots, ...stsCodes]));
    
    try {
      const newRec = await prisma.testTimetables.create({
        data: {
          semester: record.semester,
          degree: record.degree,
          allSlots: newAllSlots,
          grid: newGrid,
        },
      });
      console.log(`Record ID ${record.id}: Generated new record with STS using combo "${stsCombo.slotCode}". New ID: ${newRec.id}`);
      newInsertions++;
    } catch (err) {
      console.error(`Error inserting new record for TestTimetables record ID ${record.id} with STS combo "${stsCombo.slotCode}":`, err);
    }
  }
  return newInsertions;
}

/**
 * Main function for STS addition:
 * - Processes all records from TestTimetables (the current 80k test subset).
 * - For each record, it generates new records (one per valid STS1009 slot combo) with STS1009 overlaid into empty cells.
 * - After processing, it deletes any record from TestTimetables that does not have a valid STS1009 entry.
 *   A valid STS1009 entry is identified by a cell containing "STS1009" (and not immediately followed by an "L").
 */
async function addStsToTestDatabase() {
  try {
    console.log("Starting STS addition process on TestTimetables...");
    
    // Fetch all TestTimetables records.
    const testRecords = await prisma.testTimetables.findMany({
      select: { id: true, semester: true, degree: true, allSlots: true, grid: true },
    });
    console.log(`Found ${testRecords.length} records in TestTimetables to process for STS addition.`);
    
    let totalNew = 0;
    let processedCount = 0;
    for (const record of testRecords) {
      const newCount = await processTestTimetableRecordAllForSts(record);
      totalNew += newCount;
      processedCount++;
      console.log(`Processed record ID ${record.id}; New STS records generated: ${newCount}`);
    }
    
    console.log(`Finished processing ${processedCount} records. Total new STS-augmented records: ${totalNew}`);
    
    // Delete all records in TestTimetables that do not have a valid STS1009 entry.
    // We use a regex that matches "STS1009" not immediately followed by "L".
    console.log("Deleting TestTimetables records without a valid STS1009 entry...");
    const deleteQuery = `
      DELETE FROM "TestTimetables"
      WHERE NOT (CAST("grid" AS text) ~* 'STS1009([^L]|$)')
    `;
    const deleteResult: any = await prisma.$executeRawUnsafe(deleteQuery);
    console.log(`Deletion complete. Removed ${deleteResult.count || "an unknown number of"} records from TestTimetables.`);
    
  } catch (error) {
    console.error("Error during STS addition process:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

addStsToTestDatabase()
  .then(() => console.log("STS addition process finished successfully."))
  .catch(error => console.error(error));
