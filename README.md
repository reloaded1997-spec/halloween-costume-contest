# 🎃 Halloween Costume Contest

A zero-login costume contest for a party: guests scan a QR code, upload a costume photo, and rank their top 3. A TV runs a live slideshow, and the host runs the show from a PIN-protected console.

| Route    | Who          | What                                                                    |
| -------- | ------------ | ----------------------------------------------------------------------- |
| `/`      | Guests       | Submit a costume → rank top 3 → "voting has ended" screen               |
| `/tv`    | The TV       | Fullscreen cross-fading slideshow, QR code, voting banner, winners podium |
| `/admin` | Host         | Stage control, live leaderboard, reveal ceremony, moderation            |

Built with Vite, React 19 + TypeScript, Tailwind CSS v4, Lucide, and Firebase (Firestore, Cloud Storage, Hosting, and anonymous Auth for the host only).

---

## 1. Create the Firebase project (≈10 minutes)

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. **Build → Firestore Database** → *Create database* (production mode, any region).
3. **Build → Storage** → *Get started*. Cloud Storage needs the **Blaze** plan; a one-night party stays well inside the free usage.
4. **Build → Authentication** → *Get started* → **Sign-in method** → enable **Anonymous**.
   Guests never sign in. Only the host console uses this, invisibly, to prove it entered the PIN.
5. **Project settings → Your apps → Web (`</>`)** → register an app and copy the config values.

## 2. Configure the app

```bash
npm install
cp .env.example .env.local   # then paste your Firebase web config into it
```

Set your project id in `.firebaserc`, then log in and deploy the security rules:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

## 3. Set the host PIN

The PIN is checked by the Firestore rules on Google's servers. It is **not** in the JavaScript bundle, where anyone could read it.

In the Firebase console → **Firestore** → *Start collection*:

- Collection ID: `adminConfig`
- Document ID: `secret`
- Field: `pin` (string) = `1031`, or any 4+ digit PIN you like

No client can read or write `adminConfig`. To change the PIN, edit that doc in the console.

## 4. Run it

```bash
npm run dev        # http://localhost:5173 — also on your LAN IP so phones can reach it
npm run deploy     # build + firebase deploy (hosting + rules)
```

After deploying, your app is at `https://<project-id>.web.app`.

**On party night**

1. Open `https://<project-id>.web.app/tv` on the TV (laptop over HDMI, or cast a Chrome tab) and click **Fullscreen**. Cursor and controls hide after 3 s idle, and the screen is kept awake where the browser allows.
2. Open `/admin` on your phone and enter the PIN. The device stays unlocked afterwards.
3. Guests scan the QR code on the TV.
4. **Stage → Unlock Voting** (optionally with an auto-lock timer), then **Close Voting & Tally**.
5. **Reveal** tab: tap 3rd → 2nd → 1st while you announce on the mic. Each reveal flips onto the TV podium and guests' phones.

---

## How it works

### Data model

| Path               | Fields                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `costumes/{id}`    | `contestantName`, `costumeTitle`, `description`, `photoUrl`, `photoPath`, `createdAt`               |
| `votes/{voterId}`  | `voterId`, `firstPlaceId`, `secondPlaceId`, `thirdPlaceId`, `createdAt`                             |
| `config/contest`   | `status` (`SUBMISSIONS_OPEN` \| `VOTING_OPEN` \| `VOTING_CLOSED`), `votingUnlockTime`, `votingLockTime`, `reveal`, `announcement` |
| `admins/{uid}`     | Created when the host enters the correct PIN                                                        |
| `adminConfig/secret` | `{ pin }`, unreadable by clients                                                                  |

Entry numbers are each costume's position in submission order. Deleting an entry renumbers the entries after it.

**Scheduled transitions.** `votingUnlockTime` (set from "Submissions Only → Auto-unlock") and `votingLockTime` (set from "Unlock Voting → Auto-lock") are epoch-ms timestamps. Clients compute the effective status from them, and `firestore.rules` enforces the same logic with server time, so timers fire on schedule even when no host tab is open.

### Security rules

- **Guests (unauthenticated):**
  - Can read costumes and config.
  - Can create a costume only while submissions are open, with validated field lengths, a Storage URL, and a server timestamp.
  - Can create one ballot only while voting is open. The three picks must be distinct and must be existing costumes. Ballots can't be edited or overwritten.
- **Storage:** public read. Uploads must be images under 10 MB, written to `costumes/<id>.jpg`. Only the host can delete.
- **Host:** can change `config`, read votes, and delete costumes and ballots.

**Trade-offs of having no logins:**

- **One vote per device, not per person.** `halloween_voter_id` in `localStorage` gates the UI. A determined guest can clear site data or use a second browser to vote again. That's the usual trade-off for zero-friction party voting. Spot-check the ballot count against your headcount on the Leaderboard.
- **PIN guessing.** A 4-digit PIN can be brute-forced by a determined attacker with anonymous sessions. For a house party it's fine; use 6+ digits if the link is public.

### Image pipeline

Photos are decoded with `createImageBitmap` (respects EXIF rotation), drawn to a canvas that fits within 1920×1080 (or 1080×1920 for portrait shots), and re-encoded as JPEG at 0.8 quality before upload. A typical 4–6 MB phone photo uploads as ~300 KB.

### Scoring

1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt. Ties break on most 1st-place votes, then most 2nds, then the earlier entry. The leaderboard flags exact ties so you can call them out.

---

## Local rehearsal with the emulators

```bash
npm run emulators                 # Firestore, Storage, Auth, Hosting emulators (demo project, no cloud)
npm run seed:emulator -- --demo   # sets PIN 1031 and adds 4 sample entries
npm run dev:emulator              # app wired to the emulators
```

Emulator UI: http://127.0.0.1:4000. Requires Java 21+.

> On one machine, the Firestore emulator (v1.21) under Java 25 accepted connections but never answered document reads or writes. If the app stays on its loading spinner, try running the emulators with a Java 21 JDK (`brew install openjdk@21`, then point `JAVA_HOME` at it).

## Project layout

```
src/
  firebase.ts                 SDK init from .env (+ emulator wiring)
  types.ts                    Costume / Vote / ContestConfig
  lib/
    contest.ts                effectiveStatus(), tally(), place metadata
    hooks.ts                  live onSnapshot hooks (config, costumes, votes)
    api.ts                    guest writes: submitCostume(), castVote()
    admin.ts                  host session + writes (lazy-loaded with /admin)
    image.ts                  canvas compression
    local.ts                  localStorage helpers, id generation
  views/                      GuestView, TvView, AdminView, SetupNotice
  components/guest/           SubmissionForm, VotingBoard, VoteRecorded, VotingClosed
  components/admin/           PinGate, StageController, Leaderboard, Ceremony, EntryModeration
firestore.rules, storage.rules, firebase.json
```
# halloween-costume-contest
