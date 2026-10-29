export type ContestStatus = 'SUBMISSIONS_OPEN' | 'VOTING_OPEN' | 'VOTING_CLOSED';

export type Place = 'first' | 'second' | 'third';

/** Firestore: config/contest */
export interface ContestConfig {
  status: ContestStatus;
  /** Epoch ms. While submissions are open, voting unlocks automatically at this time. */
  votingUnlockTime: number | null;
  /** Epoch ms. While voting is open, voting locks automatically at this time. */
  votingLockTime: number | null;
  /** Costume ids the host has revealed during the ceremony. */
  reveal: Partial<Record<Place, string>>;
  /** Message from the host, shown on the TV slides and guests' phones. Empty when there is none. */
  announcement: string;
  /** 'lite' drops the TV's zoom/blur effects and shows the small photo copies, for slow TV browsers. */
  tvMode: TvMode;
}

export type TvMode = 'full' | 'lite';

/** Firestore: costumes/{id} */
export interface Costume {
  id: string;
  /** Position in submission order (1-based); not stored. */
  entryNumber: number;
  contestantName: string;
  costumeTitle: string;
  description: string;
  photoUrl: string;
  photoPath: string;
  /** ~960×540 copy; empty for entries uploaded before small copies existed. */
  thumbUrl: string;
  thumbPath: string;
  createdAt: number;
}

/** Firestore: votes/{voterId} */
export interface Vote {
  id: string;
  voterId: string;
  firstPlaceId: string;
  secondPlaceId: string | null;
  thirdPlaceId: string | null;
  createdAt: number;
}
