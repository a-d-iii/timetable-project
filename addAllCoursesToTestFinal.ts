// addAllCoursesToTestFinal.ts

import { prisma } from "./src/lib/prisma";

// ------------------------------------------------------------------
// Global Base Timetable and Utility Functions
// ------------------------------------------------------------------

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
 * Builds a mapping from each slot code (uppercase) to an array of positions { day, index }.
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
 * Given an array of slot codes, returns a set of grid cell keys (like "Monday-3")
 * representing the cells those codes occupy.
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
 * unionArrays():
 * Returns the union of two arrays (removing duplicates).
 */
function unionArrays(arr1: string[], arr2: string[]): string[] {
  return Array.from(new Set([...arr1, ...arr2]));
}

/**
 * computeNewGridWithCourse():
 * Overlays a given course label (e.g., "PHY1007", "ENG2001", or "STS1009") into the empty cells
 * of baseGrid corresponding to the provided slotCodes.
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
 * delay():
 * A simple helper function to delay for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------
// Deduplication Functions for Each Additional Course (No filtering by "L")
// ------------------------------------------------------------------

async function getDedupedPhySlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const phyCourse = await prisma.course.findUnique({
    where: { code: "PHY1007" },
    include: { slotCombos: true },
  });
  if (!phyCourse) throw new Error("PHY1007 course not found.");
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
  console.log(`Deduped PHY1007 slot combos count: ${deduped.length}`);
  return deduped;
}

async function getDedupedEngSlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const engCourse = await prisma.course.findUnique({
    where: { code: "ENG2001" },
    include: { slotCombos: true },
  });
  if (!engCourse) throw new Error("ENG2001 course not found.");
  const seen = new Set<string>();
  const deduped: Array<{ id: number; slotCode: string }> = [];
  engCourse.slotCombos.forEach((combo: any) => {
    const codes = combo.slotCode.split("+").map((s: string) => s.trim().toUpperCase());
    codes.sort();
    const signature = codes.join("+");
    if (!seen.has(signature)) {
      seen.add(signature);
      deduped.push({ id: combo.id, slotCode: combo.slotCode });
    }
  });
  console.log(`Deduped ENG2001 slot combos count: ${deduped.length}`);
  return deduped;
}

async function getDedupedStsSlotCombos(): Promise<Array<{ id: number; slotCode: string }>> {
  const stsCourse = await prisma.course.findUnique({
    where: { code: "STS1009" },
    include: { slotCombos: true },
  });
  if (!stsCourse) throw new Error("STS1009 course not found.");
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

// ------------------------------------------------------------------
// Main Combination Generation: All Courses in One Code
// ------------------------------------------------------------------

/**
 * doesComboFit():
 * Checks if the provided slot codes can be added to the grid without conflict (all designated cells must be empty).
 */
function doesComboFit(grid: Record<string, string[]>, slotCodes: string[]): boolean {
  const occupied = getOccupiedCells(slotCodes);
  for (const cellKey of occupied) {
    const [day, indexStr] = cellKey.split("-");
    const index = parseInt(indexStr, 10);
    if (grid[day][index] && grid[day][index].trim() !== "") {
      return false;
    }
  }
  return true;
}

/**
 * processRecordForAllAdditionalCourses():
 * For a given base TestTimetable record (from the restored 50K), attempts to overlay all three additional courses:
 * PHY1007, ENG2001, and STS1009. It uses three nested loops (one per course) to test every valid combination.
 * For each valid combination (where in each overlay the target grid cells are empty),
 * a new record is generated by cumulatively overlaying the course labels (in the order: PHY then ENG then STS)
 * and merging their slot codes with the original allSlots.
 * Inserts each valid combination as a new record into TestTimetables.
 *
 * Returns the total number of new records generated from this base record.
 */
