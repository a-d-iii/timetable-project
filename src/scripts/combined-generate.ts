import "dotenv/config";
import { prisma } from "../lib/prisma";

const baseTimetable: Record<string, string[]> = {
  Monday: ["L1", "TA1/L2", "TB1/L3", "E1/L4", "E1/L5", "L6", "Lunch", "TA2/L37", "TB2/L38", "E2/L39", "E2/L40", "L41", "L42"],
  Tuesday: ["TDDI/L7", "B1/L8/SC2", "G1/L9/TE1", "A1/L10/SF2", "F1/L11", "L12", "Lunch", "B2/L43/SC1", "G2/L44/TE2", "A2/L45/SF1", "F2/L46", "TFF2/L47", "L48"],
  Wednesday: ["TEE1/L13", "G1/L14/TF1", "A1/L15/SE2", "C1/L16", "B1/L17/SD2", "L18", "Lunch", "G2/L49/TF2", "A2/L50/SE1", "C2/L51", "B2/L52/SD1", "TDD2/L53", "L54"],
  Thursday: ["TG1/L19", "C1/L20", "D1/L21", "A1/L22/SB2", "F1/L23", "L24", "Lunch", "C2/L55", "D2/L56", "A2/L57/SB1", "F2/L58", "TEE2/L59", "L60"],
  Friday: ["TFF1/L25", "B1/L26/SA2", "TC1/L27", "E1/L28", "D1/L29", "L30", "Lunch", "B2/L61/SA1", "TC2/L62", "E2/L63", "D2/L64", "TG2/L65", "L66"],
  Saturday: ["L31", "G1/L32/TD1", "D1/L33", "F1/L34", "C1/L35", "L36", "Lunch", "G2/L67/TD2", "D2/L68", "F2/L69", "C2/L70", "L71", "L72"],
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeCode(code: string): string {
  const lower = code.trim().toLowerCase();
  if (lower === "tddi") return "tdd1";
  return lower;
}

function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      const codes = cell.split("/").map(c => normalizeCode(c));
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

function getOccupiedCells(slotCodes: string[]): Set<string> {
  const cells = new Set<string>();
  slotCodes.forEach(code => {
    const norm = normalizeCode(code);
    const mappings = globalSlotMapping[norm];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        cells.add(`${day}-${index}`);
      });
    }
  });
  return cells;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function computeCombinedGridWithLabel(
  baseGrid: Record<string, string[]>,
  slotCodes: string[],
  label: string
): Record<string, string[]> {
  const grid = deepClone(baseGrid);
  slotCodes.forEach(code => {
    const norm = normalizeCode(code);
    const mappings = globalSlotMapping[norm];
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

function* generateCsePossibilities(cseCourse: Course): Generator<SlotCombo> {
  for (const slotCombo of cseCourse.slotCombos) {
    yield slotCombo;
  }
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

function logMemoryUsage(stage: string) {
  const memory = process.memoryUsage();
  console.log(
    `${stage} - RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB, Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
}

async function processTimetableRecord(recordId: number, csePossibilities: SlotCombo[], cseCourse: Course): Promise<number> {
  console.log(`Processing record ID: ${recordId}`);
  const record = await prisma.timetable.findUnique({
    where: { id: recordId },
    select: { allSlots: true, grid: true, semester: true, degree: true },
  });
  if (!record) return 0;

  let storedGrid: Record<string, string[]>;
  if (record.grid) {
    storedGrid = typeof record.grid === "string"
      ? JSON.parse(record.grid)
      : (record.grid as Record<string, string[]>);
  } else {
    console.error(`Record ID ${recordId} is missing a grid.`);
    return 0;
  }

  const existingOccupied = new Set<string>();
  for (const day of days) {
    storedGrid[day].forEach((value, index) => {
      if (value !== "") {
        existingOccupied.add(`${day}-${index}`);
      }
    });
  }

  let newCount = 0;
  for (const cse of csePossibilities) {
    const cseCodes = cse.slotCode.split("+").map(code => code.trim());
    const cseOccupied = getOccupiedCells(cseCodes);
    let conflict = false;
    for (const cell of cseOccupied) {
      const [day, idx] = cell.split("-");
      if (storedGrid[day] && storedGrid[day][parseInt(idx)] !== "") {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    const combinedSlotCodes = Array.from(new Set([...record.allSlots, ...cseCodes]));
    const combinedGrid = computeCombinedGridWithLabel(storedGrid, cseCodes, "CSE2005");
    const newRec = await prisma.timetable.create({
      data: {
        semester: cseCourse.semester,
        degree: cseCourse.degree,
        allSlots: combinedSlotCodes,
        grid: combinedGrid,
      },
    });
    console.log(`Inserted new combined record with ID: ${newRec.id} (from record ${recordId})`);
    newCount++;
  }

  logMemoryUsage(`After processing record ID ${recordId}`);
  return newCount;
}

async function main() {
  try {
    logMemoryUsage("Before processing");

    const idRecords = await prisma.timetable.findMany({ select: { id: true } });
    console.log(`Total timetable records to process: ${idRecords.length}`);

    const cseCourseData = await prisma.course.findUnique({
      where: { code: "CSE2005" },
      include: { slotCombos: true },
    });
    if (!cseCourseData) {
      console.log("❌ CSE2005 course not found.");
      return;
    }

    const cseCourse: Course = {
      id: cseCourseData.id,
      code: cseCourseData.code,
      name: cseCourseData.name,
      semester: cseCourseData.semester,
      degree: cseCourseData.degree,
      slotCombos: cseCourseData.slotCombos.map((combo: any) => ({
        id: combo.id,
        slotCode: combo.slotCode,
        venue: combo.venue,
        faculty: combo.faculty,
        courseCode: cseCourseData.code,
      })),
    };

    const csePossibilitiesMap = new Map<string, SlotCombo>();
    for (const slotCombo of generateCsePossibilities(cseCourse)) {
      const codes = slotCombo.slotCode.split("+").map(code => normalizeCode(code));
      codes.sort();
      const signature = codes.join("+");
      if (!csePossibilitiesMap.has(signature)) {
        csePossibilitiesMap.set(signature, slotCombo);
      }
    }

    const csePossibilities = Array.from(csePossibilitiesMap.values());
    console.log(`Unique CSE possibilities: ${csePossibilities.length}`);

    const BATCH_SIZE = 50000;
    const idBatches = chunkArray(idRecords.map(r => r.id), BATCH_SIZE);

    let totalNew = 0;
    let batchNumber = 1;
    for (const batchIds of idBatches) {
      console.log(`Processing batch ${batchNumber} with ${batchIds.length} records concurrently...`);
      const results = await Promise.all(
        batchIds.map(id => processTimetableRecord(id, csePossibilities, cseCourse))
      );
      const batchNew = results.reduce((sum, count) => sum + count, 0);
      totalNew += batchNew;
      logMemoryUsage(`After batch ${batchNumber}`);
      batchNumber++;
    }

    console.log("✅ Total new combined records inserted:", totalNew);
    logMemoryUsage("After processing all records");
  } catch (error) {
    console.error("❌ Error generating Lab+MAT+ECE+CSE timetables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
