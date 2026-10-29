import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { deleteField, doc, getDoc, serverTimestamp, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { app, db, emulatorHost, storage, useEmulators } from '../firebase';
import type { ContestConfig, Costume, Place, Vote } from '../types';

// Loaded only by the /admin bundle, so guests never download firebase/auth.
const auth = getAuth(app);
if (useEmulators) connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });

/**
 * The host gets an invisible anonymous Firebase session. Entering the right PIN creates admins/{uid},
 * which is what firestore.rules and storage.rules check before allowing stage changes or deletions.
 * The PIN itself lives in adminConfig/secret, which no client can read.
 */
export async function getAdminSession(): Promise<{ uid: string; isAdmin: boolean }> {
  await auth.authStateReady();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  const snap = await getDoc(doc(db, 'admins', user.uid));
  return { uid: user.uid, isAdmin: snap.exists() };
}

export async function claimAdmin(uid: string, pin: string) {
  await setDoc(doc(db, 'admins', uid), { pin, createdAt: serverTimestamp() });
}

export function updateContest(patch: Partial<Omit<ContestConfig, 'reveal'>>, opts: { clearReveal?: boolean } = {}) {
  return setDoc(
    doc(db, 'config', 'contest'),
    opts.clearReveal ? { ...patch, reveal: deleteField() } : patch,
    { merge: true },
  );
}

export function revealPlace(place: Place, costumeId: string) {
  return setDoc(doc(db, 'config', 'contest'), { reveal: { [place]: costumeId } }, { merge: true });
}

export function resetReveal() {
  return setDoc(doc(db, 'config', 'contest'), { reveal: deleteField() }, { merge: true });
}

export async function deleteCostume(costume: Costume) {
  await deleteDoc(doc(db, 'costumes', costume.id));
  if (costume.photoPath) {
    await deleteObject(ref(storage, costume.photoPath)).catch(() => {
      // Already gone or never finished uploading; the entry itself is removed either way.
    });
  }
}

export async function clearVotes(votes: Vote[]) {
  for (let i = 0; i < votes.length; i += 450) {
    const batch = writeBatch(db);
    votes.slice(i, i + 450).forEach((v) => batch.delete(doc(db, 'votes', v.id)));
    await batch.commit();
  }
}
