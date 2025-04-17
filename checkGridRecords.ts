// checkGridRecords.ts
import { prisma } from "./src/lib/prisma";

async function findBadGridRecords() {
  try {
    console.log("Fetching Timetable record IDs...");
    // Fetch only the IDs from the Timetable table.
    const idRecords = await prisma.timetable.findMany({
      select: { id: true },
    });
    console.log(`Found ${idRecords.length} records.`);

    const badRecords: { id: number; error: any }[] = [];
    const goodRecords: { id: number; grid: any; allSlots: any }[] = [];

    // Iterate over each record individually.
    for (const record of idRecords) {
      try {
        // Use a raw query to fetch grid as text and allSlots for this record.
        const res: any[] = await prisma.$queryRawUnsafe(
          `SELECT "grid"::text as grid_text, "allSlots" FROM "Timetable" WHERE id = ${record.id}`
        );
        if (res.length > 0) {
          const rec = res[0];
          // Try to parse the grid_text as JSON.
          const grid = JSON.parse(rec.grid_text);
          goodRecords.push({ id: record.id, grid, allSlots: rec.allSlots });
          console.log(`Record ID ${record.id}: OK`);
        } else {
          console.log(`Record ID ${record.id}: No data returned.`);
        }
      } catch (e) {
        console.error(`Record ID ${record.id} caused error:`, e);
        badRecords.push({ id: record.id, error: e });
      }
    }

    if (badRecords.length > 0) {
      console.log(`Found ${badRecords.length} problematic record(s):`);
      badRecords.forEach(bad => {
        console.log(`Record ID: ${bad.id}, Error: ${bad.error}`);
      });
    } else {
      console.log("No problematic grid values found.");
    }
  } catch (error) {
    console.error("Error fetching timetable record IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findBadGridRecords();
