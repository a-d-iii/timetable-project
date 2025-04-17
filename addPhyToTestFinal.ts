// addPhyToTestFinal.ts
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
 * buildGlobalSlotMapping():
 * Build a mapping from each slot code (in uppercase) to its positions (day and index)
 * in the base timetable.
 */
function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      // Split the cell by "/" in case it contains multiple codes.
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
 * Given an array of slot codes, return a set of grid cell keys (like "Monday-3")
 * that these codes would occupy.
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
 * computeNewGridWithPHY():
 * Returns a new grid by overlaying the PHY course ("PHY1007") into empty cells corresponding
 * to the given PHY slot codes.
 */
function computeNewGridWithPHY(baseGrid: Record<string, string[]>, phySlotCodes: string[]): Record<string, string[]> {
  const newGrid = JSON.parse(JSON.stringify(baseGrid)); // deep clone
  const phyOccupied = getOccupiedCells(phySlotCodes);
  phySlotCodes.forEach(code => {
    const norm = code.trim().toUpperCase();
    const positions = globalSlotMapping[norm] || [];
    positions.forEach(({ day, index }) => {
      if (!newGrid[day][index] || newGrid[day][index].trim() === "") {
        newGrid[day][index] = "PHY1007";
      }
    });
  });
  return newGrid;
}

/**
 * getDedupedPhySlotCombos():
 * Retrieves the PHY1007 course from the Course table and deduplicates its slot combos
 * based on a signature (sorted, uppercase codes joined by "+").
 */
async function getDedupedPhySlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const phyCourse = await prisma.course.findUnique({
    where: { code: "PHY1007" },
    include: { slotCombos: true },
  });
  if (!phyCourse) {
    throw new Error("PHY1007 course not found in the database.");
  }
  const seen = new Set<string>();
  const deduped: Array<{ id: number; slotCode: string }> = [];
  phyCourse.slotCombos.forEach((combo: any) => {
    const codes = combo.slotCode.split("+").map((s: string) => s.trim().toUpperCase());
    codes.sort();
    const signature = codes.join("+");
    if (!seen.has(signature)) {
      seen.add(signature);
      deduped.push({ id: combo.id, slotCode: combo.slotCode });
    }
  });
  console.log(`Deduped PHY slot combos count: ${deduped.length}`);
  return deduped;
}

/**
 * processTestTimetableRecordAll():
 * For each record from TestTimetables, test every deduplicated PHY slot combo.
 * For each PHY combo that fits (i.e. all corresponding grid cells are empty),
 * generate a new PHY-augmented timetable by overlaying "PHY1007" into the empty cells
 * and unioning the PHY slot codes with the original allSlots.
 * Insert each generated timetable as a new record in TestTimetables.
 * (This effectively adds all possible PHY augmentations for that record.)
 * Returns the number of new records generated for that test record.
 */
async function processTestTimetableRecordAll(record: { id: number; semester: number; degree: string; allSlots: string[]; grid: any }): Promise<number> {
  console.log(`Processing TestTimetables record ID: ${record.id}`);
  let baseGrid: Record<string, string[]>;
  try {
    baseGrid = typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
  } catch (e) {
    console.error(`Record ID ${record.id}: Invalid grid data. Skipping.`);
    return 0;
  }
  
  let newInsertions = 0;
  const phySlotCombos = await getDedupedPhySlotCombos();
  
  for (const phyCombo of phySlotCombos) {
    const phyCodes = phyCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
    const phyOccupiedCells = getOccupiedCells(phyCodes);
    
    // Check for conflict: each cell that the PHY combo would occupy must be empty.
    let conflict = false;
    for (const cellKey of phyOccupiedCells) {
      const [day, indexStr] = cellKey.split("-");
      const index = parseInt(indexStr, 10);
      if (baseGrid[day][index] && baseGrid[day][index].trim() !== "") {
        conflict = true;
        break;
      }
    }
    if (conflict) {
      console.log(`Record ID ${record.id}: PHY combo "${phyCombo.slotCode}" conflicts. Skipping this combo.`);
      continue;
    }
    
    // Compute a new grid with PHY overlaid.
    const newGrid = computeNewGridWithPHY(baseGrid, phyCodes);
    // Generate new allSlots as the union of original allSlots and the PHY slot codes.
    const newAllSlots = Array.from(new Set([...record.allSlots, ...phyCodes]));
    
    try {
      // Insert a new record into TestTimetables (keeping the same table) for this valid PHY possibility.
      const newRec = await prisma.testTimetables.create({
        data: {
          semester: record.semester,
          degree: record.degree,
          allSlots: newAllSlots,
          grid: newGrid,
        },
      });
      console.log(`Record ID ${record.id}: Generated new record with PHY using combo "${phyCombo.slotCode}". New ID: ${newRec.id}`);
      newInsertions++;
    } catch (err) {
      console.error(`Error inserting new record for TestTimetable record ID ${record.id} with PHY combo "${phyCombo.slotCode}":`, err);
    }
  }
  return newInsertions;
}

/**
 * Main function:
 * 1. Processes every record in TestTimetables (the 50k test subset).
 * 2. For each record, it generates and inserts all possible PHY-augmented timetables.
 * 3. Then, it deletes any record from TestTimetables that does not have a PHY entry ("PHY1007")
 *    in the grid.
 */
async function addPhyToTestDatabase() {
  try {
    console.log("Starting PHY addition process on TestTimetables...");

    // Fetch all records from TestTimetables.
    const testRecords = await prisma.testTimetables.findMany({
      select: { id: true, semester: true, degree: true, allSlots: true, grid: true },
    });
    console.log(`Found ${testRecords.length} records in TestTimetables to process.`);
    
    let totalNew = 0;
    let processedCount = 0;
    
    // Process each record.
    for (const record of testRecords) {
      const newCount = await processTestTimetableRecordAll(record);
      totalNew += newCount;
      processedCount++;
      console.log(`Processed record ID ${record.id}; New records generated: ${newCount}`);
    }
    
    console.log(`Finished processing ${processedCount} records. Total new PHY-augmented records generated: ${totalNew}`);
    
    // After processing, delete any TestTimetables record that does not contain a valid PHY theory entry.
    // Here we use a regular expression to ensure we match "PHY1007" not followed by an "L".
    console.log("Deleting TestTimetables records without a valid PHY theory entry...");
    const deleteQuery = `
      DELETE FROM "TestTimetables"
      WHERE NOT (
        CAST("grid" AS text) ~* 'PHY1007([^L]|$)'
      )
    `;
    const deleteResult: any = await prisma.$executeRawUnsafe(deleteQuery);
    console.log(`Deletion complete. Removed ${deleteResult.count || "an unknown number of"} records from TestTimetables.`);
    
  } catch (error) {
    console.error("Error during PHY addition process:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

addPhyToTestDatabase()
  .then(() => console.log("PHY addition process finished successfully."))
  .catch(error => console.error(error));
