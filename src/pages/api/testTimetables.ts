// src/pages/api/testTimetables.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'Missing timetable id' });
  }
  
  try {
    const record = await prisma.testTimetable.findUnique({
      where: { id: Number(id) },
    });
    if (!record) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    return res.status(200).json(record);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return res.status(500).json({ message: 'Error fetching timetable', error });
  }
}
