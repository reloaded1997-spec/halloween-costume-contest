import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CONFIG } from './contest';
import type { ContestConfig, ContestStatus, Costume, Vote } from '../types';

const STATUSES: ContestStatus[] = ['SUBMISSIONS_OPEN', 'VOTING_OPEN', 'VOTING_CLOSED'];

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

const numOrNull = (v: unknown) => (typeof v === 'number' ? v : null);

export function useContestConfig() {
  const [config, setConfig] = useState<ContestConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(
    () =>
      onSnapshot(
        doc(db, 'config', 'contest'),
        (snap) => {
          const data = snap.data() ?? {};
          setConfig({
            status: STATUSES.includes(data.status) ? data.status : DEFAULT_CONFIG.status,
            votingUnlockTime: numOrNull(data.votingUnlockTime),
            votingLockTime: numOrNull(data.votingLockTime),
            reveal: typeof data.reveal === 'object' && data.reveal ? data.reveal : {},
          });
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err);
          setLoading(false);
        },
      ),
    [],
  );

  return { config, loading, error };
}

/** All entries in submission order, live. New uploads appear without a reload. */
export function useCostumes() {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'costumes'), orderBy('createdAt', 'asc')),
        (snap) => {
          setCostumes(
            snap.docs.map((d, i) => {
              const data = d.data({ serverTimestamps: 'estimate' });
              return {
                id: d.id,
                entryNumber: i + 1,
                contestantName: String(data.contestantName ?? ''),
                costumeTitle: String(data.costumeTitle ?? ''),
                description: String(data.description ?? ''),
                photoUrl: String(data.photoUrl ?? ''),
                photoPath: String(data.photoPath ?? ''),
                createdAt: toMillis(data.createdAt),
              };
            }),
          );
          setLoading(false);
        },
        () => setLoading(false),
      ),
    [],
  );

  return { costumes, loading };
}

/** Votes are only readable by the host (see firestore.rules). */
export function useVotes(enabled: boolean) {
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(collection(db, 'votes'), (snap) =>
      setVotes(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            voterId: String(data.voterId ?? d.id),
            firstPlaceId: String(data.firstPlaceId ?? ''),
            secondPlaceId: data.secondPlaceId ?? null,
            thirdPlaceId: data.thirdPlaceId ?? null,
            createdAt: toMillis(data.createdAt),
          };
        }),
      ),
    );
  }, [enabled]);

  return votes;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
