"use client";

import { useEffect } from "react";
import useSWR from "swr";

type TimetableGridProps = {
  selectedCourses: any[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TimetableGrid({ selectedCourses }: TimetableGridProps) {
  // Derive requiredSlots from selectedCourses:
  // For each course, get its slotCombos and extract the slotCode.
  const requiredSlots = Array.from(new Set(
    selectedCourses.flatMap((course) =>
      course.slotCombos.map((combo: any) => combo.slotCode)
    )
  ));

  // Build the query string for requiredSlots
  const queryParam = requiredSlots.join(",");

  // Use SWR to fetch timetables filtered by requiredSlots
  const { data, error } = useSWR(
    `/api/timetables?requiredSlots=${encodeURIComponent(queryParam)}`,
    fetcher
  );

  if (error) return <div>Error loading timetables.</div>;
  if (!data) return <div>Loading timetables...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Available Timetables</h2>
      {data.timetables.length === 0 ? (
        <p>No timetables found matching the selected courses.</p>
      ) : (
        data.timetables.map((tt: any) => (
          <div key={tt.id} className="border p-4 my-2 rounded">
            <p><strong>ID:</strong> {tt.id}</p>
            <p>
              <strong>Semester:</strong> {tt.semester} | <strong>Degree:</strong> {tt.degree}
            </p>
            {/* Display a simple representation of the grid */}
            <pre className="mt-2 text-sm">{JSON.stringify(tt.grid, null, 2)}</pre>
          </div>
        ))
      )}
    </div>
  );
}
