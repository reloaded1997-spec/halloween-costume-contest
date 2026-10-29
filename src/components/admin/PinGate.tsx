import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { claimAdmin } from '../../lib/admin';
import { errorCode } from '../../lib/contest';
import { Backdrop, Brand, Card, Notice, PrimaryButton, Spinner } from '../ui';

export default function PinGate({ uid, onUnlocked }: { uid: string; onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return;
    setChecking(true);
    setError(null);
    try {
      // The rules accept this write only if the PIN matches adminConfig/secret.
      await claimAdmin(uid, pin);
      onUnlocked();
    } catch (err) {
      setChecking(false);
      setPin('');
      setError(errorCode(err) === 'permission-denied' ? 'Wrong PIN. Try again.' : "Couldn't check the PIN. Check your connection.");
    }
  }

  return (
    <Backdrop>
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-5 py-10">
        <div className="flex justify-center">
          <Brand size="lg" />
        </div>
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-violet-500/15 text-violet-300">
                <KeyRound className="size-6" />
              </div>
              <h1 className="font-display text-xl font-bold text-white">Host console</h1>
              <p className="text-sm text-slate-400">Enter the host PIN to manage the contest.</p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              aria-label="Host PIN"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-4 text-center font-display text-3xl tracking-[0.6em] text-white outline-none focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/20"
            />
            {error && <Notice>{error}</Notice>}
            <PrimaryButton type="submit" disabled={pin.length < 4 || checking} className="w-full">
              {checking ? <Spinner /> : 'Unlock'}
            </PrimaryButton>
          </form>
        </Card>
      </main>
    </Backdrop>
  );
}
