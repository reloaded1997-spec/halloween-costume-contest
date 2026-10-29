import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { ContestStatus } from '../types';

export function PumpkinMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M30 10c0-4 3-7 7-7" stroke="#65a30d" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="37" rx="28" ry="23" fill="#f97316" />
      <path d="M32 14v46M18 17c-6 8-6 32 0 40M46 17c6 8 6 32 0 40" stroke="#c2410c" strokeWidth="2.5" fill="none" />
      <path d="M19 32l7-5 3 7zM45 32l-7-5-3 7zM20 44c6 7 18 7 24 0l-4 2-3-3-3 3-3-3-3 3-3-3z" fill="#1c1917" />
    </svg>
  );
}

export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-2.5">
      <PumpkinMark className={size === 'lg' ? 'size-12' : 'size-8'} />
      <div className="leading-none">
        <div className={`font-display font-extrabold tracking-tight text-white ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>
          Costume Contest
        </div>
        <div className="mt-1 text-[0.65rem] font-semibold tracking-[0.25em] text-orange-400 uppercase">Halloween Night</div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<ContestStatus, { text: string; className: string }> = {
  SUBMISSIONS_OPEN: { text: 'Entries open', className: 'border-violet-500/40 bg-violet-500/10 text-violet-200' },
  VOTING_OPEN: { text: 'Voting live', className: 'border-orange-500/50 bg-orange-500/15 text-orange-200' },
  VOTING_CLOSED: { text: 'Voting closed', className: 'border-slate-600 bg-slate-800/60 text-slate-300' },
};

export function StatusPill({ status }: { status: ContestStatus }) {
  const { text, className } = STATUS_LABEL[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      <span className={`size-1.5 rounded-full bg-current ${status === 'VOTING_OPEN' ? 'animate-pulse' : ''}`} />
      {text}
    </span>
  );
}

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullScreenSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-950 text-orange-400">
      <Spinner className="size-8" />
    </div>
  );
}

/** Dark ambient backdrop with soft purple and orange glows. */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-slate-950">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-violet-700/25 blur-3xl" />
        <div className="absolute top-1/3 -right-40 size-[26rem] rounded-full bg-orange-600/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 size-[22rem] rounded-full bg-fuchsia-800/15 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/30 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  const styles =
    tone === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-200'
      : 'border-violet-500/40 bg-violet-500/10 text-violet-200';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 font-display text-base font-bold text-slate-950 shadow-lg shadow-orange-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}
