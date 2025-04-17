"use client";

import React, { useRef, useState, useEffect } from "react";

type Timetable2Props = {
  extraHeight?: number; // extra height (in px) to add to the base height; default 0
};

export default function Timetable2({ extraHeight = 0 }: Timetable2Props) {
  // Base design dimensions
  const baseWidth = 570; // (50px for label + 13×40px for other cells)
  const baseHeight = 240; // Original design height
  const effectiveHeight = baseHeight + extraHeight; // Adjust height if extraHeight is passed

  // Ref to measure container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScaleFactor(containerWidth / baseWidth);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Compute dynamic font sizes based on scale factor
  const normalFontSize = 8 * scaleFactor; // base 8px scaled
  const lunchFontSize = 6 * scaleFactor;  // base 6px scaled

  // Row labels for the first column:
  const rowLabels = ["THEORY", "LAB", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Data for each row (13 cells per row, with "Lunch" at index 6)
  const theoryRow = [
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
  const labRow = [
    "08:00-08:50",
    "09:00-09:50",
    "09:50-10:40",
    "11:00-11:50",
    "11:50-12:40",
    "12:40-13:30",
    "Lunch",
    "14:00-14:50",
    "14:50-15:40",
    "16:00-16:50",
    "16:50-17:40",
    "18:00-18:50",
    "18:50-19:30",
  ];
  const mondayRow = [
    "L1",
    "TA1/L2",
    "TB1/L3",
    "E1/L4",
    "E1/L5",
    "L6",
    "Lunch",
    "TA2/L37",
    "TB2/L38",
    "E2/L39",
    "E2/L40",
    "L41",
    "L42",
  ];
  const tuesdayRow = [
    "TDDI/L7",
    "B1/L8/SC2",
    "G1/L9/TE1",
    "A1/L10/SF2",
    "F1/L11",
    "L12",
    "Lunch",
    "B2/L43/SC1",
    "G2/L44/TE2",
    "A2/L45/SF1",
    "F2/L46",
    "TFF2/L47",
    "L48",
  ];
  const wednesdayRow = [
    "TEE1/L13",
    "G1/L14/TF1",
    "A1/L15/SE2",
    "C1/L16",
    "B1/L17/SD2",
    "L18",
    "Lunch",
    "G2/L49/TF2",
    "A2/L50/SE1",
    "C2/L51",
    "B2/L52/SD1",
    "TDD2/L53",
    "L54",
  ];
  const thursdayRow = [
    "TG1/L19",
    "C1/L20",
    "D1/L21",
    "A1/L22/SB2",
    "F1/L23",
    "L24",
    "Lunch",
    "C2/L55",
    "D2/L56",
    "A2/L57/SB1",
    "F2/L58",
    "TEE2/L59",
    "L60",
  ];
  const fridayRow = [
    "TFF1/L25",
    "B1/L26/SA2",
    "TC1/L27",
    "E1/L28",
    "D1/L29",
    "L30",
    "Lunch",
    "B2/L61/SA1",
    "TC2/L62",
    "E2/L63",
    "D2/L64",
    "TG2/L65",
    "L66",
  ];
  const saturdayRow = [
    "L31",
    "G1/L32/TD1",
    "D1/L33",
    "F1/L34",
    "C1/L35",
    "L36",
    "Lunch",
    "G2/L67/TD2",
    "D2/L68",
    "F2/L69",
    "C2/L70",
    "L71",
    "L72",
  ];

  const dataRows = [
    theoryRow,
    labRow,
    mondayRow,
    tuesdayRow,
    wednesdayRow,
    thursdayRow,
    fridayRow,
    saturdayRow,
  ];
  const finalRows = dataRows.map((rowData, idx) => [rowLabels[idx], ...rowData]);

  // Compute relative cell widths (based on baseWidth):
  const firstColWidth = (50 / baseWidth) * 100 + "%"; // ≈8.8%
  const normalCellWidth = (40 / baseWidth) * 100 + "%"; // ≈7.0%
  const lunchCellWidth = (15 / baseWidth) * 100 + "%"; // ≈2.6%

  // Colors (locked look):
  const fixedColor = "#b0B0B0";  // For first column & Lunch cells
  const theoryColor = "#CACAF7"; // For THEORY row (non-Lunch cells)
  const labColor = "#9CC8E8";    // For LAB row (non-Lunch cells)
  const slotColor = "#F8EFA4";   // For remaining slots

  const getRowColor = (rowKey: string) => {
    if (rowKey === "THEORY") return theoryColor;
    if (rowKey === "LAB") return labColor;
    return slotColor;
  };

  // Helper: Render cell content by splitting at space and wrapping each word in a block.
  const renderCellContent = (cell: string) => {
    const parts = cell.split(" ");
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        <span className="block whitespace-normal">{part}</span>
      </React.Fragment>
    ));
  };

  return (
    <div ref={containerRef} className="mx-auto" style={{ width: "100%" }}>
      {/* Container that preserves the locked aspect ratio.
          Notice we use effectiveHeight (baseHeight + extraHeight) */}
      <div
        style={{
          width: "100%",
          aspectRatio: `${baseWidth} / ${effectiveHeight}`,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Outer border with thick border and rounded corners */}
          <div className="border-4 border-gray-700 rounded-lg overflow-hidden h-full">
            <table className="w-full table-fixed border-collapse h-full">
              <tbody>
                {finalRows.map((row, rowIndex) => {
                  const rowKey = rowLabels[rowIndex].toUpperCase();
                  return (
                    <tr key={rowIndex} className="h-[12.5%]">
                      {row.map((cell, cellIndex) => {
                        // Identify the lunch cell (should be at cellIndex 7 after label)
                        const isLunchCell =
                          cellIndex === 7 && cell.trim().toLowerCase() === "lunch";
                        if (isLunchCell && rowIndex !== 0) return null;
                        return (
                          <td
                            key={cellIndex}
                            rowSpan={isLunchCell ? finalRows.length : undefined}
                            style={{
                              width:
                                cellIndex === 0
                                  ? firstColWidth
                                  : isLunchCell
                                  ? lunchCellWidth
                                  : normalCellWidth,
                              backgroundColor:
                                cellIndex === 0 || cell.trim().toLowerCase() === "lunch"
                                  ? fixedColor
                                  : getRowColor(rowKey),
                              fontSize:
                                cell.trim().toLowerCase() === "lunch"
                                  ? lunchFontSize + "px"
                                  : normalFontSize + "px",
                              overflowWrap: "break-word",
                              wordBreak: "normal",
                              border: "1px solid #424242",
                            }}
                            className="p-1 text-center text-blue-900 whitespace-normal font-bold"
                          >
                            {isLunchCell ? (
                              <div
                                style={{
                                  writingMode: "vertical-lr",
                                  transform: "rotate(180deg)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                LUNCH
                              </div>
                            ) : (
                              renderCellContent(cell)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
