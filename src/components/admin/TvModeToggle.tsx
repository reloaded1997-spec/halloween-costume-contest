import { useState } from 'react';
import { Feather, Sparkles, Tv } from 'lucide-react';
import { updateContest } from '../../lib/admin';
import { Notice, Spinner } from '../ui';
import type { TvMode } from '../../types';

const MODES: { mode: TvMode; label: string; hint: string; Icon: typeof Tv }[] = [
  { mode: 'full', label: 'Full', hint: 'Zoom, blur and full-size photos', Icon: Sparkles },
  { mode: 'lite', label: 'Lite', hint: 'No effects, smaller photos', Icon: Feather },
];

export default function TvModeToggle({ tvMode }: { tvMode: TvMode }) {
  const [busy, setBusy] = useState<TvMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(mode: TvMode) {
    if (mode === tvMode || busy) return;
    setBusy(mode);
    setError(null);
    try {
      await updateContest({ tvMode: mode });
    } catch {
      setError('That change didn’t save. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
          <Tv className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-white">TV display</h2>
          <p className="text-sm text-slate-400">Switch to Lite if the slideshow stutters or photos load slowly on the TV.</p>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      <div role="radiogroup" aria-label="TV display mode" className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/60 p-1.5">
        {MODES.map(({ mode, label, hint, Icon }) => {
          const active = mode === tvMode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(mode)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {busy === mode ? <Spinner className="size-4 shrink-0" /> : <Icon className="size-4 shrink-0" />}
              <span className="min-w-0">
                <span className="block text-sm font-bold">{label}</span>
                <span className={`block text-xs ${active ? 'text-slate-900/75' : 'text-slate-500'}`}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
