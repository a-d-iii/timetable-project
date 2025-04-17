import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Fixed base timetable layout: 13 cells per day.
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
 * Build a global mapping from each slot code (in lowercase) to its positions (day and index)
 * based on the base timetable.
 */
function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      const codes = cell.split("/").map(c => c.trim().toLowerCase());
      codes.forEach((code) => {
        if (code !== "lunch") {
          if (!mapping[code]) mapping[code] = [];
          mapping[code].push({ day, index });
        }
      });
    });
  }
  console.log("Global slot mapping built:", mapping);
  return mapping;
}
const globalSlotMapping = buildGlobalSlotMapping();

/**
 * Compute a grid from a given timetable combination.
 * For every slotCombo in the combination, split its slotCode (by "+")
 * and fill the corresponding cells (using the global mapping) with the course code.
 */
function computeGridFromCombination(combination: SlotCombo[]): Record<string, string[]> {
  const grid: Record<string, string[]> = {};
  for (const day of days) {
    grid[day] = Array(baseTimetable[day].length).fill("");
  }
  combination.forEach((slotCombo) => {
    const courseCode = slotCombo.courseCode;
    const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
    codes.forEach((code) => {
      const mappings = globalSlotMapping[code];
      if (mappings) {
        mappings.forEach(({ day, index }) => {
          grid[day][index] = courseCode;
        });
      }
    });
  });
  return grid;
}

// Types based on your Prisma models.
type SlotCombo = {
  id: number;
  slotCode: string;
  venue: string;
  faculty: string;
  courseCode: string; // The parent course code.
};

type Course = {
  id: number;
  code: string;
  name: string;
  semester: number;
  degree: string;
  slotCombos: SlotCombo[];
};

/**
 * Deduplicate slotCombos for a course.
 * For courses like MAT1002, ECE1003, or CSE2005, if multiple slotCombos have the same canonical representation
 * (ignoring faculty differences), keep only one.
 */
function deduplicateSlotCombos(slotCombos: { slotCode: string; venue: string; faculty: string; courseCode: string }[]): { slotCode: string; venue: string; faculty: string; courseCode: string }[] {
  const map = new Map<string, { slotCode: string; venue: string; faculty: string; courseCode: string }>();
  for (const combo of slotCombos) {
    const canonical = combo.slotCode.split("+").map(c => c.trim().toLowerCase()).sort().join("+");
    if (!map.has(canonical)) {
      map.set(canonical, combo);
    }
  }
  const deduped = Array.from(map.values());
  console.log(`Deduplicated slotCombos from ${slotCombos.length} to ${deduped.length}`);
  return deduped;
}

/**
 * Attempt to merge a CSE2005 slotCombo into an existing timetable grid.
 * - Clone the existing grid.
 * - For each slot code in the CSE2005 slotCombo, check if any corresponding cell is already occupied.
 * - If any cell is occupied, log a message and return null.
 * - Otherwise, fill those cells with "CSE2005" and return the new grid.
 */
function mergeWithCse(existingGrid: Record<string, string[]>, cseSlotCombo: { slotCode: string; courseCode: string }): Record<string, string[]> | null {
  const newGrid: Record<string, string[]> = {};
  for (const day of days) {
    newGrid[day] = [...existingGrid[day]];
  }
  const cseCodes = cseSlotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
  for (const code of cseCodes) {
    const mappings = globalSlotMapping[code];
    if (!mappings) {
      console.log(`CSE code "${code}" has no mapping. Skipping merge for this combo.`);
      return null;
    }
    for (const { day, index } of mappings) {
      if (newGrid[day][index] !== "") {
        console.log(`Conflict for CSE code "${code}" at ${day} index ${index}.`);
        return null;
      }
    }
  }
  // No conflict: fill in the cells with "CSE2005".
  for (const code of cseCodes) {
    const mappings = globalSlotMapping[code];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        newGrid[day][index] = cseSlotCombo.courseCode;
      });
    }
  }
  return newGrid;
}

/**
 * Helper function to chunk an array into batches of a given size.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retrieve a test batch of 100 timetable records from the middle of the dataset.
 */
async function getTestTimetables(): Promise<any[]> {
  const totalCount = await prisma.timetable.count();
  const skip = Math.max(0, Math.floor(totalCount / 2) - 50);
  console.log(`Total timetable count: ${totalCount}. Fetching 100 records from skip=${skip}`);
  const testTimetables = await prisma.timetable.findMany({ skip, take: 100 });
  console.log(`Fetched ${testTimetables.length} timetables for testing from the middle.`);
  return testTimetables;
}

/**
 * POST handler to merge CSE2005 into every timetable in a test batch.
 * Process:
 * 1. Retrieve 100 timetable records from the middle of the dataset.
 * 2. For each timetable, attempt to merge each deduplicated CSE2005 slotCombo.
 *    - If a merge is successful (i.e. no conflict), update that timetable with the new grid and merged allSlots.
 * 3. Log progress for every update.
 */
export async function POST(req: Request) {
  try {
    console.log("Starting test merge of CSE2005 into timetables...");
    const testTimetables = await getTestTimetables();
    console.log("Fetching CSE2005 course data...");
    const cseCourses = await prisma.course.findMany({
      where: { code: "CSE2005" },
      include: { slotCombos: true }
    });
    if (cseCourses.length === 0) {
      return NextResponse.json({ message: "CSE2005 course not found" }, { status: 400 });
    }
    const cseCourse = cseCourses[0];
    let cseSlotCombos = cseCourse.slotCombos.map((combo: any) => ({
      slotCode: combo.slotCode,
      venue: combo.venue,
      faculty: combo.faculty,
      courseCode: cseCourse.code,
    }));
    cseSlotCombos = deduplicateSlotCombos(cseSlotCombos);
    console.log(`Deduplicated CSE2005 slotCombos count: ${cseSlotCombos.length}`);
    
    let updatedCount = 0;
    let mergeAttempts = 0;
    console.log("Attempting to merge CSE2005 into each timetable...");
    for (const tt of testTimetables) {
      let merged = false;
      for (const cseCombo of cseSlotCombos) {
        mergeAttempts++;
        const mergedGrid = mergeWithCse(tt.grid, cseCombo);
        if (mergedGrid) {
          const cseCodes = cseCombo.slotCode.split("+").map(code => code.trim());
          const newAllSlots = [...tt.allSlots, ...cseCodes];
          // Update the timetable record in the database.
          await prisma.timetable.update({
            where: { id: tt.id },
            data: { grid: mergedGrid, allSlots: newAllSlots },
          });
          console.log(`Timetable ID ${tt.id} updated with CSE2005 combo ${cseCombo.slotCode}`);
          merged = true;
          updatedCount++;
          break; // Only merge one combo per timetable.
        }
      }
      if (!merged) {
        console.log(`No CSE2005 merge possible for timetable ID ${tt.id}`);
      }
    }
    console.log(`Total merge attempts: ${mergeAttempts}`);
    console.log(`Total timetables updated with CSE2005: ${updatedCount}`);
    
    return NextResponse.json({
      message: "Test merge of CSE2005 completed",
      updatedCount,
    });
  } catch (error) {
    console.error("Error during test merge of CSE2005:", error);
    return NextResponse.json({ message: "Error during test merge of CSE2005" }, { status: 500 });
  }
}
