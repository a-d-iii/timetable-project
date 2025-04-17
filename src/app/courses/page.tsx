"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import ConfirmCoursesButton from "@/components/ConfirmCoursesButton";
import CourseModal from "@/components/CourseModal"; // Make sure the path is correct

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CoursesPage() {
  // Get semester and degree from URL query parameters
  const searchParams = useSearchParams();
  const semester = searchParams.get("semester") || "1";
  const degree = searchParams.get("degree") || "CSE";

  // Fetch default courses for the given semester and degree
  const { data, error } = useSWR(
    `/api/courses?semester=${semester}&degree=${degree}`,
    fetcher
  );

  // Local state to keep track of the user's selected courses
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  // Local state for global search query and results
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);

  // When default courses load, set them as the selected courses
  useEffect(() => {
    if (data && data.courses) {
      setSelectedCourses(data.courses);
    }
  }, [data]);

  // Fetch global courses whenever the query changes
  useEffect(() => {
    if (globalQuery.trim() === "") {
      setGlobalResults([]);
      return;
    }
    fetch(`/api/courses/search?query=${globalQuery}`)
      .then((res) => res.json())
      .then((data) => setGlobalResults(data.courses || []));
  }, [globalQuery]);

  const handleRemoveCourse = (courseId: number) => {
    setSelectedCourses((prev) => prev.filter((course) => course.id !== courseId));
  };

  const handleAddCourse = (course: any) => {
    // Add the course if it's not already in the selected list
    if (!selectedCourses.find((c) => c.id === course.id)) {
      setSelectedCourses((prev) => [...prev, course]);
    }
  };

  // This function is called when the Confirm Courses button is clicked.
  // It logs the selected courses and (in a real app) would navigate to the final timetable page.
  const handleConfirmCourses = () => {
    console.log("Courses confirmed:", selectedCourses);
    // For now, just log the courses.
    // Later, you could use router.push("/timetable") or update a global state/context.
  };

  if (error) return <div>Error loading courses.</div>;
  if (!data) return <div>Loading courses...</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">
        Courses for Semester {semester} - {degree}
      </h1>

      {/* Selected Courses Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Selected Courses</h2>
        {selectedCourses.length === 0 ? (
          <p>No courses selected.</p>
        ) : (
          <ul>
            {selectedCourses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between border p-2 my-1 rounded"
              >
                <span>
                  {course.code} - {course.name}
                </span>
                <button
                  onClick={() => handleRemoveCourse(course.id)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Global Course Search Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Add More Courses</h2>
        <input
          type="text"
          placeholder="Search global courses..."
          value={globalQuery}
          onChange={(e) => setGlobalQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        {globalResults.length > 0 && (
          <ul className="border mt-2 p-2 rounded">
            {globalResults.map((course) => (
              <li key={course.id} className="flex items-center justify-between p-1">
                <span>
                  {course.code} - {course.name}
                </span>
                <button onClick={() => handleAddCourse(course)} className="text-green-500">
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Courses Button */}
      <ConfirmCoursesButton onConfirm={handleConfirmCourses} />
    </div>
  );
}
