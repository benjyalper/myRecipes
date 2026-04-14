/**
 * POST /api/upload
 *
 * Accepts a multipart form with one or more image files under the key "images".
 * ALL files in one request are treated as parts of the SAME recipe.
 *
 * Steps:
 *  1. Parse the multipart request with formidable.
 *  2. Move uploaded files to public/uploads/ with UUID filenames.
 *  3. Send all images to OpenAI Vision for OCR + recipe extraction.
 *  4. Persist the structured recipe to data/recipes.json.
 *  5. Return { id } so the client can navigate to /recipes/[id].
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractRecipeFromImages } from '../../lib/ocr';
import { createRecipe } from '../../lib/db';
import { Recipe } from '../../lib/types';

// Disable Next.js default body parser — formidable handles it
export const config = { api: { bodyParser: false } };

// Store images under data/uploads/ — this directory sits on the Railway
// persistent volume (mounted at /app/data) so they survive redeploys.
// They are served via /api/images/[filename] rather than Next.js static files.
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  ensureUploadsDir();

  // ── 1. Parse multipart form ──────────────────────────────────────────────

  const form = formidable({
    uploadDir: UPLOADS_DIR,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,  // 20 MB per file
    maxTotalFileSize: 100 * 1024 * 1024, // 100 MB total
    maxFiles: 20,
    filter: ({ mimetype }) =>
      Boolean(mimetype && (
        mimetype.startsWith('image/jpeg') ||
        mimetype.startsWith('image/png')  ||
        mimetype.startsWith('image/webp')
      )),
  });

  let uploadedPaths: string[] = [];
  let publicPaths: string[]   = [];

  try {
    const [, files] = await form.parse(req);

    // formidable stores files as arrays
    const imageFiles = files['images'] ?? [];
    if (imageFiles.length === 0) {
      return res.status(400).json({ error: 'לא נמצאו תמונות בבקשה' });
    }

    // Rename each temp file to a stable UUID-based name
    for (const file of imageFiles) {
      if (!file.filepath) continue;
      const ext    = path.extname(file.originalFilename ?? '.jpg').toLowerCase() || '.jpg';
      const name   = `${uuidv4()}${ext}`;
      const dest   = path.join(UPLOADS_DIR, name);
      fs.renameSync(file.filepath, dest);
      uploadedPaths.push(dest);
      publicPaths.push(`/api/images/${name}`);
    }

    if (uploadedPaths.length === 0) {
      return res.status(400).json({ error: 'לא ניתן לעבד את הקבצים שהועלו' });
    }

  } catch (err: unknown) {
    console.error('Upload parse error:', err);
    return res.status(500).json({ error: 'שגיאה בניתוח הקבצים שהועלו' });
  }

  // ── 2. OCR + extraction ──────────────────────────────────────────────────

  let extracted;
  try {
    extracted = await extractRecipeFromImages(uploadedPaths);
  } catch (err: unknown) {
    console.error('OCR error:', err);
    // Even on failure, save a stub recipe with raw paths so nothing is lost
    extracted = {
      title:       'מתכון ללא שם',
      description: '',
      rawText:     'שגיאה בחילוץ הטקסט מהתמונות',
    };
  }

  // ── 3. Build & persist recipe ────────────────────────────────────────────

  const recipe: Recipe = {
    id:          uuidv4(),
    title:       extracted.title        ?? 'מתכון ללא שם',
    description: extracted.description  ?? '',
    servings:    extracted.servings     ?? '',
    prepTime:    extracted.prepTime     ?? '',
    cookTime:    extracted.cookTime     ?? '',
    totalTime:   extracted.totalTime    ?? '',
    ingredients: extracted.ingredients  ?? [],
    steps:       extracted.steps        ?? [],
    notes:       extracted.notes        ?? '',
    rawText:     extracted.rawText      ?? '',
    images:      publicPaths,
    createdAt:   new Date().toISOString(),
  };

  try {
    createRecipe(recipe);
  } catch (err: unknown) {
    console.error('DB write error:', err);
    return res.status(500).json({ error: 'שגיאה בשמירת המתכון' });
  }

  return res.status(200).json({ id: recipe.id });
}
