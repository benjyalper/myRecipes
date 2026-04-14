/**
 * Home page — recipe library.
 *
 * Shows:
 *  - Search bar
 *  - "Add recipe" button that opens an upload modal
 *  - Grid of recipe cards (empty state when no recipes yet)
 */

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import RecipeCard from '../components/RecipeCard';
import UploadZone from '../components/UploadZone';
import { Recipe } from '../lib/types';

export default function HomePage() {
  const [recipes,      setRecipes]      = useState<Recipe[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showUpload,   setShowUpload]   = useState(false);

  // ── Fetch recipes ──────────────────────────────────────────────────────

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/recipes');
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  // Re-load when upload modal closes after success
  function handleUploadClose() {
    setShowUpload(false);
    loadRecipes();
  }

  // ── Filtering ─────────────────────────────────────────────────────────

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? recipes.filter(r =>
        r.title.toLowerCase().includes(q)       ||
        r.description.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      )
    : recipes;

  // ─────────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-warm-700">המתכונים שלי</h1>
            {recipes.length > 0 && (
              <p className="text-sm text-warm-300 mt-1">
                {recipes.length} מתכון{recipes.length !== 1 ? 'ים' : ''} שמורים
              </p>
            )}
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-base px-6 py-3 self-start sm:self-auto"
          >
            <span aria-hidden="true">+</span>
            הוסף מתכון חדש
          </button>
        </div>

        {/* ── Search bar ── */}
        {recipes.length > 0 && (
          <div className="relative mb-8">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-300 pointer-events-none"
                  aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם, תיאור או מרכיב..."
              className="input pr-11 text-base"
            />
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-cream-200" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-5 bg-cream-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-cream-200 rounded-lg w-full" />
                  <div className="h-4 bg-cream-200 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && recipes.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-20 text-center animate-fade-in">
            <span className="text-7xl" aria-hidden="true">🍽️</span>
            <div>
              <h2 className="text-xl font-bold text-warm-600 mb-2">
                עדיין אין מתכונים
              </h2>
              <p className="text-warm-400 max-w-sm mx-auto leading-relaxed">
                העלו תמונה של מתכון — מספר כלי ידיים, מסך אפליקציה, או צילום ספר בישול —
                ואנחנו נחלץ אותו בשבילכם אוטומטית.
              </p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary text-base px-8 py-3"
            >
              ✨ העלו את המתכון הראשון שלכם
            </button>
          </div>
        )}

        {/* ── No search results ── */}
        {!loading && recipes.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <span className="text-5xl" aria-hidden="true">🔎</span>
            <p className="mt-4 text-warm-500 font-medium">
              לא נמצאו מתכונים עבור &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm text-peach-500 hover:text-peach-600 underline"
            >
              נקה חיפוש
            </button>
          </div>
        )}

        {/* ── Recipe grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                     bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto
                          shadow-soft-lg animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-cream-300">
              <h2 className="text-lg font-bold text-warm-700">הוספת מתכון חדש</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200
                           flex items-center justify-center text-warm-400
                           transition-colors"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <UploadZone onClose={handleUploadClose} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
