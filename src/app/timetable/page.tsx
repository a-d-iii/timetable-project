"use client";

import React from "react";
import Filter from "@/components/Filter"; // or adjust relative path if not using aliases
import TimetableGrid from "@/components/TimetableGrid";

export default function FinalTimetablePage() {
  return (
    <div className="min-h-screen bg-gray-200 p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center text-indigo-800">
          Final Timetable Combinations
        </h1>
      </header>

      {/* Filters Section */}
      <section className="w-full max-w-6xl mb-6">
        <div className="flex justify-center space-x-4">
          <Filter label="Morning Classes" onClick={() => console.log("Filter: Morning Classes")} />
          <Filter label="Evenings Free" onClick={() => console.log("Filter: Evenings Free")} />
        </div>
      </section>

      {/* Timetable Grid Section */}
      <section className="w-full max-w-6xl">
        <TimetableGrid />
      </section>

      <footer className="mt-8 text-center text-indigo-600">
        &copy; {new Date().getFullYear()} Your University Timetable App
      </footer>
    </div>
  );
}
