


import React from 'react';

interface FilterProps {
  label: string;
  onClick: () => void;
}

export default function Filter({ label, onClick }: FilterProps) {
  return (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
