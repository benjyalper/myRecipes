import Link from 'next/link';
import { Recipe } from '../lib/types';

interface RecipeCardProps {
  recipe: Recipe;
}

/** Format an ISO date string into a friendly Hebrew-style date. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * A soft, warm card representing one recipe in the library grid.
 * Clicking anywhere navigates to the full recipe page.
 */
export default function RecipeCard({ recipe }: RecipeCardProps) {
  const thumb = recipe.images?.[0] ?? null;
  const hasDescription = recipe.description && recipe.description.trim().length > 0;

  // Compile a quick summary of metadata badges
  const badges: string[] = [];
  if (recipe.servings)  badges.push(`🍽 ${recipe.servings}`);
  if (recipe.totalTime) badges.push(`⏱ ${recipe.totalTime}`);

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block focus:outline-none">
      <article className="card h-full flex flex-col transition-all duration-200
                          hover:shadow-card-hover hover:-translate-y-1 focus-within:ring-2
                          focus-within:ring-peach-300">
        {/* ── Thumbnail ── */}
        <div className="relative w-full aspect-[4/3] bg-cream-200 overflow-hidden">
          {thumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumb}
              alt={recipe.title || 'תמונת מתכון'}
              className="w-full h-full object-cover transition-transform duration-300
                         group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-30" aria-hidden="true">🍳</span>
            </div>
          )}

          {/* Date overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12
                          bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-2 right-3 text-xs text-white/80 font-light">
            {formatDate(recipe.createdAt)}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          <h2 className="font-bold text-warm-700 text-lg leading-snug line-clamp-2
                         group-hover:text-peach-500 transition-colors">
            {recipe.title || 'מתכון ללא שם'}
          </h2>

          {hasDescription && (
            <p className="text-sm text-warm-400 leading-relaxed line-clamp-3 flex-1">
              {recipe.description}
            </p>
          )}

          {/* Meta badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {badges.map((b) => (
                <span key={b} className="badge">{b}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
