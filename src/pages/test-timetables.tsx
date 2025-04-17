// src/pages/test-timetables.tsx
import { GetServerSideProps, NextPage } from 'next';
import { prisma } from "../lib/prisma"; // Correct import path
import { useRouter } from 'next/router';
import { useState } from 'react';

type Timetable = {
  id: number;
  semester: number;
  degree: string;
  grid: {
    Monday: string[];
    Tuesday: string[];
    Wednesday: string[];
    Thursday: string[];
    Friday: string[];
    Saturday: string[];
  };
  allSlots: string[];
};

type Props = {
  timetables: Timetable[];
  searchId: string;
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TestTimetablePage: NextPage<Props> = ({ timetables, searchId }) => {
  const router = useRouter();
  const [input, setInput] = useState(searchId);

  const handleSearch = () => {
    if (input.trim() !== '') {
      router.push(`/test-timetables?id=${input.trim()}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Timetable Viewer</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="number"
          placeholder="Enter Timetable ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ marginRight: '0.5rem', padding: '0.5rem', fontSize: '1rem', width: '200px' }}
        />
        <button onClick={handleSearch} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Search
        </button>
      </div>
      {timetables.length === 0 ? (
        <p>No timetable to display.</p>
      ) : timetables.length === 1 ? (
        <div>
          <h2>Timetable ID: {timetables[0].id}</h2>
          <p>
            Semester: {timetables[0].semester} | Degree: {timetables[0].degree}
          </p>
          <TimetableGrid grid={timetables[0].grid} />
        </div>
      ) : (
        <div>
          {timetables.map((tt) => (
            <div key={tt.id} style={{ marginBottom: '2rem' }}>
              <h2>Timetable ID: {tt.id}</h2>
              <p>
                Semester: {tt.semester} | Degree: {tt.degree}
              </p>
              <TimetableGrid grid={tt.grid} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function TimetableGrid({ grid }: { grid: Timetable['grid'] }) {
  const numSlots = grid.Monday.length;
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={cellStyle}>Day</th>
          {Array.from({ length: numSlots }, (_, idx) => (
            <th key={idx} style={cellStyle}>Slot {idx + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map(day => (
          <tr key={day}>
            <td style={cellStyle}>{day}</td>
            {grid[day].map((cell, idx) => (
              <td key={idx} style={cellStyle}>{cell || '-'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'center',
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: '1rem',
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { id } = context.query;
  let timetables: Timetable[] = [];
  
  if (id && typeof id === "string") {
    const tt = await prisma.testTimetables.findUnique({
      where: { id: Number(id) },
    });
    if (tt) {
      timetables = [tt];
    }
  } else {
    timetables = await prisma.testTimetables.findMany({
      take: 100,
      orderBy: { id: 'asc' },
    });
  }
  return {
    props: {
      timetables,
      searchId: id ? String(id) : '',
    },
  };
};

export default TestTimetablePage;
