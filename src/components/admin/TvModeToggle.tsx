import { useState } from 'react';
import { Feather, Gauge, Sparkles, Tv } from 'lucide-react';
import { updateContest } from '../../lib/admin';
import { Notice, Spinner } from '../ui';
import type { TvMode } from '../../types';

const MODES: { mode: TvMode; label: string; hint: string; Icon: typeof Tv }[] = [
  { mode: 'full', label: 'Full', hint: 'Zoom, blur and full-size photos', Icon: Sparkles },
  { mode: 'lite', label: 'Lite', hint: 'No effects, smaller photos', Icon: Feather },
];

const PACES: { seconds: number; label: string }[] = [
  { seconds: 5, label: 'Fast' },
  { seconds: 9, label: 'Normal' },
  { seconds: 15, label: 'Relaxed' },
  { seconds: 25, label: 'Slow' },
];

type Pending = { tvMode: TvMode } | { slideSeconds: number };

export default function TvModeToggle({ tvMode, slideSeconds }: { tvMode: TvMode; slideSeconds: number }) {
  const [busy, setBusy] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Pending) {
    if (busy) return;
    setBusy(patch);
    setError(null);
    try {
      await updateContest(patch);
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
              onClick={() => mode !== tvMode && save({ tvMode: mode })}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {busy && 'tvMode' in busy && busy.tvMode === mode ? <Spinner className="size-4 shrink-0" /> : <Icon className="size-4 shrink-0" />}
              <span className="min-w-0">
                <span className="block text-sm font-bold">{label}</span>
                <span className={`block text-xs ${active ? 'text-slate-900/75' : 'text-slate-500'}`}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Gauge className="size-4 text-sky-300" /> Slide pacing
        </h3>
        <span className="text-xs text-slate-500">Each photo stays up {slideSeconds}s</span>
      </div>
      <div role="radiogroup" aria-label="Slide pacing" className="grid grid-cols-4 gap-2 rounded-xl bg-slate-950/60 p-1.5">
        {PACES.map(({ seconds, label }) => {
          const active = seconds === slideSeconds;
          return (
            <button
              key={seconds}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => !active && save({ slideSeconds: seconds })}
              className={`flex flex-col items-center rounded-lg px-2 py-2.5 transition ${active ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                {busy && 'slideSeconds' in busy && busy.slideSeconds === seconds && <Spinner className="size-3.5" />}
                {label}
              </span>
              <span className={`text-xs tabular-nums ${active ? 'text-slate-900/75' : 'text-slate-500'}`}>{seconds}s</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
