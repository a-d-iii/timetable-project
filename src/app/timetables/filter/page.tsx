"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";

// Simple fetcher for SWR.
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Type for course option from /api/courses.
type CourseOption = {
  code: string;
  name: string;
};

// Base timetable layout (defines the grid structure).
const baseTimetable: Record<string, string[]> = {
  Monday: ["L1", "TA1/L2", "TB1/L3", "E1/L4", "E1/L5", "L6", "Lunch", "TA2/L37", "TB2/L38", "E2/L39", "E2/L40", "L41", "L42"],
  Tuesday: ["TDDI/L7", "B1/L8/SC2", "G1/L9/TE1", "A1/L10/SF2", "F1/L11", "L12", "Lunch", "B2/L43/SC1", "G2/L44/TE2", "A2/L45/SF1", "F2/L46", "TFF2/L47", "L48"],
  Wednesday: ["TEE1/L13", "G1/L14/TF1", "A1/L15/SE2", "C1/L16", "B1/L17/SD2", "L18", "Lunch", "G2/L49/TF2", "A2/L50/SE1", "C2/L51", "B2/L52/SD1", "TDD2/L53", "L54"],
  Thursday: ["TG1/L19", "C1/L20", "D1/L21", "A1/L22/SB2", "F1/L23", "L24", "Lunch", "C2/L55", "D2/L56", "A2/L57/SB1", "F2/L58", "TEE2/L59", "L60"],
  Friday: ["TFF1/L25", "B1/L26/SA2", "TC1/L27", "E1/L28", "D1/L29", "L30", "Lunch", "B2/L61/SA1", "TC2/L62", "E2/L63", "D2/L64", "TG2/L65", "L66"],
  Saturday: ["L31", "G1/L32/TD1", "D1/L33", "F1/L34", "C1/L35", "L36", "Lunch", "G2/L67/TD2", "D2/L68", "F2/L69", "C2/L70", "L71", "L72"],
};

