import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Fixed base timetable layout (our canvas) with 13 cells per day.
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
 * Build a global mapping from each slot code (lowercase) to all its positions (day and index)
 * in the base timetable.
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
  return mapping;
}
const globalSlotMapping = buildGlobalSlotMapping();

/**
 * Compute a grid from a combination of slotCombos.
 * Every slot code (split by "+") is looked up in globalSlotMapping.
 * The corresponding cell is filled with the course code.
 */
function computeGridFromCombination(combination: { slotCode: string; courseCode: string }[]): Record<string, string[]> {
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

/**
 * Check if a given math slotCombo (its codes) can be inserted into a lab timetable's grid.
 * For each code in math slotCombo, its mapped positions must be empty.
 */
function canPlaceMath(grid: Record<string, string[]>, mathSlotCombo: { slotCode: string }): boolean {
  const codes = mathSlotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
  for (const code of codes) {
    const mappings = globalSlotMapping[code];
    if (!mappings) return false; // if mapping not found, cannot place.
    for (const { day, index } of mappings) {
      if (grid[day][index] !== "") {
        return false; // conflict found.
      }
    }
  }
  return true;
}

/**
 * Place math slotCombo into a copy of a lab timetable grid.
 * This function returns a new grid with the math slotCombo placed in the mapped cells.
 */
function placeMathInGrid(grid: Record<string, string[]>, mathSlotCombo: { slotCode: string; courseCode: string }): Record<string, string[]> {
  // Deep-clone the grid.
  const newGrid: Record<string, string[]> = {};
  for (const day of days) {
    newGrid[day] = [...grid[day]];
  }
  const codes = mathSlotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
  codes.forEach((code) => {
    const mappings = globalSlotMapping[code];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        newGrid[day][index] = mathSlotCombo.courseCode;
      });
    }
  });
  return newGrid;
}

/**
 * POST handler to augment lab timetables with MAT1002.
 * For each lab timetable, check each MAT1002 slotCombo.
 * If the math slotCombo can be placed into the lab timetable's grid (i.e. in empty cells),
 * then create an augmented timetable by filling those cells.
 * The math course is only added to cells that are empty.
 */
export async function POST(req: Request) {
  try {
    // Fetch a subset of lab timetables.
    const labTimetables = await prisma.timetable.findMany({
      // Here you need to filter lab timetables appropriately.
      // For testing, we take a limited number.
      take: 100,
    });
    if (!labTimetables || labTimetables.length === 0) {
      return NextResponse.json({ message: "No lab timetables found" }, { status: 400 });
    }
    
    // Fetch MAT1002 course (math course) and its slotCombos.
    const mathCourses = await prisma.course.findMany({
      where: { code: "MAT1002" },
      include: { slotCombos: true },
    });
    if (!mathCourses || mathCourses.length === 0) {
      return NextResponse.json({ message: "MAT1002 course not found" }, { status: 400 });
    }
    const mathCourse = mathCourses[0];
    const mathSlotCombos = mathCourse.slotCombos.map((combo: any) => ({
      slotCode: combo.slotCode,
      courseCode: mathCourse.code,
    }));
    
    let augmentedCount = 0;
    
    // For each lab timetable, try to augment it by placing one math slotCombo into empty cells.
    for (const labTT of labTimetables) {
      // Use the lab timetable's grid as our base.
      // We assume labTT.grid is already computed (if not, compute it from labTT.allSlots).
      const baseGrid = labTT.grid || computeGridFromCombination(
        // For a fallback, we assume we can reconstruct a combination from allSlots.
        // Here we create a dummy combination: this is not perfect.
        [{ slotCode: (labTT.allSlots || []).join("+"), courseCode: "LAB" }]
      );
      
      // Try each math slotCombo.
      for (const mathCombo of mathSlotCombos) {
        if (!canPlaceMath(baseGrid, mathCombo)) continue;
        // Place the math course into a copy of the lab grid.
        const newGrid = placeMathInGrid(baseGrid, mathCombo);
        // Merge the lab timetable's allSlots with mathCombo's slot codes.
        const mathCodes = mathCombo.slotCode.split("+").map(code => code.trim());
        const newAllSlots = [...(labTT.allSlots || []), ...mathCodes];
        await prisma.timetable.create({
          data: {
            semester: labTT.semester,
            degree: labTT.degree,
            allSlots: newAllSlots,
            grid: newGrid,
          },
        });
        augmentedCount++;
      }
    }
    
    return NextResponse.json({
      message: "Augmented timetables generated successfully",
      augmentedCount,
    });
  } catch (error) {
    console.error("Error augmenting timetables:", error);
    return NextResponse.json({ message: "Error augmenting timetables" }, { status: 500 });
  }
}
