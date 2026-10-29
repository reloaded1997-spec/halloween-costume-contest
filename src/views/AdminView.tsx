import { useEffect, useMemo, useState } from 'react';
import { Award, ExternalLink, Images, LayoutDashboard, Sparkles } from 'lucide-react';
import { getAdminSession } from '../lib/admin';
import { effectiveStatus, errorCode, tally } from '../lib/contest';
import { useContestConfig, useCostumes, useNow, useVotes } from '../lib/hooks';
import { Backdrop, Brand, FullScreenSpinner, Notice, StatusPill } from '../components/ui';
import PinGate from '../components/admin/PinGate';
import StageController from '../components/admin/StageController';
import Leaderboard from '../components/admin/Leaderboard';
import Ceremony from '../components/admin/Ceremony';
import EntryModeration from '../components/admin/EntryModeration';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';

type Session = { state: 'loading' } | { state: 'locked'; uid: string } | { state: 'admin' } | { state: 'error'; message: string };

export default function AdminView() {
  const [session, setSession] = useState<Session>({ state: 'loading' });

  useEffect(() => {
    getAdminSession()
      .then(({ uid, isAdmin }) => setSession(isAdmin ? { state: 'admin' } : { state: 'locked', uid }))
      .catch((err) =>
        setSession({
          state: 'error',
          message:
            errorCode(err) === 'auth/admin-restricted-operation' || errorCode(err) === 'auth/operation-not-allowed'
              ? 'Anonymous sign-in is turned off for this Firebase project. Enable it under Authentication → Sign-in method.'
              : "Couldn't start a host session. Check your connection and Firebase config.",
        }),
      );
  }, []);

  if (session.state === 'loading') return <FullScreenSpinner />;
  if (session.state === 'error') {
    return (
      <Backdrop>
        <main className="mx-auto max-w-md space-y-6 px-5 py-16">
          <Brand />
          <Notice>{session.message}</Notice>
        </main>
      </Backdrop>
    );
  }
  if (session.state === 'locked') return <PinGate uid={session.uid} onUnlocked={() => setSession({ state: 'admin' })} />;
  return <Dashboard />;
}

const TABS = [
  { id: 'stage', label: 'Stage', icon: LayoutDashboard },
  { id: 'results', label: 'Leaderboard', icon: Award },
  { id: 'reveal', label: 'Reveal', icon: Sparkles },
  { id: 'entries', label: 'Entries', icon: Images },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Dashboard() {
  const [tab, setTab] = useState<TabId>('stage');
  const { config } = useContestConfig();
  const { costumes } = useCostumes();
  const votes = useVotes(true);
  const now = useNow(1000);
  const status = effectiveStatus(config, now);
  const standings = useMemo(() => tally(costumes, votes), [costumes, votes]);

  return (
    <Backdrop>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-bold tracking-wider text-violet-300 uppercase">Host</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            <a href="/tv" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/5">
              TV <ExternalLink className="size-3" />
            </a>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/5">
              Guest <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Host sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Entries" value={costumes.length} />
          <Stat label="Ballots" value={votes.length} />
          <Stat label="Points cast" value={standings.reduce((sum, s) => sum + s.points, 0)} />
        </div>

        {tab === 'stage' && (
          <div className="space-y-4">
            <StageController config={config} status={status} now={now} />
            <AnnouncementEditor announcement={config.announcement} />
          </div>
        )}
        {tab === 'results' && <Leaderboard standings={standings} votes={votes} />}
        {tab === 'reveal' && <Ceremony standings={standings} config={config} status={status} voteCount={votes.length} />}
        {tab === 'entries' && <EntryModeration costumes={costumes} standings={standings} votes={votes} />}
      </main>
    </Backdrop>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</div>
      <div className="font-display text-2xl font-extrabold text-white tabular-nums">{value}</div>
    </div>
  );
}