const timeSlots = [
  "08:00-08:50",
  "09:00-09:50",
  "10:00-10:50",
  "11:00-11:50",
  "12:00-12:50",
  "13:00-13:50",
  "Lunch",
  "14:00-14:50",
  "15:00-15:50",
  "16:00-16:50",
  "17:00-17:50",
  "18:00-18:50",
  "19:00-19:30",
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Build a global mapping from each slot code (lowercase) to all its positions in the base timetable.
function buildGlobalSlotMapping(): Record<string, Array<{ day: string; index: number }>> {
  const mapping: Record<string, Array<{ day: string; index: number }>> = {};
  for (const day of days) {
    baseTimetable[day].forEach((cell, index) => {
      const codes = cell.split("/").map(c => c.trim().toLowerCase());
      codes.forEach((code) => {
        if (code !== "lunch") {
          if (!mapping[code]) {
            mapping[code] = [];
          }
          mapping[code].push({ day, index });
        }
      });
    });
  }
  return mapping;
}
const globalSlotMapping = buildGlobalSlotMapping();

// Helper function to compute a grid from a flat allSlots array using the global mapping.
function computeGridFromAllSlots(allSlots: string[]): Record<string, string[]> {
  const grid: Record<string, string[]> = {};
  for (const day of days) {
    grid[day] = Array(baseTimetable[day].length).fill("");
  }
  allSlots.forEach((code) => {
    const normalizedCode = code.trim().toLowerCase();
    const mappings = globalSlotMapping[normalizedCode];
    if (mappings) {
      mappings.forEach(({ day, index }) => {
        grid[day][index] = grid[day][index]
          ? grid[day][index] + ", " + normalizedCode
          : normalizedCode;
      });
    }
  });
  return grid;
}

// AutocompleteInput Component
const AutocompleteInput: React.FC<{
  value: string;
  onSelect: (val: string) => void;
  options: CourseOption[];
}> = ({ value, onSelect, options }) => {
  const [inputValue, setInputValue] = useState(value);
  const [showOptions, setShowOptions] = useState(false);

  const filteredOptions = options.filter(
    (option) =>
      option.code.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowOptions(true);
        }}
        onBlur={() => setTimeout(() => setShowOptions(false), 200)}
        onFocus={() => setShowOptions(true)}
        placeholder="Select course..."
        style={{ width: "100%", padding: "4px" }}
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 1000,
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {filteredOptions.map((option) => (
            <li
              key={option.code}
              style={{ padding: "4px", cursor: "pointer" }}
              onClick={() => {
                setInputValue(option.code);
                onSelect(option.code);
                setShowOptions(false);
              }}
            >
              {option.code} - {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// FilterGrid renders a grid with an autocomplete input in every cell.
const FilterGrid: React.FC<{
  filters: { [key: string]: string };
  setFilters: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  courseOptions: CourseOption[];
}> = ({ filters, setFilters, courseOptions }) => {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>Day / Time</th>
          {timeSlots.map((slot, i) => (
            <th key={i} style={{ border: "1px solid #ccc", padding: "8px" }}>{slot}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day}>
            <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>{day}</td>
            {baseTimetable[day].map((_, i) => {
              const key = `${day}-${i}`;
              return (
                <td key={i} style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <AutocompleteInput
                    value={filters[key] || ""}
                    onSelect={(val) => setFilters((prev) => ({ ...prev, [key]: val }))}
                    options={courseOptions}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// TimetableComponent renders a static timetable grid.
const TimetableComponent: React.FC<{ grid: Record<string, string[]>; id: number }> = ({ grid, id }) => {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>Day / Time</th>
          {timeSlots.map((slot, i) => (
            <th key={i} style={{ border: "1px solid #ccc", padding: "8px" }}>{slot}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day}>
            <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>{day}</td>
            {grid[day]?.map((cell, i) => (
              <td key={i} style={{ border: "1px solid #ccc", padding: "8px" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Filtering logic: Check if a given timetable grid matches all filter criteria.
// For each filter key (e.g., "Monday-3"), if a filter value is set, the corresponding cell in the grid must include that text.
const gridMatchesFilters = (grid: Record<string, string[]>, filters: { [key: string]: string }): boolean => {
  for (const key in filters) {
    const filterValue = filters[key].toLowerCase().trim();
    if (filterValue) {
      const [day, indexStr] = key.split("-");
      const index = parseInt(indexStr, 10);
      const cellValue = grid[day] && grid[day][index] ? grid[day][index].toLowerCase() : "";
      if (!cellValue.includes(filterValue)) {
        return false;
      }
    }
  }
  return true;
};

// Compute grid from a timetable record.
// If the record has a grid property (non-null), use it; otherwise, compute it from the allSlots array.
function getGrid(tt: { grid: Record<string, string[]> | null; allSlots: string[] }): Record<string, string[]> {
  if (tt.grid) {
    return tt.grid;
  } else if (tt.allSlots && Array.isArray(tt.allSlots)) {
    return computeGridFromAllSlots(tt.allSlots);
  }
  // Fallback: return an empty grid based on the base timetable.
  const emptyGrid: Record<string, string[]> = {};
  for (const day of days) {
    emptyGrid[day] = Array(baseTimetable[day].length).fill("");
  }
  return emptyGrid;
}

const FilterPage = () => {
  // Fetch timetable records from your API endpoint.
  const { data: timetables, error } = useSWR("/api/getTimetables", fetcher);
  // Fetch course options for autocomplete.
  const { data: courseOptionsData } = useSWR("/api/courses", fetcher);
  const courseOptions: CourseOption[] = Array.isArray(courseOptionsData) ? courseOptionsData.courses || courseOptionsData : [];

  // Filters state: keys are like "Monday-3" and values are the selected course code.
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  // Filter timetables based on the filters.
  const filteredTimetables =
    timetables &&
    timetables.filter((tt: { id: number; grid: Record<string, string[]> | null; allSlots: string[] }) =>
      gridMatchesFilters(getGrid(tt), filters)
    );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Filter Timetables</h1>
      <p>
        In each cell, start typing to see course options from the database and select one.
        The filter will then show timetables that have that course in that slot.
      </p>
      <FilterGrid filters={filters} setFilters={setFilters} courseOptions={courseOptions} />
      <h2>Filtered Timetables</h2>
      {error && <div>Error loading timetables.</div>}
      {!timetables && <div>Loading timetables...</div>}
      {timetables && filteredTimetables.length === 0 && <div>No timetables match your filters.</div>}
      {timetables &&
        filteredTimetables.map((tt: { id: number; grid: Record<string, string[]> | null; allSlots: string[] }) => {
          const grid = getGrid(tt);
          return (
            <motion.div
              key={tt.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}
            >
              <h3>Timetable ID: {tt.id}</h3>
              <TimetableComponent grid={grid} id={tt.id} />
            </motion.div>
          );
        })}
    </div>
  );
};

export default FilterPage;
