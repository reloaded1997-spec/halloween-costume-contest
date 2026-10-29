import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase';
import { newId } from './local';

export interface CostumeSubmission {
  contestantName: string;
  costumeTitle: string;
  description: string;
  photo: Blob;
  /** Small copy for the TV's lite mode and thumbnails. */
  smallPhoto: Blob;
}

/** Uploads the (already compressed) photos, then creates the costume doc. Resolves with the new entry's id. */
export async function submitCostume(
  entry: CostumeSubmission,
  onUploadProgress: (fraction: number) => void,
): Promise<string> {
  const id = newId();
  const photoPath = `costumes/${id}.jpg`;
  const thumbPath = `costumes/${id}_small.jpg`;

  // Both files upload together; progress is reported over their combined size.
  const totalBytes = entry.photo.size + entry.smallPhoto.size;
  const sent = new Map<string, number>();
  const upload = (path: string, blob: Blob) => {
    const task = uploadBytesResumable(ref(storage, path), blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    });
    task.on('state_changed', (snap) => {
      sent.set(path, snap.bytesTransferred);
      onUploadProgress(totalBytes ? Math.min(1, [...sent.values()].reduce((a, b) => a + b, 0) / totalBytes) : 0);
    });
    return task.then((snap) => getDownloadURL(snap.ref));
  };
  const [photoUrl, thumbUrl] = await Promise.all([upload(photoPath, entry.photo), upload(thumbPath, entry.smallPhoto)]);

  await setDoc(doc(db, 'costumes', id), {
    contestantName: entry.contestantName.trim(),
    costumeTitle: entry.costumeTitle.trim(),
    description: entry.description.trim(),
    photoUrl,
    photoPath,
    thumbUrl,
    thumbPath,
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
