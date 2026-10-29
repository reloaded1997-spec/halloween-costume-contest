// Seeds the local emulators with the host PIN (and optional demo entries) for rehearsal.
// Usage: npm run seed:emulator [-- --pin 1031] [-- --demo]
const PROJECT = 'demo-costume-contest';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

const args = process.argv.slice(2);
const pin = args.includes('--pin') ? args[args.indexOf('--pin') + 1] : '1031';

// "Bearer owner" bypasses security rules on the emulator only.
async function put(path, fields) {
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

const str = (v) => ({ stringValue: v });

await put('adminConfig/secret', { pin: str(pin) });
console.log(`Host PIN set to ${pin}`);

if (args.includes('--demo')) {
  const demo = [
    ['Ava', 'Bride of Frankenstein', 'Electrified hair, 1935 energy.', 'https://picsum.photos/seed/bride/1080/1350'],
    ['Marcus', 'Retro Robot', 'Made from 14 cardboard boxes and a colander.', 'https://picsum.photos/seed/robot/1350/1080'],
    ['Priya', 'The Last Witch of Salem', 'Brewed her own fog.', 'https://picsum.photos/seed/witch/1080/1350'],
    ['Leo', 'Moth Man', "It's the lamp. Always the lamp.", 'https://picsum.photos/seed/moth/1080/1350'],
  ];
  const base = Date.now() - 60 * 60 * 1000;
  for (const [i, [name, title, description, url]] of demo.entries()) {
    const id = `demo${i + 1}xxxxx`;
    await put(`costumes/${id}`, {
      contestantName: str(name),
      costumeTitle: str(title),
      description: str(description),
      photoUrl: str(url),
      photoPath: str(`costumes/${id}.jpg`),
      createdAt: { timestampValue: new Date(base + i * 60_000).toISOString() },
    });
  }
  console.log(`Added ${demo.length} demo entries`);
}
