## Goal

Replace the multi-source client-side fallback (mangadex → comick → mangadex) with a single call to the new server-side endpoint `/api/proxy/chapter/:chapterId?num=&mangaId=`, which the backend handles end-to-end. Keep current routes; just thread the chapter number through.

## Scope

Frontend only. Backend (`/api/proxy/chapter/:chapterId`) is assumed to exist on Railway — you'll deploy it separately. No URL scheme change.

## Changes

### 1. `src/lib/api.ts`
Add a new function:

```ts
export async function getChapterImages(
  chapterId: string,
  opts: { num?: string | number; mangaId?: string }
): Promise<{ pages: string[]; source: string; total: number }> {
  const p = new URLSearchParams();
  if (opts.num != null && opts.num !== "") p.set("num", String(opts.num));
  if (opts.mangaId) p.set("mangaId", opts.mangaId);
  return get(`/api/proxy/chapter/${encodeURIComponent(chapterId)}?${p}`, false);
}
```

Keep the existing `getChapterPages` for now (still used as a possible safety net or removable later). The user said "remove old", so we'll delete its call sites.

### 2. `src/pages/Reader.tsx`
- Read `?num=` from the URL with `useSearchParams`.
- Replace the entire mangadex/comick/mangadex retry loop in `load()` with a single call to `getChapterImages(chapterId, { num, mangaId: id })`.
- If `data.pages.length === 0` → show "No pages found for this chapter".
- Keep `ReaderImage` component (Railway image proxy + wsrv.nl fallback tiers) as-is — page URLs returned by the new endpoint still need hotlink-proof loading.
- Keep history push and prev/next chapter navigation (still uses `getChapters` for the chapter list).

### 3. `src/pages/MangaDetail.tsx`
Add `?num={ch.chapter}` to both chapter `<Link>` targets:
- the "Start Reading" CTA
- each row in the chapter list

Format: `/manga/${source}/${id}/chapter/${ch.id}?num=${ch.chapter ?? ""}`

### 4. Cleanup
Remove now-unused multi-source attempt logic and `tried`/`attempts`/`succeeded` bookkeeping in `Reader.tsx`. Leave `getChapterPages` exported in `api.ts` (cheap to keep, no callers).

## Out of scope

- Backend `/api/proxy/chapter/:chapterId` implementation (lives in your Railway repo, not this project).
- Route scheme change to `/read/:mangaId/:chapterId` (you chose to keep current routes).

## Risk

Until the new endpoint is deployed on Railway, the reader will return empty pages and show "No pages found". That's expected per your choice to wire the frontend now.
