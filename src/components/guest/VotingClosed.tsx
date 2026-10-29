import { Tv, Trophy } from 'lucide-react';
import { PLACE_META, PLACES } from '../../lib/contest';
import { Card } from '../ui';
import type { ContestConfig, Costume } from '../../types';

export default function VotingClosed({ costumes, reveal }: { costumes: Costume[]; reveal: ContestConfig['reveal'] }) {
  const byId = new Map(costumes.map((c) => [c.id, c]));
  const revealed = PLACES.filter((p) => reveal[p] && byId.has(reveal[p]!));

  return (
    <div className="mx-auto max-w-md animate-rise space-y-6 pt-6 text-center">
      <div className="mx-auto grid size-20 animate-float place-items-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 shadow-xl shadow-orange-900/50">
        <Trophy className="size-9 text-slate-950" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold text-white">Voting has ended!</h1>
        <p className="flex items-center justify-center gap-2 text-slate-300">
          <Tv className="size-4 shrink-0" /> Gather around the TV to see the winners announced.
        </p>
      </div>

      {revealed.length > 0 && (
        <Card className="divide-y divide-white/5 text-left">
          {revealed.map((place) => {
            const costume = byId.get(reveal[place]!)!;
            const meta = PLACE_META[place];
            return (
              <div key={place} className="flex animate-rise items-center gap-3 p-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold ${meta.chip}`}>
                  {meta.short}
                </span>
                <img src={costume.photoUrl} alt="" className="size-12 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="truncate font-display font-bold text-white">{costume.costumeTitle}</div>
                  <div className="truncate text-sm text-slate-400">{costume.contestantName}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
