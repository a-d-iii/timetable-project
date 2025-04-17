import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Fixed base timetable layout (our canvas): 13 cells per day.
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
 * Build a global mapping from each slot code (lowercased) to all its positions (day and index)
 * based on the base timetable.
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
 * Compute a grid from a combination of slotCombos.
 * For each slotCombo, split its slotCode (by "+") and map each code via globalSlotMapping.
 * Fill the corresponding cell with the course code.
 */
function computeGridFromCombination(combination: { slotCode: string; courseCode: string }[]): Record<string, string[]> {
  const grid: Record<string, string[]> = {};
  for (const day of days) {
    grid[day] = Array(baseTimetable[day].length).fill("");
  }
  combination.forEach((slotCombo) => {
    const courseCode = slotCombo.courseCode;
    const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
    codes.forEach(code => {
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
 * Check if a given math slotCombo can be placed in the given grid.
 * All cells mapped by its slot codes must be empty.
 */
function canPlaceMath(grid: Record<string, string[]>, mathSlotCombo: { slotCode: string }): boolean {
  const codes = mathSlotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
  for (const code of codes) {
    const mappings = globalSlotMapping[code];
    if (!mappings) return false;
    for (const { day, index } of mappings) {
      if (grid[day][index] !== "") return false;
    }
  }
  return true;
}

/**
 * Place a math slotCombo into a copy of the grid.
 * Returns a new grid with the math course code placed in its mapped cells.
 */
function placeMathInGrid(grid: Record<string, string[]>, mathSlotCombo: { slotCode: string; courseCode: string }): Record<string, string[]> {
  const newGrid: Record<string, string[]> = {};
  for (const day of days) {
    newGrid[day] = [...grid[day]];
  }
  const codes = mathSlotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
  codes.forEach(code => {
    const mappings = globalSlotMapping[code];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        newGrid[day][index] = mathSlotCombo.courseCode;
      });
    }
  });
  return newGrid;
}

// Types from your Prisma models.
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
 * Augment lab timetables with the math course (MAT1002) by processing in batches of 100.
 * For each lab timetable, try each MAT1002 slotCombo.
 * If the mapped positions for the math slotCombo are empty in the lab timetable's grid,
 * fill them with the math course code (i.e. add math only in the empty spots).
 * Progress is streamed out as plain text (one line per batch processed).
 */
export async function POST(req: Request) {
  try {
    const batchSize = 100;
    let skip = 0;
    let totalAugmented = 0;
    const encoder = new TextEncoder();

    // Create a ReadableStream to send progress updates as they occur.
    const stream = new ReadableStream({
      async start(controller) {
        // Fetch the math course (MAT1002) and its slotCombos.
        const mathCourses = await prisma.course.findMany({
          where: { code: "MAT1002" },
          include: { slotCombos: true },
        });
        if (!mathCourses || mathCourses.length === 0) {
          controller.enqueue(encoder.encode("MAT1002 course not found\n"));
          controller.close();
          return;
        }
        const mathCourse = mathCourses[0];
        const mathSlotCombos = mathCourse.slotCombos.map((combo: any) => ({
          slotCode: combo.slotCode,
          courseCode: mathCourse.code,
        }));
        
        while (true) {
          const labTimetables = await prisma.timetable.findMany({
            // Process all lab timetables (no filter here)
            skip,
            take: batchSize,
          });
          if (labTimetables.length === 0) break;
          
          for (const labTT of labTimetables) {
            // Use labTT.grid if available; otherwise, compute it from labTT.allSlots.
            const labGrid = labTT.grid || computeGridFromCombination(
              [{ slotCode: (labTT.allSlots || []).join("+"), courseCode: "LAB" }]
            );
            for (const mathCombo of mathSlotCombos) {
              if (!canPlaceMath(labGrid, mathCombo)) continue;
              const newGrid = placeMathInGrid(labGrid, mathCombo);
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
              totalAugmented++;
            }
          }
          skip += labTimetables.length;
          controller.enqueue(encoder.encode(`Processed batch of ${labTimetables.length} lab timetables; total augmented so far: ${totalAugmented}\n`));
        }
        controller.enqueue(encoder.encode(`Augmentation complete. Total augmented timetables: ${totalAugmented}\n`));
        controller.close();
      }
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain" } });
  } catch (error) {
    console.error("Error augmenting timetables:", error);
    return NextResponse.json({ message: "Error augmenting timetables" }, { status: 500 });
  }
}
