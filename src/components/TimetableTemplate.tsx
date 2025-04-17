import React from 'react';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  "19:00-19:30"
];

export type TimetableData = {
  // Mapping day names to an array of strings (or nulls) for each time slot.
  [day: string]: (string | null)[];
};

interface TimetableTemplateProps {
  data?: TimetableData;
}

const TimetableTemplate: React.FC<TimetableTemplateProps> = ({ data }) => {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
      <thead>
        <tr>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>Time</th>
          {days.map((day) => (
            <th key={day} style={{ border: "1px solid #ccc", padding: "8px" }}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((slot, rowIndex) => (
          <tr key={rowIndex}>
            <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>
              {slot}
            </td>
            {days.map((day) => (
              <td
                key={day}
                style={{ border: "1px solid #ccc", padding: "8px", minHeight: "50px" }}
              >
                {data && data[day] && data[day][rowIndex] ? data[day][rowIndex] : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TimetableTemplate;
