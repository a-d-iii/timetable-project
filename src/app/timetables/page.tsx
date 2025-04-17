"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
        {days.map(day => (
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

const TimetablesPage = () => {
  const [searchId, setSearchId] = useState("");
  
  // SWR key depends on searchId. If searchId is provided, append it as query parameter.
  const { data: timetables, error, mutate } = useSWR(
    () => (searchId ? `/api/getTimetables?id=${searchId}` : `/api/getTimetables`),
    fetcher
  );
  
  const handleSearch = () => {
    mutate(); // trigger a revalidation with the new query parameter
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Visual Timetables</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter Timetable ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />
        <button onClick={handleSearch} style={{ padding: "0.5rem 1rem" }}>
          Search
        </button>
      </div>
      {error && <div>Error loading timetables.</div>}
      {!timetables ? (
        <div>Loading timetables...</div>
      ) : timetables.length === 0 ? (
        <div>No timetables found.</div>
      ) : (
        timetables.map((tt: { id: number; grid: Record<string, string[]> }) => (
          <motion.div
            key={tt.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}
          >
            <h3>Timetable ID: {tt.id}</h3>
            <TimetableComponent grid={tt.grid} id={tt.id} />
          </motion.div>
        ))
      )}
    </div>
  );
};

export default TimetablesPage;
