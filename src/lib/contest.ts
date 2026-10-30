import type { ContestConfig, ContestStatus, Costume, Place, Vote } from '../types';

export const DEFAULT_CONFIG: ContestConfig = {
  status: 'SUBMISSIONS_OPEN',
  votingUnlockTime: null,
  votingLockTime: null,
  reveal: {},
  announcement: '',
  tvMode: 'full',
  slideSeconds: 9,
};

export const SLIDE_SECONDS_MIN = 3;
export const SLIDE_SECONDS_MAX = 60;

/** The small copy when there is one (older entries only have the full photo). */
export const smallPhoto = (c: Costume) => c.thumbUrl || c.photoUrl;

export const ANNOUNCEMENT_MAX = 200;

export const PLACES: readonly Place[] = ['first', 'second', 'third'];

export const PLACE_META: Record<Place, { label: string; short: string; points: number; ring: string; chip: string; text: string }> = {
  first: { label: '1st Place', short: '1st', points: 3, ring: 'ring-amber-400', chip: 'bg-amber-400 text-slate-950', text: 'text-amber-300' },
  second: { label: '2nd Place', short: '2nd', points: 2, ring: 'ring-slate-300', chip: 'bg-slate-200 text-slate-950', text: 'text-slate-300' },
  third: { label: '3rd Place', short: '3rd', points: 1, ring: 'ring-orange-700', chip: 'bg-orange-700 text-orange-50', text: 'text-orange-400' },
};

/**
 * The status that is actually in effect, applying scheduled unlock/lock times.
 * firestore.rules applies the same logic server-side, so timers work with no host tab open.
 */
export function effectiveStatus(config: ContestConfig, now: number): ContestStatus {
  let status = config.status;
  if (status === 'SUBMISSIONS_OPEN' && config.votingUnlockTime != null && now >= config.votingUnlockTime) {
    status = 'VOTING_OPEN';
  }
  if (status === 'VOTING_OPEN' && config.votingLockTime != null && now >= config.votingLockTime) {
    status = 'VOTING_CLOSED';
  }
  return status;
}

export interface Standing {
  costume: Costume;
  points: number;
  firsts: number;
  seconds: number;
  thirds: number;
  rank: number;
  /** True when another entry has identical points and tiebreakers. */
  tied: boolean;
}

/** Weighted score: 1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt. Ties break on most 1sts, then 2nds, then earliest entry. */
export function tally(costumes: Costume[], votes: Vote[]): Standing[] {
  const byId = new Map<string, Standing>(
    costumes.map((costume) => [costume.id, { costume, points: 0, firsts: 0, seconds: 0, thirds: 0, rank: 0, tied: false }]),
  );

  for (const vote of votes) {
    const first = byId.get(vote.firstPlaceId);
    if (first) { first.points += 3; first.firsts += 1; }
    const second = vote.secondPlaceId ? byId.get(vote.secondPlaceId) : undefined;
    if (second) { second.points += 2; second.seconds += 1; }
    const third = vote.thirdPlaceId ? byId.get(vote.thirdPlaceId) : undefined;
    if (third) { third.points += 1; third.thirds += 1; }
  }

  const standings = [...byId.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.firsts - a.firsts ||
      b.seconds - a.seconds ||
      a.costume.createdAt - b.costume.createdAt,
  );

  const sameScore = (a: Standing, b: Standing | undefined) =>
    !!b && a.points === b.points && a.firsts === b.firsts && a.seconds === b.seconds;

  standings.forEach((s, i) => {
    s.rank = i + 1;
    s.tied = s.points > 0 && (sameScore(s, standings[i - 1]) || sameScore(s, standings[i + 1]));
  });
  return standings;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function errorCode(err: unknown): string | undefined {
  return typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : undefined;
}
