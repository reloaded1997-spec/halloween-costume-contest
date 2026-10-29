import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { clearVotes, deleteCostume } from '../../lib/admin';
import type { Standing } from '../../lib/contest';
import { Notice, Spinner } from '../ui';
import { Empty } from './Leaderboard';
import type { Costume, Vote } from '../../types';

export default function EntryModeration({ costumes, standings, votes }: { costumes: Costume[]; standings: Standing[]; votes: Vote[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const points = new Map(standings.map((s) => [s.costume.id, s.points]));

  async function act(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      setConfirming(null);
    } catch {
      setError('That didn’t go through. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Notice>{error}</Notice>}

      {costumes.length === 0 ? (
        <Empty>No entries yet.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {costumes.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
              <div className="relative aspect-square bg-black">
                <img src={c.photoUrl} alt={c.costumeTitle} loading="lazy" className="size-full object-cover" />
                <span className="absolute top-2 left-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-xs font-bold text-slate-300">#{c.entryNumber}</span>
                <span className="absolute top-2 right-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-xs font-bold text-orange-300">{points.get(c.id) ?? 0} pts</span>
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <div className="truncate font-display font-bold text-white">{c.costumeTitle}</div>
                  <div className="truncate text-xs text-slate-400">{c.contestantName}</div>
                </div>
                {confirming === c.id ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => act(c.id, () => deleteCostume(c))}
                      disabled={busy !== null}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white hover:bg-red-500"
                    >
                      {busy === c.id ? <Spinner className="size-3.5" /> : 'Delete'}
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10">
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(c.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs font-semibold text-slate-400 hover:border-red-500/50 hover:text-red-300"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-red-500/20 bg-red-950/10 p-5">
        <div>
          <h2 className="font-display font-bold text-white">Reset ballots</h2>
          <p className="text-sm text-slate-400">
            Deletes all {votes.length} ballot{votes.length === 1 ? '' : 's'} — use after a test run. Phones that already voted keep their
            “vote recorded” screen until their browser storage is cleared.
          </p>
        </div>
        {confirming === 'votes' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => act('votes', () => clearVotes(votes))}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
            >
              {busy === 'votes' ? <Spinner className="size-4" /> : <Trash2 className="size-4" />} Yes, delete every ballot
            </button>
            <button type="button" onClick={() => setConfirming(null)} className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming('votes')}
            disabled={votes.length === 0}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
          >
            Delete all ballots
          </button>
        )}
      </section>
    </div>
  );
}
