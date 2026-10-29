import { memo, useCallback, useMemo, useState } from 'react';
import { Expand, Send, Timer, X } from 'lucide-react';
import { castVote } from '../../lib/api';
import { errorCode, formatCountdown, PLACE_META, PLACES } from '../../lib/contest';
import { getMyEntries, saveVote, type SavedVote } from '../../lib/local';
import { Notice, PrimaryButton, Spinner } from '../ui';
import type { Costume } from '../../types';

type Picks = [string | null, string | null, string | null];

export default function VotingBoard({
  costumes,
  votingLockTime,
  now,
  onVoted,
}: {
  costumes: Costume[];
  votingLockTime: number | null;
  now: number;
  onVoted: (vote: SavedVote) => void;
}) {
  const [rawPicks, setPicks] = useState<Picks>([null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Costume | null>(null);
  const myEntries = useMemo(() => new Set(getMyEntries()), []);

  const byId = useMemo(() => new Map(costumes.map((c) => [c.id, c])), [costumes]);
  // Drop picks for entries the host has since removed.
  const picks = useMemo(() => rawPicks.map((id) => (id && byId.has(id) ? id : null)) as Picks, [rawPicks, byId]);
  const required = Math.min(3, costumes.length);
  const filled = picks.filter(Boolean).length;
  const ready = required > 0 && picks.slice(0, required).every(Boolean);

  const toggle = useCallback((id: string) => {
    setHint(null);
    const slot = picks.indexOf(id);
    if (slot >= 0) {
      const next = [...picks] as Picks;
      next[slot] = null;
      setPicks(next);
      return;
    }
    const open = picks.indexOf(null);
    if (open < 0 || open >= required) {
      setHint('All three spots are filled — tap a pick to swap it out.');
      return;
    }
    const next = [...picks] as Picks;
    next[open] = id;
    setPicks(next);
  }, [picks, required]);

  function clearSlot(slot: number) {
    const next = [...picks] as Picks;
    next[slot] = null;
    setPicks(next);
  }

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    // Compact so a ballot never has a gap (e.g. 1st and 3rd but no 2nd).
    const ordered = picks.filter(Boolean) as string[];
    const ballot: SavedVote['picks'] = [ordered[0], ordered[1] ?? null, ordered[2] ?? null];
    try {
      const voterId = await castVote(ballot);
      const vote: SavedVote = {
        voterId,
        picks: ballot,
        titles: ballot.map((id) => (id ? byId.get(id)?.costumeTitle ?? null : null)) as SavedVote['titles'],
      };
      saveVote(vote);
      onVoted(vote);
    } catch (err) {
      setSubmitting(false);
      setError(
        errorCode(err) === 'permission-denied'
          ? "Voting has closed or one of your picks was removed. Refresh to see what's changed."
          : "Your vote didn't go through. Check your connection and try again.",
      );
    }
  }

  if (costumes.length === 0) {
    return <Notice tone="info">Voting is open, but no costumes have been entered yet. Hang tight!</Notice>;
  }

  return (
    <div className="pb-44">
      <div className="mb-5 space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Pick your top {required}</h1>
        <p className="text-slate-400">
          Tap costumes in order: first tap is <b className="text-amber-300">1st (3 pts)</b>, then{' '}
          <b className="text-slate-200">2nd (2 pts)</b>, then <b className="text-orange-400">3rd (1 pt)</b>.
        </p>
        {votingLockTime && (
          <p className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-200">
            <Timer className="size-4" /> Voting closes in <b className="tabular-nums">{formatCountdown(votingLockTime - now)}</b>
          </p>
        )}
      </div>

      <CostumeGrid costumes={costumes} picks={picks} myEntries={myEntries} onToggle={toggle} onExpand={setExpanded} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/90 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pt-3">
          {(hint || error) && <p className={`text-center text-sm ${error ? 'text-red-300' : 'text-amber-200'}`}>{error ?? hint}</p>}
          <div className="grid grid-cols-3 gap-2">
            {PLACES.slice(0, required).map((place, slot) => {
              const costume = picks[slot] ? byId.get(picks[slot]!) : undefined;
              const meta = PLACE_META[place];
              return (
                <button
                  key={place}
                  type="button"
                  onClick={() => costume && clearSlot(slot)}
                  className={`relative flex h-14 items-center gap-2 overflow-hidden rounded-xl border px-2 text-left transition ${costume ? `border-transparent bg-slate-800 ring-2 ${meta.ring}` : 'border-dashed border-white/15 bg-slate-900/60'}`}
                  aria-label={costume ? `${meta.label}: ${costume.costumeTitle}. Tap to remove.` : `${meta.label}: empty`}
                >
                  {costume ? (
                    <>
                      <img src={costume.photoUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0">
                        <span className={`block text-[0.65rem] font-bold uppercase ${meta.text}`}>
                          {meta.short}
                        </span>
                        <span className="block truncate text-xs font-semibold text-white">{costume.costumeTitle}</span>
                      </span>
                      <X className="absolute top-1 right-1 size-3 text-slate-500" />
                    </>
                  ) : (
                    <span className="w-full text-center text-xs font-semibold text-slate-500">
                      {meta.short} · {meta.points} pt{meta.points > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <PrimaryButton type="button" onClick={submit} disabled={!ready || submitting} className="w-full">
            {submitting ? <Spinner /> : <Send className="size-5" />}
            {ready ? 'Lock in my vote' : `Choose ${required - filled} more`}
          </PrimaryButton>
        </div>
      </div>

      {expanded && <Lightbox costume={expanded} onClose={() => setExpanded(null)} />}
    </div>
  );
}

const CostumeGrid = memo(function CostumeGrid({
  costumes,
  picks,
  myEntries,
  onToggle,
  onExpand,
}: {
  costumes: Costume[];
  picks: Picks;
  myEntries: Set<string>;
  onToggle: (id: string) => void;
  onExpand: (c: Costume) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {costumes.map((c) => {
        const slot = picks.indexOf(c.id);
        const meta = slot >= 0 ? PLACE_META[PLACES[slot]] : null;
        return (
          <div key={c.id} className="relative">
            <button
              type="button"
              onClick={() => onToggle(c.id)}
              aria-pressed={slot >= 0}
              className={`block w-full overflow-hidden rounded-2xl border bg-slate-900 text-left transition active:scale-[0.97] ${meta ? `border-transparent ring-3 ${meta.ring} shadow-lg shadow-black/50` : 'border-white/10 hover:border-white/25'}`}
            >
              <div className="relative aspect-[4/5] bg-black">
                <img src={c.photoUrl} alt={c.costumeTitle} loading="lazy" className={`size-full object-cover transition ${meta ? 'brightness-75' : ''}`} />
                <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-300 backdrop-blur">
                  #{c.entryNumber}
                </span>
                {meta && (
                  <span className={`absolute inset-0 m-auto grid size-16 animate-rise place-items-center rounded-full font-display text-xl font-extrabold shadow-xl ${meta.chip}`}>
                    {meta.short}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <div className="truncate font-display font-bold text-white">{c.costumeTitle}</div>
                <div className="truncate text-xs text-slate-400">
                  {c.contestantName}
                  {myEntries.has(c.id) && <span className="ml-1 text-violet-300">· you</span>}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onExpand(c)}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-slate-950/70 text-white backdrop-blur hover:bg-slate-900"
              aria-label={`View ${c.costumeTitle} larger`}
            >
              <Expand className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
});

function Lightbox({ costume, onClose }: { costume: Costume; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={costume.costumeTitle}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-black/95 [animation-duration:200ms]"
      onClick={onClose}
    >
      <button type="button" onClick={onClose} className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Close">
        <X className="size-5" />
      </button>
      <img src={costume.photoUrl} alt={costume.costumeTitle} className="min-h-0 flex-1 object-contain" />
      <div className="space-y-1 px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div className="text-xs font-bold tracking-widest text-orange-400 uppercase">Entry #{costume.entryNumber}</div>
        <div className="font-display text-2xl font-extrabold text-white">{costume.costumeTitle}</div>
        <div className="text-slate-400">{costume.contestantName}</div>
        {costume.description && <p className="pt-1 text-slate-300">{costume.description}</p>}
      </div>
    </div>
  );
}
