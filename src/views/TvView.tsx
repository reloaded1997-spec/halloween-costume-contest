import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize, Minimize, Sparkles, Timer, Vote } from 'lucide-react';
import { useContestConfig, useCostumes, useNow } from '../lib/hooks';
import { effectiveStatus, formatCountdown, PLACE_META } from '../lib/contest';
import { PumpkinMark } from '../components/ui';
import type { ContestConfig, ContestStatus, Costume, Place } from '../types';

const SLIDE_MS = 9000;
const FADE_MS = 1400;
const GUEST_URL = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '') + '/';

export default function TvView() {
  useTvScale();
  useWakeLock();
  const { config } = useContestConfig();
  const { costumes, loading } = useCostumes();
  const now = useNow(1000);
  const status = effectiveStatus(config, now);
  const idle = useIdle(3000);

  return (
    <div className={`fixed inset-0 overflow-hidden bg-black font-sans text-white select-none ${idle ? 'cursor-none' : ''}`}>
      {status === 'VOTING_CLOSED' ? (
        <CeremonyStage costumes={costumes} reveal={config.reveal} />
      ) : costumes.length > 0 ? (
        <Slideshow costumes={costumes} loading={loading} />
      ) : (
        !loading && <EmptyStage status={status} />
      )}

      {status === 'VOTING_OPEN' && <VotingBanner lockTime={config.votingLockTime} now={now} />}
      {status === 'SUBMISSIONS_OPEN' && config.votingUnlockTime && (
        <div className="absolute top-6 left-6 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm font-semibold text-violet-100 backdrop-blur-md">
          <Timer className="size-4 text-orange-400" />
          Voting opens in <span className="font-display tabular-nums text-orange-300">{formatCountdown(config.votingUnlockTime - now)}</span>
        </div>
      )}
      {status !== 'VOTING_CLOSED' && costumes.length > 0 && <QrCorner status={status} />}
      <FullscreenButton hidden={idle} />
    </div>
  );
}

/* ---------- Slideshow ---------- */

function Slideshow({ costumes, loading }: { costumes: Costume[]; loading: boolean }) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [currentIsFresh, setCurrentIsFresh] = useState(false);
  const known = useRef<Set<string> | null>(null);
  const queue = useRef<string[]>([]);
  const fresh = useRef<Set<string>>(new Set());

  // New arrivals jump the queue so the guest who just uploaded sees themselves within one slide.
  useEffect(() => {
    if (loading) return;
    if (!known.current) {
      known.current = new Set(costumes.map((c) => c.id));
      return;
    }
    for (const c of costumes) {
      if (!known.current.has(c.id)) {
        known.current.add(c.id);
        queue.current.push(c.id);
        fresh.current.add(c.id);
      }
    }
  }, [costumes, loading]);

  // Last slide shown by normal rotation, so the cycle resumes where it left off after a new arrival cuts in.
  const rotation = useRef<string | null>(null);

  const advance = useCallback(() => {
    const ids = costumes.map((c) => c.id);
    if (ids.length === 0) return;
    let next: string | undefined;
    while (queue.current.length && !next) {
      const candidate = queue.current.shift()!;
      if (ids.includes(candidate) && candidate !== currentId) next = candidate;
    }
    if (!next) {
      next = ids[(ids.indexOf(rotation.current ?? currentId ?? '') + 1) % ids.length];
      rotation.current = next;
    }
    if (next === currentId) return;
    setPreviousId(currentId);
    setCurrentId(next);
    setCurrentIsFresh(fresh.current.delete(next));
  }, [costumes, currentId]);

  // Start on the first entry, and recover if the current one is deleted mid-show.
  useEffect(() => {
    if (costumes.length && (!currentId || !costumes.some((c) => c.id === currentId))) {
      setPreviousId(null);
      setCurrentId(costumes[0].id);
      rotation.current = costumes[0].id;
    }
  }, [costumes, currentId]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    if (!currentId) return;
    const timer = setTimeout(() => advanceRef.current(), SLIDE_MS);
    const clearPrev = setTimeout(() => setPreviousId(null), FADE_MS + 100);
    return () => {
      clearTimeout(timer);
      clearTimeout(clearPrev);
    };
  }, [currentId]);

  // Warm the cache for the upcoming photo so the cross-fade never shows a half-loaded image.
  useEffect(() => {
    const ids = costumes.map((c) => c.id);
    const nextId = queue.current[0] ?? ids[(ids.indexOf(rotation.current ?? currentId ?? '') + 1) % ids.length];
    const next = costumes.find((c) => c.id === nextId);
    if (next) new Image().src = next.photoUrl;
  }, [costumes, currentId]);

  const current = costumes.find((c) => c.id === currentId);
  const previous = costumes.find((c) => c.id === previousId);

  return (
    <div className="absolute inset-0">
      {previous && previous.id !== current?.id && <Slide key={`prev-${previous.id}`} costume={previous} total={costumes.length} />}
      {current && <Slide key={current.id} costume={current} total={costumes.length} animate isFresh={currentIsFresh} />}
    </div>
  );
}

