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
 * Compute a grid from a given timetable combination.
 * Every slot code in the combination is mapped using the global mapping,
 * and the corresponding cell is filled with the course code.
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
  courseCode: string; // Parent course code.
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
 * Generator function that recursively yields valid timetable combinations,
 * where each combination includes one slotCombo per course.
 */
function* generateTimetablesGenerator(
  courses: Course[],
  index: number = 0,
  current: SlotCombo[] = [],
  usedCodes: Set<string> = new Set()
): Generator<SlotCombo[]> {
  if (index === courses.length) {
    yield current;
    return;
  }
  const course = courses[index];
  for (const slotCombo of course.slotCombos) {
    const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
    if (codes.some(code => usedCodes.has(code))) continue;
    const newUsed = new Set(usedCodes);
    codes.forEach(code => newUsed.add(code));
    yield* generateTimetablesGenerator(courses, index + 1, [...current, slotCombo], newUsed);
  }
}

/**
 * Helper function to chunk an array into batches of a given size.
 */
function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * POST handler to generate lab timetable combinations in batches.
 * - Clears existing timetable records.
 * - Fetches all courses and filters to lab courses (course code ending with "l").
 * - Generates all valid combinations using the generator.
 * - Deduplicates combinations by a canonical signature.
 * - Processes the unique combinations in batches of 500.
 * - After processing each batch, logs progress to the console.
 */
export async function POST(req: Request) {
  try {
    // Clear existing timetable records.
    await prisma.timetable.deleteMany({});

    // Fetch courses with their slotCombos.
    const coursesData = await prisma.course.findMany({ include: { slotCombos: true } });
    let courses: Course[] = coursesData.map(course => ({
      id: course.id,
      code: course.code,
      name: course.name,
      semester: course.semester,
      degree: course.degree,
      slotCombos: course.slotCombos.map((combo: any) => ({
        id: combo.id,
        slotCode: combo.slotCode,
        venue: combo.venue,
        faculty: combo.faculty,
        courseCode: course.code,
      }))
    }));

    // Filter to only lab courses (course code ending with "l", case-insensitive)
    courses = courses.filter(course => course.code.toLowerCase().endsWith("l"));
    if (courses.length === 0) {
      return NextResponse.json({ message: "No lab courses found" }, { status: 400 });
    }

    // Generate all valid combinations using the generator.
    const combinations: SlotCombo[][] = [];
    for (const combo of generateTimetablesGenerator(courses)) {
      combinations.push(combo);
    }

    // Deduplicate combinations: produce a canonical signature for each combination.
    const dedupMap = new Map<string, SlotCombo[]>();
    for (const combo of combinations) {
      const canonicalList = combo.map(slotCombo => {
        const codes = slotCombo.slotCode.split("+").map(code => code.trim().toLowerCase());
        codes.sort();
        return `${slotCombo.courseCode}:${codes.join("+")}`;
      });
      canonicalList.sort();
      const signature = canonicalList.join("|");
      if (!dedupMap.has(signature)) {
        dedupMap.set(signature, combo);
      }
    }
    const uniqueCombinations = Array.from(dedupMap.values());
    console.log("Total unique combinations:", uniqueCombinations.length);

    // Process unique combinations in batches of 500.
    const batches = chunkArray(uniqueCombinations, 500);
    let processedCount = 0;
    for (const batch of batches) {
      // Prepare records for batch insertion.
      const records = batch.map(timetableComb => {
        const allSlots: string[] = [];
        timetableComb.forEach(slotCombo => {
          slotCombo.slotCode.split("+").forEach(code => allSlots.push(code.trim()));
        });
        const grid = computeGridFromCombination(timetableComb);
        return {
          semester: courses[0].semester,
          degree: courses[0].degree,
          allSlots,
          grid,
        };
      });
      // Insert batch using createMany.
      await prisma.timetable.createMany({ data: records });
      processedCount += records.length;
      console.log(`Processed batch of ${records.length}. Total processed: ${processedCount}`);
    }

    return NextResponse.json({
      message: "Lab timetable combinations generated successfully",
      count: uniqueCombinations.length,
    });
  } catch (error) {
    console.error("Error generating lab timetables:", error);
    return NextResponse.json({ message: "Error generating lab timetables" }, { status: 500 });
  }
}
