// addAllCoursesToTimetable.ts

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
 * Builds a mapping from each slot code (uppercase) to an array of positions { day, index } in the base timetable.
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
 * Returns a Set of grid cell keys (e.g. "Monday-3") that the given slot codes would occupy.
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
 * Overlays a course label (e.g., "PHY1007", "ENG2001", "STS1009") onto a base grid at the cells
 * corresponding to the provided slot codes. Only fills cells that are empty.
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
 * Helper function to delay execution.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------
// Deduplication Functions for Additional Courses (No Filtering by "L" at Dedup Time)
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
// Main Combination Generation Function for Timetable (9M+ records)
// ------------------------------------------------------------------

/**
 * doesComboFit():
 * Checks if the provided slot codes can be overlaid on the grid without conflict.
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
 * For a given base record from Timetable, applies every valid combination of PHY, ENG, and STS additional courses.
 * The overlays occur in three nested loops:
 *   1. PHY1007: Check each deduped PHY slot combo; if it fits the base grid, create gridAfterPhy.
 *   2. ENG2001: For each deduped ENG slot combo, if it fits gridAfterPhy, create gridAfterEng.
 *   3. STS1009: For each deduped STS slot combo, if it fits gridAfterEng, create finalGrid.
 *
 * For every valid combination, a new Timetable record is inserted.
 * Returns the count of new records generated for that base record.
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

  // Loop through PHY combos.
  for (const phyCombo of dedupedPHY) {
    const phyCodes = phyCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
    if (!doesComboFit(baseGrid, phyCodes)) {
      console.log(`Record ID ${record.id}: PHY combo "${phyCombo.slotCode}" conflicts at base level. Skipping.`);
      continue;
    }
    const gridAfterPhy = computeNewGridWithCourse(baseGrid, "PHY1007", phyCodes);
    const slotsAfterPhy = unionArrays(record.allSlots, phyCodes);

    // Loop through ENG combos.
    for (const engCombo of dedupedENG) {
      const engCodes = engCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
      if (!doesComboFit(gridAfterPhy, engCodes)) {
        console.log(`Record ID ${record.id}: ENG combo "${engCombo.slotCode}" conflicts after PHY. Skipping.`);
        continue;
      }
      const gridAfterEng = computeNewGridWithCourse(gridAfterPhy, "ENG2001", engCodes);
      const slotsAfterEng = unionArrays(slotsAfterPhy, engCodes);

      // Loop through STS combos.
      for (const stsCombo of dedupedSTS) {
        const stsCodes = stsCombo.slotCode.split("+").map(s => s.trim().toUpperCase());
        if (!doesComboFit(gridAfterEng, stsCodes)) {
          console.log(`Record ID ${record.id}: STS combo "${stsCombo.slotCode}" conflicts after ENG. Skipping.`);
          continue;
        }
        const finalGrid = computeNewGridWithCourse(gridAfterEng, "STS1009", stsCodes);
        const finalSlots = unionArrays(slotsAfterEng, stsCodes);
        try {
          const newRec = await prisma.timetable.create({
            data: {
              semester: record.semester,
              degree: record.degree,
              allSlots: finalSlots,
              grid: finalGrid,
            },
          });
          console.log(`Record ID ${record.id}: Generated new record with combination (PHY: "${phyCombo.slotCode}", ENG: "${engCombo.slotCode}", STS: "${stsCombo.slotCode}"). New ID: ${newRec.id}`);
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
 * Main processing function for the Timetable model.
 * Processes the 9+ million records in batches of 250,000 using a cursor-based approach.
 * For each batch, it processes each record to generate new records with all three additional courses overlaid.
 * After processing all batches, it performs a final deletion, removing any records that do not
 * contain valid theory entries for all three courses.
 */
async function addAllCoursesToTimetable() {
  const batchSize = 250000;
  let processedCount = 0;
  let totalNew = 0;
  let lastId = 0;
  console.log("Starting combined addition process on Timetable (9M+ records) in batches of 250K...");
  while (true) {
    console.log(`Fetching batch: records with id > ${lastId}, batch size: ${batchSize}`);
    const records = await prisma.timetable.findMany({
      where: { id: { gt: lastId } },
      orderBy: { id: "asc" },
      take: batchSize,
      select: { id: true, semester: true, degree: true, allSlots: true, grid: true },
    });
    if (records.length === 0) break;
    
    for (const record of records) {
      const newCount = await processRecordForAllAdditionalCourses(record);
      totalNew += newCount;
      processedCount++;
    }
    lastId = records[records.length - 1].id;
    console.log(`Processed batch: Total base records processed so far: ${processedCount}, Total new records generated: ${totalNew}`);
    // Minimal delay since this is running on a high-end instance.
    await delay(50);
  }
  console.log(`All batches processed. Total base records processed: ${processedCount}, total new records generated: ${totalNew}`);

  // Final deletion: Delete records that do not have valid theory entries for all three courses.
  // A valid theory entry is defined by a cell containing the course label without an immediate "L".
  // For this, we run a raw SQL query using regex.
  console.log("Running final deletion of records that do not have all three courses in their grid...");
  const finalDeleteQuery = `
    DELETE FROM "Timetable"
    WHERE NOT (
      CAST("grid" AS text) ~* 'PHY1007([^L]|$)' AND
      CAST("grid" AS text) ~* 'ENG2001([^L]|$)' AND
      CAST("grid" AS text) ~* 'STS1009([^L]|$)'
    )
  `;
  const deleteResult: any = await prisma.$executeRawUnsafe(finalDeleteQuery);
  console.log(`Final deletion complete. Deleted ${deleteResult.count || "an unknown number of"} records that do not have all three courses.`);
}

addAllCoursesToTimetable()
  .then(() => console.log("Combined addition process to Timetable finished successfully."))
  .catch(error => console.error("Error during combined addition process:", error))
  .finally(() => prisma.$disconnect());