async function processRecordForAllAdditionalCourses(record: { id: number; semester: number; degree: string; allSlots: string[]; grid: any }): Promise<number> {
  console.log(`Processing base record ID ${record.id} for combined addition...`);
  let baseGrid: Record<string, string[]>;
  try {
    baseGrid = typeof record.grid === "string" ? JSON.parse(record.grid) : record.grid;
  } catch (e) {
    console.error(`Record ID ${record.id}: Invalid grid data. Skipping.`);
    return 0;
  }

  let newInsertions = 0;
  const dedupedPHY = await getDedupedPhySlotCombos();
  const dedupedENG = await getDedupedEngSlotCombos();
  const dedupedSTS = await getDedupedStsSlotCombos();

  // Outer loop: for each PHY combo.
  for (const phyCombo of dedupedPHY) {
    const phyCodes = phyCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
    if (!doesComboFit(baseGrid, phyCodes)) {
      console.log(`Record ID ${record.id}: PHY combo "${phyCombo.slotCode}" conflicts at base level. Skipping.`);
      continue;
    }
    const gridAfterPhy = computeNewGridWithCourse(baseGrid, "PHY1007", phyCodes);
    const slotsAfterPhy = unionArrays(record.allSlots, phyCodes);

    // Middle loop: for each ENG combo.
    for (const engCombo of dedupedENG) {
      const engCodes = engCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
      if (!doesComboFit(gridAfterPhy, engCodes)) {
        console.log(`Record ID ${record.id}: ENG combo "${engCombo.slotCode}" conflicts after PHY. Skipping.`);
        continue;
      }
      const gridAfterEng = computeNewGridWithCourse(gridAfterPhy, "ENG2001", engCodes);
      const slotsAfterEng = unionArrays(slotsAfterPhy, engCodes);

      // Inner loop: for each STS combo.
      for (const stsCombo of dedupedSTS) {
        const stsCodes = stsCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
        if (!doesComboFit(gridAfterEng, stsCodes)) {
          console.log(`Record ID ${record.id}: STS combo "${stsCombo.slotCode}" conflicts after ENG. Skipping.`);
          continue;
        }
        const finalGrid = computeNewGridWithCourse(gridAfterEng, "STS1009", stsCodes);
        const finalSlots = unionArrays(slotsAfterEng, stsCodes);
        try {
          const newRec = await prisma.testTimetables.create({
            data: {
              semester: record.semester,
              degree: record.degree,
              allSlots: finalSlots,
              grid: finalGrid,
            },
          });
          console.log(`Record ID ${record.id}: Generated new record (PHY: "${phyCombo.slotCode}", ENG: "${engCombo.slotCode}", STS: "${stsCombo.slotCode}"). New ID: ${newRec.id}`);
          newInsertions++;
        } catch (err) {
          console.error(`Error inserting new record for base record ID ${record.id} with combo (PHY: "${phyCombo.slotCode}", ENG: "${engCombo.slotCode}", STS: "${stsCombo.slotCode}"):`, err);
        }
      }
    }
  }
  return newInsertions;
}

/**
 * Main function:
 * - Fetches the base 50K TestTimetables records (restored).
 * - Processes each record to generate all possible new records with PHY1007, ENG2001, and STS1009 added.
 * - After processing, deletes the original base records from TestTimetables.
 */
async function addAllCoursesToTestDatabase() {
  try {
    console.log("Starting combined addition of PHY1007, ENG2001, and STS1009 into TestTimetables...");

    // Fetch base records and store their IDs.
    const baseRecords = await prisma.testTimetables.findMany({
      select: { id: true, semester: true, degree: true, allSlots: true, grid: true },
    });
    console.log(`Fetched ${baseRecords.length} base records from TestTimetables.`);
    const baseRecordIds = baseRecords.map(r => r.id);

    let totalNew = 0;
    let processedCount = 0;
    for (const record of baseRecords) {
      const newCount = await processRecordForAllAdditionalCourses(record);
      totalNew += newCount;
      processedCount++;
      console.log(`Processed base record ID ${record.id}; New records generated: ${newCount}`);
    }
    console.log(`Finished processing ${processedCount} base records.`);
    console.log(`Total new records generated with additional courses: ${totalNew}`);

    // Delete the original base records from TestTimetables.
    console.log("Deleting original base records from TestTimetables...");
    const deleteResult = await prisma.testTimetables.deleteMany({
      where: { id: { in: baseRecordIds } },
    });
    console.log(`Deletion complete. Deleted ${deleteResult.count} original base records from TestTimetables.`);
    
  } catch (error) {
    console.error("Error during combined addition process:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected Prisma client.");
  }
}

addAllCoursesToTestDatabase()
  .then(() => console.log("Combined addition process finished successfully."))
  .catch(error => console.error(error));
