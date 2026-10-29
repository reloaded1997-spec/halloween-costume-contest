import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Camera, CircleCheck, Hourglass, ImagePlus, RotateCcw, Sparkles } from 'lucide-react';
import { submitCostume } from '../../lib/api';
import { errorCode, formatCountdown } from '../../lib/contest';
import { compressImage } from '../../lib/image';
import { addMyEntry } from '../../lib/local';
import { Card, Notice, PrimaryButton, Spinner } from '../ui';
import type { Costume } from '../../types';

interface Photo {
  blob: Blob;
  url: string;
  originalBytes: number;
}

type Phase =
  | { kind: 'form' }
  | { kind: 'sending'; step: 'upload' | 'save'; progress: number }
  | { kind: 'done'; id: string };

const DESCRIPTION_MAX = 280;

export default function SubmissionForm({
  costumes,
  votingUnlockTime,
  now,
}: {
  costumes: Costume[];
  votingUnlockTime: number | null;
  now: number;
}) {
  const [contestantName, setContestantName] = useState('');
  const [costumeTitle, setCostumeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/') && file.type !== '') {
      setError('Please choose a photo.');
      return;
    }
    setProcessing(true);
    try {
      const { blob } = await compressImage(file);
      setPhoto({ blob, url: URL.createObjectURL(blob), originalBytes: file.size });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that photo.");
    } finally {
      setProcessing(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photo || !contestantName.trim() || !costumeTitle.trim()) return;
    setError(null);
    setPhase({ kind: 'sending', step: 'upload', progress: 0 });
    try {
      const id = await submitCostume(
        { contestantName, costumeTitle, description, photo: photo.blob },
        (progress) => setPhase({ kind: 'sending', step: progress >= 1 ? 'save' : 'upload', progress }),
      );
      addMyEntry(id);
      setPhase({ kind: 'done', id });
    } catch (err) {
      setPhase({ kind: 'form' });
      setError(
        errorCode(err)?.endsWith('unauthorized') || errorCode(err) === 'permission-denied'
          ? 'Entries just closed — voting is about to start!'
          : 'Upload failed. Check your connection and try again.',
      );
    }
  }

  function startAnother() {
    setContestantName('');
    setCostumeTitle('');
    setDescription('');
    setPhoto(null);
    setPhase({ kind: 'form' });
  }

  if (phase.kind === 'done') {
    const entry = costumes.find((c) => c.id === phase.id);
    return (
      <div className="space-y-4">
        <CountdownBanner votingUnlockTime={votingUnlockTime} now={now} />
        <Card className="animate-rise overflow-hidden">
          {photo && <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />}
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-sm font-bold text-emerald-300">
              <CircleCheck className="size-4" />
              {entry ? `Entry #${entry.entryNumber} Received` : 'Entry Received'}
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white">{costumeTitle.trim()}</h2>
            <p className="text-slate-400">You're in the running. Watch for your costume on the TV slideshow!</p>
            <button
              type="button"
              onClick={startAnother}
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-200"
            >
              <RotateCcw className="size-4" /> Enter another costume
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const sending = phase.kind === 'sending';
  const canSubmit = !!photo && !!contestantName.trim() && !!costumeTitle.trim() && !sending && !processing;

  return (
    <div className="space-y-5">
      <CountdownBanner votingUnlockTime={votingUnlockTime} now={now} />

      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Enter your costume</h1>
        <p className="mt-1 text-slate-400">
          Snap a photo, give it a name, and you're on the big screen.
          {costumes.length > 0 && <span className="text-slate-300"> {costumes.length} entered so far.</span>}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onFileChosen(e.target.files?.[0])}
          disabled={sending}
          aria-label="Costume photo"
        />

        {photo ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
            <img src={photo.url} alt="Your costume preview" className="max-h-[60vh] w-full object-contain" />
            {!sending && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-slate-900"
              >
                <Camera className="size-4" /> Retake
              </button>
            )}
            <div className="absolute top-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[0.7rem] font-medium text-slate-300 backdrop-blur">
              {formatBytes(photo.originalBytes)} → {formatBytes(photo.blob.size)}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={processing}
            className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-500/40 bg-violet-950/20 text-violet-200 transition hover:border-orange-400/60 hover:bg-violet-900/20"
          >
            {processing ? (
              <>
                <Spinner className="size-8 text-orange-400" />
                <span className="text-sm font-medium">Optimizing photo…</span>
              </>
            ) : (
              <>
                <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-900/50 transition group-hover:scale-105">
                  <ImagePlus className="size-7" />
                </span>
                <span className="font-display text-lg font-bold text-white">Add a costume photo</span>
                <span className="text-sm text-slate-400">Take one now or pick from your gallery</span>
              </>
            )}
          </button>
        )}

        <Field label="Your name" value={contestantName} onChange={setContestantName} max={60} placeholder="Morticia A." disabled={sending} autoComplete="name" />
        <Field label="Costume title" value={costumeTitle} onChange={setCostumeTitle} max={80} placeholder="The Ghost of Prom Night Past" disabled={sending} />
        <Field
          label="Backstory"
          optional
          multiline
          value={description}
          onChange={setDescription}
          max={DESCRIPTION_MAX}
          placeholder="One line the crowd should know…"
          disabled={sending}
        />

        {error && <Notice>{error}</Notice>}

        {sending ? (
          <UploadProgress step={phase.step} progress={phase.progress} />
        ) : (
          <PrimaryButton type="submit" disabled={!canSubmit} className="w-full">
            <Sparkles className="size-5" /> Submit my costume
          </PrimaryButton>
        )}
      </form>
    </div>
  );
}

function CountdownBanner({ votingUnlockTime, now }: { votingUnlockTime: number | null; now: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-slate-900/40 px-4 py-3 text-sm">
      <Hourglass className="size-5 shrink-0 text-orange-400" />
      {votingUnlockTime ? (
        <p className="text-violet-100">
          Voting unlocks in{' '}
          <span className="font-display text-base font-bold text-orange-300 tabular-nums">
            {formatCountdown(votingUnlockTime - now)}
          </span>
        </p>
      ) : (
        <p className="text-violet-100">Voting opens later tonight — keep an eye on the TV.</p>
      )}
    </div>
  );
}

function UploadProgress({ step, progress }: { step: 'upload' | 'save'; progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/80 p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-200">
          <Spinner className="size-4 text-orange-400" />
          {step === 'upload' ? 'Uploading photo…' : 'Saving your entry…'}
        </span>
        <span className="font-semibold text-orange-300 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-orange-500 to-amber-400 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  max,
  placeholder,
  optional,
  multiline,
  disabled,
  autoComplete = 'off',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  const className =
    'w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold text-slate-200">
        <span>
          {label} {optional && <span className="font-normal text-slate-500">(optional)</span>}
        </span>
        {multiline && <span className="text-xs font-normal text-slate-500 tabular-nums">{value.length}/{max}</span>}
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={3} placeholder={placeholder} disabled={disabled} className={`${className} resize-none`} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} placeholder={placeholder} disabled={disabled} autoComplete={autoComplete} required={!optional} className={className} />
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
