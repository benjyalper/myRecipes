/**
 * OCR + Recipe extraction using OpenAI Vision (gpt-4o).
 *
 * Flow:
 *  1. Encode each uploaded image as base64.
 *  2. Send all images in a single API call so the model can see the
 *     full recipe even when it spans multiple pages/photos.
 *  3. Ask the model to return a single structured JSON recipe.
 *  4. Parse and lightly validate the response.
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { ExtractedRecipe, Ingredient } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Hebrew recipe extraction specialist.
You will receive one or more images of a recipe — these may be photos of recipe books,
handwritten notes, or screenshots of cooking websites.
All images belong to THE SAME SINGLE RECIPE. Merge information from all images into one recipe.

Return ONLY a valid JSON object with no surrounding text or markdown.
Use this exact schema:
{
  "title":       "שם המתכון",
  "description": "תיאור קצר",
  "servings":    "מספר מנות",
  "prepTime":    "זמן הכנה",
  "cookTime":    "זמן בישול",
  "totalTime":   "זמן כולל",
  "ingredients": [
    { "name": "שם מרכיב", "quantity": "כמות", "unit": "יחידה" }
  ],
  "steps": ["שלב 1", "שלב 2"],
  "notes":   "הערות וטיפים",
  "rawText": "כל הטקסט שנמצא בתמונות"
}

Rules:
- Fix obvious OCR / handwriting mistakes where you are confident.
- Deduplicate overlapping content across images.
- Preserve all Hebrew text faithfully.
- Leave a field as an empty string "" (or empty array []) if information is not available.
- Never invent recipe content; use only what is visible in the images.
- Keep original units (כוס, גרם, כף, כפית, etc.).`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Read a file from disk and return it as a base64 string. */
function fileToBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

/** Determine the MIME type from the file extension. */
function getMimeType(filePath: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png')              return 'image/png';
  if (ext === '.webp')             return 'image/webp';
  return 'image/jpeg'; // jpg / jpeg / everything else
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extract a structured recipe from one or more image file paths.
 * All images are assumed to be parts of the same recipe.
 */
export async function extractRecipeFromImages(
  imagePaths: string[]
): Promise<ExtractedRecipe> {
  if (imagePaths.length === 0) {
    throw new Error('No images provided for extraction');
  }

  // Build the content array: text prompt + one image block per file
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } };

  const content: ContentBlock[] = [
    { type: 'text', text: SYSTEM_PROMPT },
    ...imagePaths.map((p) => {
      const b64  = fileToBase64(p);
      const mime = getMimeType(p);
      return {
        type: 'image_url' as const,
        image_url: {
          url:    `data:${mime};base64,${b64}`,
          detail: 'high' as const,
        },
      };
    }),
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    temperature: 0.2, // low temperature → more faithful to source text
  });

  const raw = response.choices[0]?.message?.content ?? '{}';

  let parsed: ExtractedRecipe;
  try {
    parsed = JSON.parse(raw) as ExtractedRecipe;
  } catch {
    // If JSON parse fails, return what we can with rawText preserved
    parsed = { rawText: raw };
  }

  // Ensure ingredients array items are well-formed
  if (Array.isArray(parsed.ingredients)) {
    parsed.ingredients = parsed.ingredients.map((ing: Partial<Ingredient>) => ({
      name:     (ing.name     ?? '').trim(),
      quantity: (ing.quantity ?? '').trim(),
      unit:     (ing.unit     ?? '').trim(),
    }));
  } else {
    parsed.ingredients = [];
  }

  // Ensure steps is an array of strings
  if (!Array.isArray(parsed.steps)) {
    parsed.steps = [];
  }

  return parsed;
}
