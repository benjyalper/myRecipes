/**
 * Recipe detail page — /recipes/[id]
 *
 * Two modes:
 *  - VIEW:  Displays the recipe beautifully.
 *  - EDIT:  In-place editing of all fields.
 *
 * Actions available:
 *  - Edit (toggle edit mode)
 *  - Save / Cancel
 *  - Copy recipe as plain text
 *  - Export / Print
 *  - Delete (with confirmation dialog)
 *  - Back to recipes
 */

import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getRecipeById } from '../../lib/db';
import { Recipe, Ingredient } from '../../lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { recipe: Recipe }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function recipeToPlainText(r: Recipe): string {
  const lines: string[] = [];
  lines.push(r.title || 'מתכון');
  if (r.description)  lines.push('', r.description);
  if (r.servings)     lines.push('', `מנות: ${r.servings}`);
  if (r.prepTime)     lines.push(`זמן הכנה: ${r.prepTime}`);
  if (r.cookTime)     lines.push(`זמן בישול: ${r.cookTime}`);
  if (r.totalTime)    lines.push(`זמן כולל: ${r.totalTime}`);
  if (r.ingredients.length > 0) {
    lines.push('', 'מרכיבים:', '─'.repeat(20));
    r.ingredients.forEach(ing => {
      const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
      lines.push(`• ${ing.name}${qty ? ' — ' + qty : ''}`);
    });
  }
  if (r.steps.length > 0) {
    lines.push('', 'הוראות הכנה:', '─'.repeat(20));
    r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  if (r.notes) lines.push('', 'הערות:', r.notes);
  return lines.join('\n');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipePage({ recipe: initial }: Props) {
  const router = useRouter();
  const [recipe,       setRecipe]       = useState<Recipe>(initial);
  const [isEditing,    setIsEditing]    = useState(false);
  const [showRaw,      setShowRaw]      = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [saveLoading,  setSaveLoading]  = useState(false);
  const [copyMsg,      setCopyMsg]      = useState('');

  // ── Edit state ────────────────────────────────────────────────────────

  const [editTitle,       setEditTitle]       = useState(recipe.title);
  const [editDescription, setEditDescription] = useState(recipe.description);
  const [editServings,    setEditServings]     = useState(recipe.servings);
  const [editPrepTime,    setEditPrepTime]     = useState(recipe.prepTime);
  const [editCookTime,    setEditCookTime]     = useState(recipe.cookTime);
  const [editTotalTime,   setEditTotalTime]    = useState(recipe.totalTime);
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>(
    recipe.ingredients.length ? recipe.ingredients : [{ name: '', quantity: '', unit: '' }]
  );
  const [editSteps,  setEditSteps]  = useState<string[]>(
    recipe.steps.length ? recipe.steps : ['']
  );
  const [editNotes,  setEditNotes]  = useState(recipe.notes);

  function enterEdit() {
    setEditTitle(recipe.title);
    setEditDescription(recipe.description);
    setEditServings(recipe.servings);
    setEditPrepTime(recipe.prepTime);
    setEditCookTime(recipe.cookTime);
    setEditTotalTime(recipe.totalTime);
    setEditIngredients(
      recipe.ingredients.length ? [...recipe.ingredients] : [{ name: '', quantity: '', unit: '' }]
    );
    setEditSteps(recipe.steps.length ? [...recipe.steps] : ['']);
    setEditNotes(recipe.notes);
    setIsEditing(true);
  }

  function cancelEdit() { setIsEditing(false); }

  async function saveEdit() {
    setSaveLoading(true);
    try {
      const updates = {
        title:       editTitle,
        description: editDescription,
        servings:    editServings,
        prepTime:    editPrepTime,
        cookTime:    editCookTime,
        totalTime:   editTotalTime,
        ingredients: editIngredients.filter(i => i.name.trim()),
        steps:       editSteps.filter(s => s.trim()),
        notes:       editNotes,
      };
      const res  = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('שגיאה בשמירה');
      const updated = await res.json() as Recipe;
      setRecipe(updated);
      setIsEditing(false);
    } catch {
      alert('שגיאה בשמירת המתכון. נסה שנית.');
    } finally {
      setSaveLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────

  async function confirmDelete() {
    try {
      await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' });
      router.push('/');
    } catch {
      alert('שגיאה במחיקת המתכון.');
    }
  }

  // ── Copy ──────────────────────────────────────────────────────────────

  async function copyRecipe() {
    await navigator.clipboard.writeText(recipeToPlainText(recipe));
    setCopyMsg('הועתק!');
    setTimeout(() => setCopyMsg(''), 2000);
  }

  // ── Ingredient list helpers ───────────────────────────────────────────

  function updateIngredient(idx: number, field: keyof Ingredient, value: string) {
    setEditIngredients(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }
  function addIngredient()        { setEditIngredients(p => [...p, { name: '', quantity: '', unit: '' }]); }
  function removeIngredient(idx: number) {
    setEditIngredients(p => p.filter((_, i) => i !== idx));
  }

  // ── Step list helpers ─────────────────────────────────────────────────

  function updateStep(idx: number, value: string) {
    setEditSteps(prev => { const n = [...prev]; n[idx] = value; return n; });
  }
  function addStep()              { setEditSteps(p => [...p, '']); }
  function removeStep(idx: number){ setEditSteps(p => p.filter((_, i) => i !== idx)); }

  // ─────────────────────────────────────────────────────────────────────

  const heroImage = recipe.images?.[0] ?? null;

  return (
    <Layout title={recipe.title || 'מתכון'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Top action bar ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6 no-print">
          <Link href="/" className="btn-secondary text-sm">
            ← חזרה לרשימה
          </Link>

          <div className="flex-1" />

          {!isEditing ? (
            <>
              <button onClick={copyRecipe} className="btn-secondary text-sm">
                {copyMsg || '📋 העתק מתכון'}
              </button>
              <button onClick={() => window.print()} className="btn-secondary text-sm">
                🖨️ הדפסה
              </button>
              <button onClick={enterEdit} className="btn-primary text-sm">
                ✏️ עריכה
              </button>
              <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
                🗑️ מחיקה
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} className="btn-secondary text-sm">
                ביטול
              </button>
              <button
                onClick={saveEdit}
                disabled={saveLoading}
                className="btn-primary text-sm"
              >
                {saveLoading ? 'שומר...' : '💾 שמור שינויים'}
              </button>
            </>
          )}
        </div>

        {/* ── Hero image ── */}
        {heroImage && (
          <div className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden
                          mb-8 shadow-soft-md bg-cream-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ── Main card ── */}
        <div className="card p-6 sm:p-8 mb-6">

          {/* Title */}
          {isEditing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="input text-2xl font-bold mb-4"
              placeholder="שם המתכון"
            />
          ) : (
            <h1 className="text-3xl font-bold text-warm-700 mb-2">
              {recipe.title || 'מתכון ללא שם'}
            </h1>
          )}

          {/* Date created */}
          {!isEditing && (
            <p className="text-xs text-warm-300 mb-4">
              נוצר ב: {formatDate(recipe.createdAt)}
              {recipe.updatedAt && recipe.updatedAt !== recipe.createdAt &&
                ` · עודכן ב: ${formatDate(recipe.updatedAt)}`}
            </p>
          )}

          {/* Description */}
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
              className="input mb-4 resize-none"
              placeholder="תיאור קצר של המתכון"
            />
          ) : (
            recipe.description && (
              <p className="text-warm-500 leading-relaxed mb-6 text-base">
                {recipe.description}
              </p>
            )
          )}

          {/* ── Meta row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'מנות',       icon: '🍽',  view: recipe.servings,  edit: editServings,  set: setEditServings  },
              { label: 'זמן הכנה',   icon: '🥣',  view: recipe.prepTime,  edit: editPrepTime,  set: setEditPrepTime  },
              { label: 'זמן בישול',  icon: '🔥',  view: recipe.cookTime,  edit: editCookTime,  set: setEditCookTime  },
              { label: 'זמן כולל',   icon: '⏱',  view: recipe.totalTime, edit: editTotalTime, set: setEditTotalTime },
            ].map(({ label, icon, view, edit, set }) => (
              <div key={label}
                   className="bg-cream-100 rounded-2xl p-3 flex flex-col items-center
                              gap-1 border border-cream-300 text-center">
                <span className="text-xl" aria-hidden="true">{icon}</span>
                <span className="text-xs text-warm-400 font-medium">{label}</span>
                {isEditing ? (
                  <input
                    value={edit}
                    onChange={e => set(e.target.value)}
                    className="text-sm text-warm-600 font-semibold bg-white rounded-lg
                               px-2 py-1 border border-cream-300 w-full text-center focus:outline-none
                               focus:border-peach-300"
                    placeholder="—"
                  />
                ) : (
                  <span className="text-sm text-warm-600 font-semibold">
                    {view || '—'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Two-column layout: ingredients + steps ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Ingredients */}
            <section>
              <h2 className="text-lg font-bold text-warm-700 mb-3 flex items-center gap-2">
                <span aria-hidden="true">🛒</span> מרכיבים
              </h2>

              {isEditing ? (
                <div className="flex flex-col gap-2">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        value={ing.quantity}
                        onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                        className="input w-16 text-center text-sm px-2"
                        placeholder="כמות"
                        title="כמות"
                      />
                      <input
                        value={ing.unit}
                        onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                        className="input w-20 text-sm px-2"
                        placeholder="יחידה"
                        title="יחידת מידה"
                      />
                      <input
                        value={ing.name}
                        onChange={e => updateIngredient(idx, 'name', e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="שם המרכיב"
                        title="שם מרכיב"
                      />
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-warm-300 hover:text-red-400 transition-colors text-lg
                                   w-6 h-6 flex items-center justify-center flex-shrink-0"
                        title="הסר מרכיב"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={addIngredient}
                    className="mt-1 text-sm text-peach-500 hover:text-peach-600
                               flex items-center gap-1 font-medium"
                  >
                    + הוסף מרכיב
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recipe.ingredients.length === 0 && (
                    <li className="text-warm-300 text-sm italic">לא צוינו מרכיבים</li>
                  )}
                  {recipe.ingredients.map((ing, i) => {
                    const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
                    return (
                      <li key={i}
                          className="flex items-start gap-2 py-1.5 border-b border-cream-200
                                     last:border-0 text-sm">
                        <span className="w-2 h-2 rounded-full bg-peach-300 flex-shrink-0 mt-1.5" />
                        <span className="flex-1 text-warm-600">{ing.name}</span>
                        {qty && (
                          <span className="text-warm-400 font-medium text-xs flex-shrink-0">
                            {qty}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Steps */}
            <section>
              <h2 className="text-lg font-bold text-warm-700 mb-3 flex items-center gap-2">
                <span aria-hidden="true">📝</span> הוראות הכנה
              </h2>

              {isEditing ? (
                <div className="flex flex-col gap-2">
                  {editSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-full bg-peach-200 text-peach-600 text-xs
                                       font-bold flex items-center justify-center flex-shrink-0 mt-2">
                        {idx + 1}
                      </span>
                      <textarea
                        value={step}
                        onChange={e => updateStep(idx, e.target.value)}
                        rows={2}
                        className="input flex-1 text-sm resize-none"
                        placeholder={`שלב ${idx + 1}`}
                      />
                      <button
                        onClick={() => removeStep(idx)}
                        className="text-warm-300 hover:text-red-400 transition-colors text-lg
                                   w-6 h-6 flex items-center justify-center flex-shrink-0 mt-2"
                        title="הסר שלב"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="mt-1 text-sm text-peach-500 hover:text-peach-600
                               flex items-center gap-1 font-medium"
                  >
                    + הוסף שלב
                  </button>
                </div>
              ) : (
                <ol className="flex flex-col gap-3">
                  {recipe.steps.length === 0 && (
                    <li className="text-warm-300 text-sm italic">לא נמצאו שלבי הכנה</li>
                  )}
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-peach-100 text-peach-500
                                       text-xs font-bold flex items-center justify-center
                                       flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-warm-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {/* ── Notes ── */}
          {(isEditing || recipe.notes) && (
            <section className="mt-8 pt-6 border-t border-cream-200">
              <h2 className="text-lg font-bold text-warm-700 mb-3 flex items-center gap-2">
                <span aria-hidden="true">💡</span> הערות וטיפים
              </h2>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={4}
                  className="input resize-none text-sm"
                  placeholder="הערות, טיפים, תחליפים..."
                />
              ) : (
                <p className="text-warm-500 leading-relaxed text-sm whitespace-pre-wrap">
                  {recipe.notes}
                </p>
              )}
            </section>
          )}
        </div>

        {/* ── Additional images (if more than 1) ── */}
        {recipe.images.length > 1 && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-bold text-warm-700 mb-3">תמונות נוספות</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {recipe.images.slice(1).map((img, i) => (
                <div key={i}
                     className="aspect-square rounded-xl overflow-hidden border border-cream-300 bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`תמונה ${i + 2}`}
                       className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Raw OCR text (collapsible) ── */}
        {recipe.rawText && (
          <div className="card overflow-hidden mb-6 no-print">
            <button
              onClick={() => setShowRaw(v => !v)}
              className="w-full px-6 py-4 flex items-center justify-between text-right
                         hover:bg-cream-50 transition-colors"
            >
              <span className="font-medium text-warm-500 text-sm">
                📄 טקסט גולמי (מהחילוץ)
              </span>
              <span className="text-warm-300 text-sm">{showRaw ? '▲' : '▼'}</span>
            </button>
            {showRaw && (
              <div className="px-6 pb-6 border-t border-cream-200">
                <pre className="text-xs text-warm-400 whitespace-pre-wrap leading-relaxed
                                font-mono bg-cream-50 rounded-xl p-4 mt-3 overflow-x-auto
                                max-h-80 overflow-y-auto">
                  {recipe.rawText}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                        bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-sm w-full p-6 shadow-soft-lg animate-slide-up">
            <h3 className="text-lg font-bold text-warm-700 mb-2">מחיקת מתכון</h3>
            <p className="text-warm-500 text-sm mb-6 leading-relaxed">
              האם למחוק את &ldquo;<strong>{recipe.title}</strong>&rdquo;?
              פעולה זו אינה ניתנת לביטול.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="btn-secondary text-sm">
                ביטול
              </button>
              <button onClick={confirmDelete} className="btn-danger text-sm">
                🗑️ כן, מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ─── SSR ─────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.params as { id: string };
  const recipe = getRecipeById(id);
  if (!recipe) return { notFound: true };
  return { props: { recipe } };
};
