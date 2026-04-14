/**
 * UploadZone — drag-and-drop / click-to-upload component.
 *
 * Rules enforced here:
 *  - Multiple images selected in ONE upload action → treated as ONE recipe.
 *  - Accepted formats: jpg, jpeg, png, webp.
 *  - Shows a preview grid before submission.
 *  - Shows a loading state while the server processes the recipe.
 */

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';

interface UploadZoneProps {
  onClose: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILES = 20;
const MAX_SIZE_MB = 20;

type Status = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export default function UploadZone({ onClose }: UploadZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles]         = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  // ── File validation & preview ────────────────────────────────────────────

  function validateAndSet(raw: FileList | File[]) {
    const list = Array.from(raw);

    // Filter to accepted types
    const valid = list.filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length === 0) {
      setErrorMsg('נא לבחור תמונות בפורמט JPG, PNG או WEBP.');
      return;
    }
    if (valid.length > MAX_FILES) {
      setErrorMsg(`ניתן להעלות עד ${MAX_FILES} תמונות בבת אחת.`);
      return;
    }
    const oversized = valid.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setErrorMsg(`גודל כל תמונה לא יעלה על ${MAX_SIZE_MB} MB.`);
      return;
    }

    setErrorMsg('');
    setFiles(valid);
    setStatus('selected');

    // Generate object-URL previews
    const urls = valid.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }

  // ── Drag events ──────────────────────────────────────────────────────────

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    // Only clear if we're leaving the zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // Required to allow drop
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    validateAndSet(e.dataTransfer.files);
  }

  // ── File input change ────────────────────────────────────────────────────

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) validateAndSet(e.target.files);
  }

  // ── Remove individual preview ────────────────────────────────────────────

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    if (files.length <= 1) setStatus('idle');
  }

  // ── Upload & extract ─────────────────────────────────────────────────────

  async function handleSubmit() {
    if (files.length === 0) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      // All files appended under the same key → server treats them as one recipe
      files.forEach(f => formData.append('images', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'שגיאה בעיבוד המתכון');
      }

      setStatus('success');
      // Navigate to the new recipe after a brief success flash
      setTimeout(() => {
        router.push(`/recipes/${data.id}`);
        onClose();
      }, 800);

    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    previews.forEach(u => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setStatus('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* ── Helper text ── */}
      <p className="text-sm text-warm-400 leading-relaxed text-center">
        העלו תמונה אחת או יותר של <strong className="text-warm-600">אותו מתכון</strong>.{' '}
        אם תעלו כמה תמונות יחד, הן יאוחדו למתכון אחד.
      </p>

      {/* ── Drop zone ── */}
      {status === 'idle' || status === 'selected' ? (
        <>
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-8
              flex flex-col items-center gap-3 text-center transition-all duration-200
              ${isDragging
                ? 'border-peach-400 bg-peach-50 scale-[1.01]'
                : 'border-cream-400 bg-cream-50 hover:border-peach-300 hover:bg-peach-50/40'}
            `}
          >
            <span className="text-4xl" aria-hidden="true">
              {isDragging ? '📥' : '🖼️'}
            </span>
            <p className="text-warm-500 font-medium">
              {isDragging ? 'שחרר לכאן' : 'גרור תמונות לכאן'}
            </p>
            <p className="text-sm text-warm-300">
              או לחץ לבחור קבצים מהמחשב
            </p>
            <p className="text-xs text-warm-200 mt-1">
              JPG, PNG, WEBP &mdash; עד {MAX_FILES} תמונות, {MAX_SIZE_MB} MB כל אחת
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          {/* ── Preview grid ── */}
          {previews.length > 0 && (
            <div>
              <p className="text-sm font-medium text-warm-500 mb-2">
                {previews.length === 1
                  ? 'תמונה אחת נבחרה:'
                  : `${previews.length} תמונות נבחרו (יאוחדו למתכון אחד):`}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden
                                          border border-cream-300 bg-cream-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`תצוגה מקדימה ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/50
                                 text-white text-xs flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="הסר תמונה"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ── Loading state ── */}
      {status === 'uploading' && (
        <div className="flex flex-col items-center gap-4 py-10 animate-fade-in">
          <div className="w-14 h-14 rounded-full border-4 border-peach-200 border-t-peach-400
                          animate-spin-slow" />
          <p className="text-warm-500 font-medium">מעבד את המתכון...</p>
          <p className="text-sm text-warm-300">
            מחלץ טקסט מהתמונות ומארגן את המרכיבים
          </p>
        </div>
      )}

      {/* ── Success state ── */}
      {status === 'success' && (
        <div className="flex flex-col items-center gap-3 py-8 animate-fade-in">
          <span className="text-5xl">✅</span>
          <p className="text-warm-600 font-semibold text-lg">המתכון נוצר בהצלחה!</p>
          <p className="text-sm text-warm-400">מעביר אותך לדף המתכון...</p>
        </div>
      )}

      {/* ── Error message ── */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* ── Action buttons ── */}
      {(status === 'idle' || status === 'selected' || status === 'error') && (
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} className="btn-secondary">
            ביטול
          </button>
          {status === 'error' && (
            <button onClick={reset} className="btn-secondary">
              נסה שוב
            </button>
          )}
          {files.length > 0 && status !== 'error' && (
            <button onClick={handleSubmit} className="btn-primary">
              ✨ חלץ מתכון
            </button>
          )}
        </div>
      )}
    </div>
  );
}
