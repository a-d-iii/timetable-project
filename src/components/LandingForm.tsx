"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingForm() {
  const [semester, setSemester] = useState(1);
  const [degree, setDegree] = useState("CSE");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to the courses page with query parameters
    router.push(`/courses?semester=${semester}&degree=${degree}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-3xl font-bold">Welcome! Select Your Semester & Degree</h1>
      <div>
        <label className="mr-2">Semester:</label>
        <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((sem) => (
            <option key={sem} value={sem}>{sem}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mr-2">Degree:</label>
        <select value={degree} onChange={(e) => setDegree(e.target.value)}>
          {["CSE", "ECE", "MAT"].map((deg) => (
            <option key={deg} value={deg}>{deg}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded">
        Continue
      </button>
    </form>
  );
}