function Slide({ costume, total, animate, isFresh }: { costume: Costume; total: number; animate?: boolean; isFresh?: boolean }) {
  return (
    <div className={`absolute inset-0 flex bg-black ${animate ? 'z-10 animate-fade-in' : 'z-0'}`}>
      <div className="relative h-full w-[62%] overflow-hidden">
        <img src={costume.photoUrl} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-3xl" />
        <img src={costume.photoUrl} alt={costume.costumeTitle} className={`relative size-full object-contain ${animate ? 'animate-ken-burns' : ''}`} />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-r from-transparent to-slate-950" />
      </div>

      <div className="relative flex w-[38%] flex-col justify-center bg-slate-950 pr-[4rem] pb-[11rem] pl-[2.5rem]">
        <div aria-hidden="true" className="absolute -top-20 right-0 size-[22rem] rounded-full bg-violet-700/25 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 -left-10 size-[18rem] rounded-full bg-orange-600/15 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-4 py-1.5 font-display text-lg font-bold tracking-wide text-orange-300">
              Entry #{costume.entryNumber}
              <span className="text-orange-300/50"> / {total}</span>
            </span>
            {isFresh && (
              <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-1.5 text-base font-bold">
                <Sparkles className="size-4" /> Just arrived
              </span>
            )}
          </div>

          <h1 className="font-display text-[4.25rem] leading-[0.95] font-extrabold tracking-tight text-balance text-white">
            {costume.costumeTitle}
          </h1>

          <div className="space-y-1">
            <div className="text-sm font-semibold tracking-[0.3em] text-violet-300/80 uppercase">Worn by</div>
            <div className="font-display text-[2.25rem] font-bold text-slate-100">{costume.contestantName}</div>
          </div>

          {costume.description && (
            <p className="line-clamp-4 border-l-2 border-orange-500/60 pl-5 text-[1.5rem] leading-snug text-slate-300 italic">
              {costume.description}
            </p>
          )}
        </div>

        {animate && (
          <div className="absolute right-[19rem] bottom-[2.5rem] left-[2.5rem] h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full origin-left animate-slide-timer bg-gradient-to-r from-violet-500 to-orange-400" style={{ animationDuration: `${SLIDE_MS}ms` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Overlays ---------- */

function QrCorner({ status }: { status: ContestStatus }) {
  const voting = status === 'VOTING_OPEN';
  return (
    <div
      className={`absolute right-[2.5rem] bottom-[2.5rem] z-30 flex items-center gap-4 rounded-2xl border bg-slate-950/85 p-3 pr-5 backdrop-blur-md transition ${voting ? 'animate-banner-glow border-orange-400/60' : 'border-white/10'}`}
    >
      <div className="rounded-xl bg-white p-2">
        <QRCodeSVG value={GUEST_URL} size={128} level="M" marginSize={0} className="size-[7rem]" />
      </div>
      <div className="max-w-[9rem] space-y-1">
        <div className="font-display text-xl leading-tight font-extrabold text-white">{voting ? 'Scan to vote' : 'Scan to enter'}</div>
        <div className="text-sm leading-snug text-slate-400">{voting ? 'Pick your top 3' : 'Upload your costume'}</div>
      </div>
    </div>
  );
}

function VotingBanner({ lockTime, now }: { lockTime: number | null; now: number }) {
  return (
    <div className="absolute inset-x-0 top-[2rem] z-30 flex justify-center px-8">
      <div className="flex animate-banner-glow items-center gap-5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 py-3 pr-8 pl-3 text-slate-950">
        <span className="grid size-12 place-items-center rounded-full bg-slate-950 text-orange-400">
          <Vote className="size-6" />
        </span>
        <span className="font-display text-[1.9rem] font-extrabold tracking-tight">VOTING IS NOW OPEN!</span>
        <span className="text-xl font-semibold">Scan the QR code to pick your top 3.</span>
        {lockTime && (
          <span className="ml-2 rounded-full bg-slate-950/90 px-4 py-1.5 font-display text-lg font-bold text-orange-300 tabular-nums">
            {formatCountdown(lockTime - now)} left
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyStage({ status }: { status: ContestStatus }) {
  const voting = status === 'VOTING_OPEN';
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 size-[30rem] rounded-full bg-violet-700/25 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 size-[26rem] rounded-full bg-orange-600/20 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-[5rem]">
        <div className="space-y-6">
          <PumpkinMark className="size-24 animate-float" />
          <h1 className="font-display text-[5rem] leading-none font-extrabold tracking-tight">
            Costume
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Contest</span>
          </h1>
          <p className="max-w-[28rem] text-[1.6rem] leading-snug text-slate-300">
            {voting ? 'Voting is open — but no entries yet.' : 'Be the first on the big screen. Scan to enter your costume.'}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-orange-900/40">
          <QRCodeSVG value={GUEST_URL} size={256} level="M" marginSize={0} className="size-[18rem]" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Ceremony ---------- */

// Classic podium order: 2nd, 1st, 3rd.
const PODIUM: { place: Place; height: string }[] = [
  { place: 'second', height: 'h-[62%]' },
  { place: 'first', height: 'h-[74%]' },
  { place: 'third', height: 'h-[54%]' },
];

function CeremonyStage({ costumes, reveal }: { costumes: Costume[]; reveal: ContestConfig['reveal'] }) {
  const byId = new Map(costumes.map((c) => [c.id, c]));
  const anyRevealed = Object.values(reveal).some((id) => id && byId.has(id));
  const champion = reveal.first ? byId.get(reveal.first) : undefined;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -top-40 left-1/3 size-[40rem] rounded-full bg-violet-700/25 blur-3xl" />
        <div className={`absolute bottom-0 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-1000 ${champion ? 'bg-amber-500/30' : 'bg-orange-700/15'}`} />
      </div>

      <div className="relative pt-[3.5rem] text-center">
        <div className="text-lg font-semibold tracking-[0.4em] text-orange-400 uppercase">Voting is closed</div>
        <h1 className="mt-2 font-display text-[4.5rem] font-extrabold tracking-tight">
          {champion ? 'Your winners!' : anyRevealed ? 'And the winners are…' : 'The results are in…'}
        </h1>
      </div>

      <div className="relative flex flex-1 items-end justify-center gap-[2.5rem] px-[6rem] pb-[3.5rem]">
        {PODIUM.map(({ place, height }) => {
          const id = reveal[place];
          const costume = id ? byId.get(id) : undefined;
          const meta = PLACE_META[place];
          return (
            <div key={place} className={`flex w-[24rem] flex-col ${height}`}>
              {costume ? (
                <div key={costume.id} className={`flex h-full animate-reveal flex-col overflow-hidden rounded-3xl border-2 bg-slate-900 shadow-2xl ${place === 'first' ? 'border-amber-400 shadow-amber-500/30' : place === 'second' ? 'border-slate-300' : 'border-orange-700'}`}>
                  <div className="relative min-h-0 flex-1 bg-black">
                    <img src={costume.photoUrl} alt={costume.costumeTitle} className="size-full object-cover" />
                    <span className={`absolute top-4 left-4 rounded-full px-4 py-1.5 font-display text-xl font-extrabold ${meta.chip}`}>{meta.label}</span>
                  </div>
                  <div className="space-y-1 p-5">
                    <div className="line-clamp-2 font-display text-[2rem] leading-tight font-extrabold text-balance">{costume.costumeTitle}</div>
                    <div className="truncate text-xl text-slate-400">{costume.contestantName}</div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-white/15 bg-slate-900/50">
                  <span className="animate-pulse font-display text-[8rem] leading-none font-extrabold text-white/15">?</span>
                  <span className={`font-display text-2xl font-bold ${meta.text}`}>{meta.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- TV helpers ---------- */

function FullscreenButton({ hidden }: { hidden: boolean }) {
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  if (!document.fullscreenEnabled) return null;

  const toggle = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});

  return (
    <button
      type="button"
      onClick={toggle}
      className={`absolute top-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-opacity duration-500 hover:bg-black/80 ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    </button>
  );
}

/** Scale rem with viewport width so the layout looks the same on a 1080p panel and a 4K one. */
function useTvScale() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.fontSize;
    root.style.fontSize = 'max(12px, 0.9vw)';
    return () => { root.style.fontSize = previous; };
  }, []);
}

/** Keep the screen from sleeping mid-party where the Screen Wake Lock API exists. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
      }
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, []);
}

function useIdle(ms: number) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [ms]);
  return idle;
}
