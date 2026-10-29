import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase';
import { newId } from './local';

export interface CostumeSubmission {
  contestantName: string;
  costumeTitle: string;
  description: string;
  photo: Blob;
}

/** Uploads the (already compressed) photo, then creates the costume doc. Resolves with the new entry's id. */
export async function submitCostume(
  entry: CostumeSubmission,
  onUploadProgress: (fraction: number) => void,
): Promise<string> {
  const id = newId();
  const photoPath = `costumes/${id}.jpg`;

  const task = uploadBytesResumable(ref(storage, photoPath), entry.photo, {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000, immutable',
  });
  task.on('state_changed', (snap) => onUploadProgress(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0));
  await task;

  const photoUrl = await getDownloadURL(task.snapshot.ref);
  await setDoc(doc(db, 'costumes', id), {
    contestantName: entry.contestantName.trim(),
    costumeTitle: entry.costumeTitle.trim(),
    description: entry.description.trim(),
    photoUrl,
    photoPath,
    createdAt: serverTimestamp(),
  });
  return id;
}

/** One ballot per device: the doc id is the voter id and the rules forbid overwriting it. */
export async function castVote(picks: [string, string | null, string | null]): Promise<string> {
  const voterId = newId();
  await setDoc(doc(db, 'votes', voterId), {
    voterId,
    firstPlaceId: picks[0],
    secondPlaceId: picks[1],
    thirdPlaceId: picks[2],
    createdAt: serverTimestamp(),
  });
  return voterId;
}
