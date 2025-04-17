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
 * Computes a combined grid by overlaying MAT slots onto a lab grid.
 * The labGrid is assumed to be taken directly from the lab timetable record (preserving lab slot info).
 * MAT slots (displayed as "MAT1002") are filled only in cells that are empty.
 */
function computeCombinedGrid(labGrid: Record<string, string[]>, matSlotCodes: string[]): Record<string, string[]> {
  // Deep clone the lab grid.
  const grid: Record<string, string[]> = {};
  for (const day of days) {
    grid[day] = [...labGrid[day]];
  }
  // Overlay MAT slots only on cells that are exactly empty.
  matSlotCodes.forEach(code => {
    const lowerCode = code.trim().toLowerCase();
    const mappings = globalSlotMapping[lowerCode];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        if (grid[day][index] === "") {
          grid[day][index] = "MAT1002";
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
 * Generator for MAT possibilities from the MAT1002 course.
 */
function* generateMatPossibilities(matCourse: Course): Generator<SlotCombo> {
  for (const slotCombo of matCourse.slotCombos) {
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
 * POST handler to combine lab timetables with MAT possibilities.
 * Process:
 *  - Fetch lab timetables from the database.
 *  - Fetch the MAT1002 course.
 *  - Deduplicate MAT possibilities.
 *  - For each lab timetable and each MAT possibility:
 *      - Check for conflict using occupied cells.
 *      - If no conflict, compute a combined grid by overlaying MAT slots onto the lab timetable’s grid.
 *  - Clear the timetable table and insert only the combined (lab+MAT) timetables.
 */
export async function POST(req: Request) {
  try {
    // 1. Fetch lab timetables from the database.
    const labTimetables = await prisma.timetable.findMany();
    if (labTimetables.length === 0) {
      return NextResponse.json({ message: "No lab timetables found" }, { status: 400 });
    }

    // 2. Fetch the MAT1002 course.
    const matCourseData = await prisma.course.findUnique({
      where: { code: "MAT1002" },
      include: { slotCombos: true },
    });
    if (!matCourseData) {
      return NextResponse.json({ message: "MAT1002 course not found" }, { status: 400 });
    }
    const matCourse: Course = {
      id: matCourseData.id,
      code: matCourseData.code,
      name: matCourseData.name,
      semester: matCourseData.semester,
      degree: matCourseData.degree,
      slotCombos: matCourseData.slotCombos.map((combo: any) => ({
        id: combo.id,
        slotCode: combo.slotCode,
        venue: combo.venue,
        faculty: combo.faculty,
        courseCode: matCourseData.code,
      })),
    };

    // 3. Deduplicate MAT possibilities.
    const matPossibilitiesMap = new Map<string, SlotCombo>();
    for (const slotCombo of generateMatPossibilities(matCourse)) {
      const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
      codes.sort();
      const signature = codes.join("+");
      if (!matPossibilitiesMap.has(signature)) {
        matPossibilitiesMap.set(signature, slotCombo);
      }
    }
    const matPossibilities = Array.from(matPossibilitiesMap.values());
    console.log("Unique MAT possibilities:", matPossibilities.length);

    // 4. For each lab timetable and each MAT possibility, combine them if there's no conflict.
    //    IMPORTANT: Use the lab timetable's stored grid to preserve lab slot data.
    const combinedRecords: Array<{ allSlots: string[]; grid: Record<string, string[]>; semester: number; degree: string }> = [];
    for (const lab of labTimetables) {
      // Use the lab's stored grid (do not recompute) to preserve lab slot details.
      const labGrid = lab.grid as Record<string, string[]>;
      const labOccupied = getOccupiedCells(lab.allSlots);

      for (const mat of matPossibilities) {
        const matCodes = mat.slotCode.split("+").map(code => code.trim());
        const matOccupied = getOccupiedCells(matCodes);

        let conflict = false;
        for (const cell of matOccupied) {
          if (labOccupied.has(cell)) {
            conflict = true;
            break;
          }
        }
        if (conflict) continue;

        // Combine lab and MAT: union of lab.allSlots and mat slot codes.
        const combinedSlotCodes = Array.from(new Set([...lab.allSlots, ...matCodes]));
        // Compute the combined grid by overlaying MAT slots onto the lab grid.
        const combinedGrid = computeCombinedGrid(labGrid, matCodes);
        combinedRecords.push({
          semester: matCourse.semester,
          degree: matCourse.degree,
          allSlots: combinedSlotCodes,
          grid: combinedGrid,
        });
      }
    }
    console.log("Total combined valid possibilities:", combinedRecords.length);

    // 5. Clear the timetable table.
    await prisma.timetable.deleteMany({});

    // 6. Insert combined records in batches.
    const batches = chunkArray(combinedRecords, 500);
    let processedCount = 0;
    for (const batch of batches) {
      await prisma.timetable.createMany({ data: batch });
      processedCount += batch.length;
      console.log(`Inserted batch of ${batch.length}. Total processed: ${processedCount}`);
    }

    return NextResponse.json({
      message: "Lab+MAT timetable combinations generated successfully",
      count: combinedRecords.length,
    });
  } catch (error) {
    console.error("Error generating lab+MAT timetables:", error);
    return NextResponse.json({ message: "Error generating lab+MAT timetables" }, { status: 500 });
  }
}
