import { useState, type ReactNode } from 'react';
import { CircleCheck, Lock, Timer, Upload, Vote, X } from 'lucide-react';
import { updateContest } from '../../lib/admin';
import { formatCountdown } from '../../lib/contest';
import { Notice, Spinner } from '../ui';
import type { ContestConfig, ContestStatus } from '../../types';

const UNLOCK_OPTIONS = [0, 10, 15, 30, 45, 60];
const LOCK_OPTIONS = [0, 3, 5, 10, 15, 20, 30];

export default function StageController({ config, status, now }: { config: ContestConfig; status: ContestStatus; now: number }) {
  const [unlockIn, setUnlockIn] = useState(0);
  const [lockIn, setLockIn] = useState(0);
  const [busy, setBusy] = useState<ContestStatus | 'timer' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: ContestStatus | 'timer', action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch {
      setError('That change didn’t save. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  const minutes = (m: number) => (m ? Date.now() + m * 60_000 : null);

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}

      <StageCard
        active={status === 'SUBMISSIONS_OPEN'}
        icon={<Upload className="size-5" />}
        title="Submissions Only"
        body="Guests can upload costumes. The TV runs the slideshow with a “Scan to enter” code."
        control={
          <MinutesSelect label="Auto-unlock voting" value={unlockIn} onChange={setUnlockIn} options={UNLOCK_OPTIONS} />
        }
        actionLabel={status === 'SUBMISSIONS_OPEN' ? (unlockIn ? 'Schedule unlock' : 'Active') : 'Reopen submissions'}
        actionDisabled={status === 'SUBMISSIONS_OPEN' && !unlockIn}
        busy={busy === 'SUBMISSIONS_OPEN'}
        onAction={() =>
          run('SUBMISSIONS_OPEN', () =>
            updateContest(
              { status: 'SUBMISSIONS_OPEN', votingUnlockTime: minutes(unlockIn), votingLockTime: null },
              { clearReveal: true },
            ),
          )
        }
        timer={
          status === 'SUBMISSIONS_OPEN' && config.votingUnlockTime ? (
            <TimerRow
              label="Voting unlocks in"
              remaining={config.votingUnlockTime - now}
              busy={busy === 'timer'}
              onCancel={() => run('timer', () => updateContest({ votingUnlockTime: null }))}
            />
          ) : null
        }
      />

      <StageCard
        active={status === 'VOTING_OPEN'}
        icon={<Vote className="size-5" />}
        title="Unlock Voting"
        body="New uploads stop. Guests rank their top 3 and the TV shows the “Voting is open” banner."
        control={<MinutesSelect label="Auto-lock after" value={lockIn} onChange={setLockIn} options={LOCK_OPTIONS} />}
        actionLabel={status === 'VOTING_OPEN' ? (lockIn ? 'Set auto-lock' : 'Active') : 'Unlock voting'}
        actionDisabled={status === 'VOTING_OPEN' && !lockIn}
        busy={busy === 'VOTING_OPEN'}
        onAction={() =>
          run('VOTING_OPEN', () =>
            updateContest({ status: 'VOTING_OPEN', votingUnlockTime: null, votingLockTime: minutes(lockIn) }),
          )
        }
        timer={
          status === 'VOTING_OPEN' && config.votingLockTime ? (
            <TimerRow
              label="Voting locks in"
              remaining={config.votingLockTime - now}
              busy={busy === 'timer'}
              onCancel={() =>
                // A scheduled unlock may be what opened voting, so pin the status explicitly.
                run('timer', () => updateContest({ status: 'VOTING_OPEN', votingUnlockTime: null, votingLockTime: null }))
              }
            />
          ) : null
        }
      />

      <StageCard
        active={status === 'VOTING_CLOSED'}
        icon={<Lock className="size-5" />}
        title="Close Voting & Tally"
        body="Ballots are locked and scores are final. The TV switches to the winners’ podium for the reveal."
        actionLabel={status === 'VOTING_CLOSED' ? 'Active' : 'Close voting'}
        actionDisabled={status === 'VOTING_CLOSED'}
        busy={busy === 'VOTING_CLOSED'}
        onAction={() =>
          run('VOTING_CLOSED', () =>
            updateContest({ status: 'VOTING_CLOSED', votingUnlockTime: null, votingLockTime: null }),
          )
        }
      />
    </div>
  );
}

function StageCard({
  active,
  icon,
  title,
  body,
  control,
  actionLabel,
  actionDisabled,
  busy,
  onAction,
  timer,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  body: string;
  control?: ReactNode;
  actionLabel: string;
  actionDisabled: boolean;
  busy: boolean;
  onAction: () => void;
  timer?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 transition ${active ? 'border-orange-400/60 bg-gradient-to-br from-orange-500/10 to-violet-600/10 shadow-lg shadow-orange-950/40' : 'border-white/10 bg-slate-900/60'}`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${active ? 'bg-orange-500 text-slate-950' : 'bg-white/5 text-slate-300'}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1 basis-56 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            {title}
            {active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                <CircleCheck className="size-3" /> Live
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">{body}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {control}
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled || busy}
            className={`inline-flex min-w-36 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${actionDisabled ? 'cursor-default bg-white/5 text-slate-500' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:brightness-110 active:scale-[0.98]'}`}
          >
            {busy ? <Spinner className="size-4" /> : actionLabel}
          </button>
        </div>
      </div>
      {timer}
    </section>
  );
}

function MinutesSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: number[];
}) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 py-1.5 pr-1.5 pl-3 text-xs font-semibold text-slate-400 sm:flex-none">
      <Timer className="size-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ml-auto rounded-lg bg-slate-800 px-2 py-1 text-sm font-semibold text-white outline-none"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {m ? `in ${m} min` : 'off'}
          </option>
        ))}
      </select>
    </label>
  );
}

function TimerRow({ label, remaining, busy, onCancel }: { label: string; remaining: number; busy: boolean; onCancel: () => void }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-slate-300">
        <Timer className="size-4 text-orange-400" /> {label}
        <b className="font-display text-base text-orange-300 tabular-nums">{formatCountdown(remaining)}</b>
      </span>
      <button type="button" onClick={onCancel} disabled={busy} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
        {busy ? <Spinner className="size-3" /> : <X className="size-3" />} Cancel timer
      </button>
    </div>
  );
}
