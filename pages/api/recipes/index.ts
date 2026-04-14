/**
 * GET /api/recipes  — return all recipes (sorted newest-first)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllRecipes } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const recipes = getAllRecipes();
    return res.status(200).json(recipes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'שגיאה בטעינת המתכונים' });
  }
}
