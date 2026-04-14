/**
 * Lightweight JSON-file database for recipes.
 * All recipes are stored in data/recipes.json as a flat array.
 * This keeps the setup dependency-free — no SQLite native builds needed.
 */

import fs from 'fs';
import path from 'path';
import { Recipe } from './types';

const DATA_DIR  = path.join(process.cwd(), 'data');
const DB_FILE   = path.join(DATA_DIR, 'recipes.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAll(): Recipe[] {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Recipe[];
  } catch {
    return [];
  }
}

function writeAll(recipes: Recipe[]): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(recipes, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all recipes sorted newest-first. */
export function getAllRecipes(): Recipe[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Return a single recipe by id, or null if not found. */
export function getRecipeById(id: string): Recipe | null {
  return readAll().find(r => r.id === id) ?? null;
}

/** Persist a new recipe (insert). */
export function createRecipe(recipe: Recipe): Recipe {
  const all = readAll();
  all.push(recipe);
  writeAll(all);
  return recipe;
}

/** Apply partial updates to an existing recipe. Returns updated recipe or null. */
export function updateRecipe(id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Recipe | null {
  const all = readAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

/** Delete a recipe by id. Returns true if it existed. */
export function deleteRecipe(id: string): boolean {
  const all = readAll();
  const filtered = all.filter(r => r.id !== id);
  if (filtered.length === all.length) return false;
  writeAll(filtered);
  return true;
}
