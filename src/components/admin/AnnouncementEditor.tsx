import { useState } from 'react';
import { Megaphone, Send, X } from 'lucide-react';
import { updateContest } from '../../lib/admin';
import { ANNOUNCEMENT_MAX } from '../../lib/contest';
import { Notice, Spinner } from '../ui';

export default function AnnouncementEditor({ announcement }: { announcement: string }) {
  const [draft, setDraft] = useState(announcement);
  const [busy, setBusy] = useState<'post' | 'clear' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = draft.trim();
  const unchanged = trimmed === announcement;

  async function save(kind: 'post' | 'clear', text: string) {
    setBusy(kind);
    setError(null);
    try {
      await updateContest({ announcement: text });
      setDraft(text);
    } catch {
      setError('That message didn’t save. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <Megaphone className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-white">Announcement</h2>
          <p className="text-sm text-slate-400">Shown on every TV slide and at the top of guests’ phones until you clear it.</p>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      {announcement && (
        <div className="flex items-start gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          <span className="mt-0.5 shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">Live</span>
          <span className="min-w-0 break-words">{announcement}</span>
        </div>
      )}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed && !unchanged) save('post', trimmed);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, ANNOUNCEMENT_MAX))}
          rows={2}
          placeholder="e.g. Pizza is here! Grab a slice in the kitchen 🍕"
          className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-xs text-slate-500 tabular-nums">
            {draft.length}/{ANNOUNCEMENT_MAX}
          </span>
          {announcement && (
            <button
              type="button"
              onClick={() => save('clear', '')}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {busy === 'clear' ? <Spinner className="size-4" /> : <X className="size-4" />} Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!trimmed || unchanged || !!busy}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:bg-none disabled:bg-white/5 disabled:text-slate-500"
          >
            {busy === 'post' ? <Spinner className="size-4" /> : <Send className="size-4" />}
            {announcement ? 'Update message' : 'Post message'}
          </button>
        </div>
      </form>
    </section>
  );
}
