import { useState } from 'react';
import { Eye, Lock, RotateCcw, TriangleAlert } from 'lucide-react';
import { resetReveal, revealPlace } from '../../lib/admin';
import { PLACE_META, type Standing } from '../../lib/contest';
import { Notice, Spinner } from '../ui';
import type { ContestConfig, ContestStatus, Place } from '../../types';

// Announce from the bottom up.
const REVEAL_ORDER: Place[] = ['third', 'second', 'first'];

export default function Ceremony({
  standings,
  config,
  status,
  voteCount,
}: {
  standings: Standing[];
  config: ContestConfig;
  status: ContestStatus;
  voteCount: number;
}) {
  const [busy, setBusy] = useState<Place | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closed = status === 'VOTING_CLOSED';
  const winners: Partial<Record<Place, Standing>> = {
    first: standings[0],
    second: standings[1],
    third: standings[2],
  };
  const places = REVEAL_ORDER.filter((p) => winners[p] && winners[p]!.points > 0);
  const byId = new Map(standings.map((s) => [s.costume.id, s]));
  const anyRevealed = places.some((p) => config.reveal[p]);
  const tiedAtTop = places.some((p) => winners[p]!.tied);

  async function act(key: Place | 'reset', action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch {
      setError('That didn’t save. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!closed && (
        <Notice tone="info">
          Close voting on the Stage tab first. Revealing locks in the current scores, and the TV switches to the podium once voting is closed.
        </Notice>
      )}
      {closed && voteCount === 0 && <Notice tone="info">No ballots were cast, so there's nothing to reveal.</Notice>}
      {closed && tiedAtTop && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          A podium spot is tied on points. The order shown uses the tiebreak (most 1st-place votes, then 2nds) — check the Leaderboard before announcing.
        </div>
      )}
      {error && <Notice>{error}</Notice>}

      <div className="space-y-3">
        {places.map((place, i) => {
          const meta = PLACE_META[place];
          const revealedId = config.reveal[place];
          const revealed = revealedId ? byId.get(revealedId) : undefined;
          const ready = closed && places.slice(0, i).every((p) => config.reveal[p]);

          if (revealed) {
            return (
              <div key={place} className="flex animate-reveal items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                <img src={revealed.costume.photoUrl} alt="" className="size-24 shrink-0 rounded-xl object-cover sm:size-28" />
                <div className="min-w-0 flex-1 space-y-1">
                  <span className={`inline-block rounded-full px-3 py-0.5 font-display text-sm font-extrabold ${meta.chip}`}>{meta.label}</span>
                  <div className="truncate font-display text-2xl font-extrabold text-white">{revealed.costume.costumeTitle}</div>
                  <div className="truncate text-slate-400">
                    {revealed.costume.contestantName} · {revealed.points} pts
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={place}
              type="button"
              disabled={!ready || busy !== null}
              onClick={() => act(place, () => revealPlace(place, winners[place]!.costume.id))}
              className={`group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-10 font-display text-xl font-extrabold transition ${ready ? 'border-orange-400/60 bg-gradient-to-br from-violet-900/40 to-orange-900/20 text-white hover:border-orange-300 hover:from-violet-800/50' : 'border-white/10 bg-slate-900/40 text-slate-600'}`}
            >
              {busy === place ? <Spinner className="size-6" /> : ready ? <Eye className="size-6 text-orange-400 transition group-hover:scale-110" /> : <Lock className="size-5" />}
              {ready ? `Click to reveal ${meta.label}` : meta.label}
            </button>
          );
        })}
      </div>

      {anyRevealed && (
        <button
          type="button"
          onClick={() => act('reset', resetReveal)}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
        >
          {busy === 'reset' ? <Spinner className="size-4" /> : <RotateCcw className="size-4" />} Hide winners again
        </button>
      )}
    </div>
  );
}
