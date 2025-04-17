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
 * Build a global mapping from each slot code (in lowercase) to all its positions (day and index)
 * in the base timetable.
 */
function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      const codes = cell.split("/").map(c => c.trim().toLowerCase());
      codes.forEach(code => {
        if (code !== "lunch") {
          if (!mapping[code]) mapping[code] = [];
          mapping[code].push({ day, index });
        }
      });
    });
  }
  return mapping;
}
const globalSlotMapping = buildGlobalSlotMapping();

/**
 * Returns a set of occupied cell keys (e.g., "Monday-3") for an array of slot codes.
 */
function getOccupiedCells(slotCodes: string[]): Set<string> {
  const cells = new Set<string>();
  slotCodes.forEach(code => {
    const lowerCode = code.trim().toLowerCase();
    const mappings = globalSlotMapping[lowerCode];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        cells.add(`${day}-${index}`);
      });
    }
  });
  return cells;
}

/**
 * Computes a combined grid by overlaying slot codes onto an existing grid.
 * This version takes a label parameter and overlays that label only into cells that are empty.
 */
function computeCombinedGridWithLabel(
  baseGrid: Record<string, string[]>,
  slotCodes: string[],
  label: string
): Record<string, string[]> {
  const grid: Record<string, string[]> = {};
  for (const day of days) {
    grid[day] = [...baseGrid[day]]; // deep copy per day
  }
  slotCodes.forEach(code => {
    const lowerCode = code.trim().toLowerCase();
    const mappings = globalSlotMapping[lowerCode];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        if (grid[day][index] === "") {
          grid[day][index] = label;
        }
      });
    }
  });
  return grid;
}

// ---------------------
// Types for Courses & SlotCombos
// ---------------------
type SlotCombo = {
  id: number;
  slotCode: string;
  venue: string;
  faculty: string;
  courseCode: string;
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
 * Generator for ECE possibilities from the ECE1003 course.
 */
function* generateEcePossibilities(eceCourse: Course): Generator<SlotCombo> {
  for (const slotCombo of eceCourse.slotCombos) {
    yield slotCombo;
  }
}

/**
 * Helper function to chunk an array into batches.
 */
function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * POST handler to combine existing Lab+MAT timetables with ECE possibilities.
 * Process:
 *  - Fetch current Lab+MAT timetables (which already have lab and MAT filled) from the database.
 *  - Fetch the ECE1003 course.
 *  - Deduplicate ECE possibilities.
 *  - For each Lab+MAT timetable and each ECE possibility:
 *      - Check for conflict: if any cell that ECE would occupy is already filled, skip it.
 *      - If no conflict, compute a new combined grid by overlaying ECE slots (as "ECE1003")
 *        only into cells that are empty in the Lab+MAT grid.
 *  - Clear the timetable table and insert only the new combined (Lab+MAT+ECE) timetables.
 */
export async function POST(req: Request) {
  try {
    // 1. Fetch Lab+MAT timetables from the database.
    const labMatTimetables = await prisma.timetable.findMany();
    if (labMatTimetables.length === 0) {
      return NextResponse.json({ message: "No Lab+MAT timetables found" }, { status: 400 });
    }

    // 2. Fetch the ECE1003 course.
    const eceCourseData = await prisma.course.findUnique({
      where: { code: "ECE1003" },
      include: { slotCombos: true },
    });
    if (!eceCourseData) {
      return NextResponse.json({ message: "ECE1003 course not found" }, { status: 400 });
    }
    const eceCourse: Course = {
      id: eceCourseData.id,
      code: eceCourseData.code,
      name: eceCourseData.name,
      semester: eceCourseData.semester,
      degree: eceCourseData.degree,
      slotCombos: eceCourseData.slotCombos.map((combo: any) => ({
        id: combo.id,
        slotCode: combo.slotCode,
        venue: combo.venue,
        faculty: combo.faculty,
        courseCode: eceCourseData.code,
      })),
    };

    // 3. Deduplicate ECE possibilities.
    const ecePossibilitiesMap = new Map<string, SlotCombo>();
    for (const slotCombo of generateEcePossibilities(eceCourse)) {
      const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
      codes.sort();
      const signature = codes.join("+");
      if (!ecePossibilitiesMap.has(signature)) {
        ecePossibilitiesMap.set(signature, slotCombo);
      }
    }
    const ecePossibilities = Array.from(ecePossibilitiesMap.values());
    console.log("Unique ECE possibilities:", ecePossibilities.length);

    // 4. For each Lab+MAT timetable and each ECE possibility, combine them if there's no conflict.
    const combinedRecords: Array<{ allSlots: string[]; grid: Record<string, string[]>; semester: number; degree: string }> = [];
    for (const labMat of labMatTimetables) {
      // Use the stored lab+mat grid to preserve lab and mat data.
      const labMatGrid = labMat.grid as Record<string, string[]>;
      const labMatOccupied = getOccupiedCells(labMat.allSlots);
      for (const ece of ecePossibilities) {
        const eceCodes = ece.slotCode.split("+").map(code => code.trim());
        const eceOccupied = getOccupiedCells(eceCodes);
        let conflict = false;
        for (const cell of eceOccupied) {
          if (labMatOccupied.has(cell)) {
            conflict = true;
            break;
          }
        }
        if (conflict) continue;
        // If no conflict, combine: union of labMat.allSlots and eceCodes.
        const combinedSlotCodes = Array.from(new Set([...labMat.allSlots, ...eceCodes]));
        // Compute a new grid by overlaying ECE slots (as "ECE1003") only into cells that are empty in labMatGrid.
        const combinedGrid = computeCombinedGridWithLabel(labMatGrid, eceCodes, "ECE1003");
        combinedRecords.push({
          semester: eceCourse.semester,
          degree: eceCourse.degree,
          allSlots: combinedSlotCodes,
          grid: combinedGrid,
        });
      }
    }
    console.log("Total combined valid Lab+MAT+ECE possibilities:", combinedRecords.length);

    // 5. Clear the timetable table.
    await prisma.timetable.deleteMany({});

    // 6. Insert combined records in batches.
    const batches = chunkArray(combinedRecords, 5000);
    let processedCount = 0;
    for (const batch of batches) {
      await prisma.timetable.createMany({ data: batch });
      processedCount += batch.length;
      console.log(`Inserted batch of ${batch.length}. Total processed: ${processedCount}`);
    }

    return NextResponse.json({
      message: "Lab+MAT+ECE timetable combinations generated successfully",
      count: combinedRecords.length,
    });
  } catch (error) {
    console.error("Error generating Lab+MAT+ECE timetables:", error);
    return NextResponse.json({ message: "Error generating Lab+MAT+ECE timetables" }, { status: 500 });
  }
}
