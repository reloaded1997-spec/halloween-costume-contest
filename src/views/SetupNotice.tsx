import { Backdrop, Brand, Card } from '../components/ui';

export default function SetupNotice() {
  return (
    <Backdrop>
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10">
        <Brand />
        <Card className="space-y-3 p-6 text-sm text-slate-300">
          <h1 className="font-display text-xl font-bold text-white">Firebase isn't configured yet</h1>
          <p>
            Copy <code className="text-orange-300">.env.example</code> to <code className="text-orange-300">.env.local</code>,
            fill in your Firebase web app credentials, then restart <code className="text-orange-300">npm run dev</code>.
          </p>
          <p>The README walks through creating the project, rules, and the host PIN.</p>
        </Card>
      </main>
    </Backdrop>
  );
}
