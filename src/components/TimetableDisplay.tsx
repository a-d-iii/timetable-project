// src/components/TimetableDisplay.tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

interface TimetableDisplayProps {
  grids: Array<Record<string, string[]>>;
}

type Theme = {
  textColor: string;
  backgroundColor: string;
  headerBackground: string;
  headerTextColor: string;
  borderColor: string;
  rowEvenBackground: string;
  rowOddBackground: string;
  dayCellBackground: string;
};

const themes: { [key: string]: Theme } = {
  default: {
    textColor: "#1e3a8a", // dark blue
    backgroundColor: "#f7f9fa",
    headerBackground: "#2c3e50",
    headerTextColor: "#ecf0f1",
    borderColor: "#34495e",
    rowEvenBackground: "#ecf0f1",
    rowOddBackground: "#bdc3c7",
    dayCellBackground: "#95a5a6",
  },
  theme1: {
    textColor: "#0b3d91",
    backgroundColor: "#e6f0ff",
    headerBackground: "#003366",
    headerTextColor: "#ffffff",
    borderColor: "#003366",
    rowEvenBackground: "#cce0ff",
    rowOddBackground: "#99c2ff",
    dayCellBackground: "#336699",
  },
  theme2: {
    textColor: "#2d3436",
    backgroundColor: "#dfe6e9",
    headerBackground: "#636e72",
    headerTextColor: "#ffffff",
    borderColor: "#b2bec3",
    rowEvenBackground: "#dfe6e9",
    rowOddBackground: "#b2bec3",
    dayCellBackground: "#636e72",
  },
  theme3: {
    textColor: "#0e4d92",
    backgroundColor: "#f0f8ff",
    headerBackground: "#4682b4",
    headerTextColor: "#ffffff",
    borderColor: "#5dade2",
    rowEvenBackground: "#e1f5fe",
    rowOddBackground: "#81d4fa",
    dayCellBackground: "#1976d2",
  },
  theme4: {
    textColor: "#1e272e",
    backgroundColor: "#f5f6fa",
    headerBackground: "#2f3640",
    headerTextColor: "#f5f6fa",
    borderColor: "#353b48",
    rowEvenBackground: "#dcdde1",
    rowOddBackground: "#a4b0be",
    dayCellBackground: "#2f3640",
  },
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

// Container variants: subtle fade and scale on load and a gentle scale on hover.
const containerVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  hover: { scale: 1.02, transition: { duration: 0.3 } },
};

// Cell variants: a subtle pop effect and background color change on hover.
const cellVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

const TimetableComponent: React.FC<{ grid: Record<string, string[]>; theme: Theme }> = ({ grid, theme }) => {
  return (
    <motion.table
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={containerVariants}
      style={{
        borderCollapse: "collapse",
        width: "100%",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <thead style={{ backgroundColor: theme.headerBackground, color: theme.headerTextColor }}>
        <tr>
          <th style={{ border: `1px solid ${theme.borderColor}`, padding: "12px", textAlign: "center" }}>
            Day / Time
          </th>
          {timeSlots.map((slot, i) => (
            <th
              key={i}
              style={{
                border: `1px solid ${theme.borderColor}`,
                padding: "12px",
                textAlign: "center",
              }}
            >
              {slot}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day, rowIndex) => (
          <tr
            key={day}
            style={{
              backgroundColor: rowIndex % 2 === 0 ? theme.rowEvenBackground : theme.rowOddBackground,
            }}
          >
            <td
              style={{
                border: `1px solid ${theme.borderColor}`,
                padding: "12px",
                fontWeight: "bold",
                textAlign: "center",
                backgroundColor: theme.dayCellBackground,
                color: theme.headerTextColor,
              }}
            >
              {day}
            </td>
            {grid[day].map((cell, i) => (
              <motion.td
                key={i}
                variants={cellVariants}
                whileHover={{ scale: 1.05 }}
                style={{
                  border: `1px solid ${theme.borderColor}`,
                  padding: "12px",
                  textAlign: "center",
                  color: theme.textColor,
                  cursor: "pointer",
                }}
              >
                {cell}
              </motion.td>
            ))}
          </tr>
        ))}
      </tbody>
    </motion.table>
  );
};

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ grids }) => {
  const [themeName, setThemeName] = useState<keyof typeof themes>("default");
  const theme = themes[themeName];

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: theme.backgroundColor,
        minHeight: "100vh",
        color: theme.textColor,
        transition: "background-color 0.5s ease",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1rem", color: theme.textColor }}>
        Visual Timetable Possibilities
      </h1>
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
        {Object.keys(themes).map((key) => (
          <button
            key={key}
            onClick={() => setThemeName(key as keyof typeof themes)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: `1px solid ${theme.borderColor}`,
              cursor: "pointer",
              backgroundColor: key === themeName ? theme.headerBackground : "#fff",
              color: key === themeName ? theme.headerTextColor : theme.textColor,
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            {key}
          </button>
        ))}
      </div>
      {grids.map((grid, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          style={{
            marginBottom: "2rem",
            border: `2px solid ${theme.borderColor}`,
            padding: "1rem",
            borderRadius: "12px",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ textAlign: "center", color: theme.textColor }}>Timetable Possibility #{index + 1}</h2>
          <TimetableComponent grid={grid} theme={theme} />
        </motion.div>
      ))}
    </div>
  );
};

export default TimetableDisplay;
