import { Lock, Tv } from 'lucide-react';
import { PLACE_META, PLACES } from '../../lib/contest';
import type { SavedVote } from '../../lib/local';
import { Card } from '../ui';
import type { Costume } from '../../types';

export default function VoteRecorded({ vote, costumes }: { vote: SavedVote; costumes: Costume[] }) {
  const byId = new Map(costumes.map((c) => [c.id, c]));
  return (
    <div className="mx-auto max-w-md animate-rise space-y-5 pt-4 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 shadow-lg shadow-violet-900/50">
        <Lock className="size-7 text-white" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white">Vote Recorded!</h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-slate-400">
          <Tv className="size-4" /> Keep an eye on the TV for results.
        </p>
      </div>
      <Card className="divide-y divide-white/5 text-left">
        {PLACES.map((place, i) => {
          const id = vote.picks[i];
          if (!id) return null;
          const costume = byId.get(id);
          const meta = PLACE_META[place];
          return (
            <div key={place} className="flex items-center gap-3 p-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold ${meta.chip}`}>
                {meta.short}
              </span>
              {costume && <img src={costume.photoUrl} alt="" className="size-12 rounded-lg object-cover" />}
              <div className="min-w-0">
                <div className="truncate font-display font-bold text-white">{costume?.costumeTitle ?? vote.titles[i] ?? 'Removed entry'}</div>
                {costume && <div className="truncate text-sm text-slate-400">{costume.contestantName}</div>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
