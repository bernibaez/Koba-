/** True for fetch/DOM/Supabase abort rejections (incl. Strict Mode cleanup). */
export function isAbortError(e: unknown): boolean {
  if (e == null) return false;
  if (typeof e !== 'object') return false;
  const err = e as { name?: string; code?: string | number; message?: string };
  if (err.name === 'AbortError' || err.code === 'ABORT_ERR' || err.code === 20) return true;
  if (typeof err.message === 'string' && /aborted|AbortError/i.test(err.message)) return true;
  return false;
}
