// ─── Core data types ──────────────────────────────────────────────────────────

export interface Ingredient {
  name: string;     // שם המרכיב  — e.g. "קמח"
  quantity: string; // כמות       — e.g. "2"
  unit: string;     // יחידת מידה — e.g. "כוסות"
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  ingredients: Ingredient[];
  steps: string[];
  notes: string;
  rawText: string;       // The raw OCR output, kept for transparency/debugging
  images: string[];      // Paths relative to /public — e.g. ["/uploads/abc.jpg"]
  createdAt: string;     // ISO-8601
  updatedAt?: string;    // ISO-8601, set on every edit
}

// Shape returned by the OpenAI extraction call (may be partial)
export interface ExtractedRecipe {
  title?: string;
  description?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients?: Ingredient[];
  steps?: string[];
  notes?: string;
  rawText?: string;
}
