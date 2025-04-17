"use client";

import React, { useState, useEffect } from "react";

interface CourseModalProps {
  semester: number;
  degree: string;
  onConfirm: (courses: string[]) => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ semester, degree, onConfirm }) => {
  // Dummy data for prepopulated courses based on semester and degree
  // In a real scenario, this would be fetched from your backend.
  const prepopulatedCourses: { [key: string]: string[] } = {
    "1_CSE": ["Math 101", "Programming Basics", "Physics 101"],
    "2_CSE": ["Data Structures", "Discrete Math", "Electronics"],
    // ... add for other semesters and degrees
  };

  // Create a key to fetch initial courses. For now, default to empty array if not defined.
  const key = `${semester}_${degree}`;
  const initialCourses = prepopulatedCourses[key] || [];

  const [courses, setCourses] = useState<string[]>(initialCourses);
  const [newCourse, setNewCourse] = useState("");

  // Function to add a new course
  const handleAddCourse = () => {
    if (newCourse.trim() !== "") {
      setCourses((prev) => [...prev, newCourse.trim()]);
      setNewCourse("");
    }
  };

  // Function to remove a course by index
  const handleRemoveCourse = (index: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-indigo-800">Select Your Courses</h2>
        <ul className="mb-4">
          {courses.map((course, index) => (
            <li key={index} className="flex items-center justify-between mb-2">
              <span className="text-indigo-700">{course}</span>
              <button
                onClick={() => handleRemoveCourse(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex mb-4">
          <input
            type="text"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            placeholder="Add new course"
            className="flex-1 p-2 border border-indigo-300 rounded mr-2 text-indigo-800"
          />
          <button
            onClick={handleAddCourse}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => onConfirm(courses)}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
