"use client";

type ConfirmCoursesButtonProps = {
  onConfirm: () => void;
};

export default function ConfirmCoursesButton({ onConfirm }: ConfirmCoursesButtonProps) {
  return (
    <button
      onClick={() => {
        console.log("ConfirmCoursesButton clicked");
        onConfirm();
      }}
      className="px-4 py-2 bg-green-500 text-white rounded mt-4"
    >
      Confirm Courses & View Timetables
    </button>
  );
}
