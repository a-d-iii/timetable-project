// src/utils/generateCombinations.ts

export function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>((acc, curr) =>
    acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}
