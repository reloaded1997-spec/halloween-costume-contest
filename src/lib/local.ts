/** Per-device state in localStorage. Every access is guarded: private mode can throw. */

const VOTER_ID_KEY = 'halloween_voter_id';
const VOTE_KEY = 'halloween_vote';
const MY_ENTRIES_KEY = 'halloween_my_entries';

export interface SavedVote {
  voterId: string;
  picks: [string, string | null, string | null];
  /** Titles at vote time, so the confirmation still reads well if an entry is later removed. */
  titles: [string, string | null, string | null];
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; the in-memory state still carries this visit.
  }
}

export function getSavedVote(): SavedVote | null {
  if (!read(VOTER_ID_KEY)) return null;
  try {
    const vote = JSON.parse(read(VOTE_KEY) ?? 'null') as SavedVote | null;
    return vote && Array.isArray(vote.picks) ? vote : null;
  } catch {
    return null;
  }
}

export function saveVote(vote: SavedVote) {
  write(VOTE_KEY, JSON.stringify(vote));
  write(VOTER_ID_KEY, vote.voterId);
}

export function getMyEntries(): string[] {
  try {
    const ids = JSON.parse(read(MY_ENTRIES_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function addMyEntry(id: string) {
  write(MY_ENTRIES_KEY, JSON.stringify([...getMyEntries(), id]));
}

/** crypto.randomUUID needs a secure context; phones on a LAN dev URL (http://192.168…) don't have one. */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function' && window.isSecureContext) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
