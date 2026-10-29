import type { ReactNode } from 'react';
import { Award } from 'lucide-react';
import type { Standing } from '../../lib/contest';
import { Card } from '../ui';
import type { Vote } from '../../types';

export default function Leaderboard({ standings, votes }: { standings: Standing[]; votes: Vote[] }) {
  const top = Math.max(1, standings[0]?.points ?? 0);

  if (standings.length === 0) {
    return <Empty>No entries yet.</Empty>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Live from {votes.length} ballot{votes.length === 1 ? '' : 's'} · 1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt · ties break on most 1st-place votes, then 2nds.
      </p>
      <Card className="divide-y divide-white/5 overflow-hidden">
        {standings.map((s) => (
          <div key={s.costume.id} className="relative flex items-center gap-3 px-4 py-3">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600/15 to-orange-500/10 transition-[width] duration-700"
              style={{ width: `${(s.points / top) * 100}%` }}
            />
            <span
              className={`relative grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold ${s.rank === 1 && s.points ? 'bg-amber-400 text-slate-950' : s.rank === 2 && s.points ? 'bg-slate-200 text-slate-950' : s.rank === 3 && s.points ? 'bg-orange-700 text-orange-50' : 'bg-white/5 text-slate-400'}`}
            >
              {s.rank}
            </span>
            <img src={s.costume.photoUrl} alt="" className="relative size-12 shrink-0 rounded-lg object-cover" />
            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-display font-bold text-white">{s.costume.costumeTitle}</span>
                {s.tied && <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-300 uppercase">Tie</span>}
              </div>
              <div className="truncate text-sm text-slate-400">
                #{s.costume.entryNumber} · {s.costume.contestantName}
              </div>
            </div>
            <div className="relative hidden gap-3 text-xs text-slate-400 tabular-nums sm:flex">
              <span title="1st-place votes">🥇 {s.firsts}</span>
              <span title="2nd-place votes">🥈 {s.seconds}</span>
              <span title="3rd-place votes">🥉 {s.thirds}</span>
            </div>
            <div className="relative w-14 text-right">
              <div className="font-display text-xl font-extrabold text-white tabular-nums">{s.points}</div>
              <div className="text-[0.65rem] font-semibold text-slate-500 uppercase">pts</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-slate-500">
      <Award className="size-8" />
      <p>{children}</p>
    </div>
  );
}
