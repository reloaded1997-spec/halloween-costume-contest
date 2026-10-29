import { useState } from 'react';
import { useContestConfig, useCostumes, useNow } from '../lib/hooks';
import { effectiveStatus } from '../lib/contest';
import { getSavedVote } from '../lib/local';
import { Backdrop, Brand, FullScreenSpinner, Notice, StatusPill } from '../components/ui';
import SubmissionForm from '../components/guest/SubmissionForm';
import VotingBoard from '../components/guest/VotingBoard';
import VoteRecorded from '../components/guest/VoteRecorded';
import VotingClosed from '../components/guest/VotingClosed';

export default function GuestView() {
  const { config, loading, error } = useContestConfig();
  const { costumes } = useCostumes();
  const now = useNow(1000);
  const [savedVote, setSavedVote] = useState(getSavedVote);

  if (loading) return <FullScreenSpinner />;

  const status = effectiveStatus(config, now);

  return (
    <Backdrop>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/75 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Brand />
          <StatusPill status={status} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-10">
        {error && (
          <div className="mb-4">
            <Notice>Can't reach the contest right now. Check your connection — this page will reconnect on its own.</Notice>
          </div>
        )}

        {status === 'SUBMISSIONS_OPEN' && (
          <SubmissionForm costumes={costumes} votingUnlockTime={config.votingUnlockTime} now={now} />
        )}

        {status === 'VOTING_OPEN' &&
          (savedVote ? (
            <VoteRecorded vote={savedVote} costumes={costumes} />
          ) : (
            <VotingBoard costumes={costumes} votingLockTime={config.votingLockTime} now={now} onVoted={setSavedVote} />
          ))}

        {status === 'VOTING_CLOSED' && <VotingClosed costumes={costumes} reveal={config.reveal} />}
      </main>
    </Backdrop>
  );
}
