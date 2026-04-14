/**
 * /api/recipes/[id]
 *
 * GET    — fetch a single recipe by id
 * PUT    — update recipe fields (partial update supported)
 * DELETE — remove the recipe and its uploaded images
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getRecipeById, updateRecipe, deleteRecipe } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  // ── GET ──────────────────────────────────────────────────────────────────

  if (req.method === 'GET') {
    const recipe = getRecipeById(id);
    if (!recipe) return res.status(404).json({ error: 'מתכון לא נמצא' });
    return res.status(200).json(recipe);
  }

  // ── PUT ──────────────────────────────────────────────────────────────────

  if (req.method === 'PUT') {
    // Next.js automatically parses JSON body when bodyParser is enabled (default)
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const updated = updateRecipe(id, updates);
    if (!updated) return res.status(404).json({ error: 'מתכון לא נמצא' });
    return res.status(200).json(updated);
  }

  // ── DELETE ───────────────────────────────────────────────────────────────

  if (req.method === 'DELETE') {
    // Try to delete image files from disk before removing the DB record
    const recipe = getRecipeById(id);
    if (recipe) {
      recipe.images.forEach((imgPath) => {
        try {
          // imgPath is like /api/images/<filename> — extract just the filename
          const filename = path.basename(imgPath);
          const diskPath = path.join(process.cwd(), 'data', 'uploads', filename);
          if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
          }
        } catch {
          // Non-fatal — image cleanup failure shouldn't block the delete
        }
      });
    }

    const removed = deleteRecipe(id);
    if (!removed) return res.status(404).json({ error: 'מתכון לא נמצא' });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
