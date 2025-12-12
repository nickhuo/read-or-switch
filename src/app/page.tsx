"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [participantId, setParticipantId] = useState("");
  const [consented, setConsented] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consented && participantId) {
      router.push(`/demographics?participant_id=${participantId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-10 shadow-sm transition-all duration-300">
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Informed Consent
          </h1>
          <p className="text-[var(--muted)] text-base">
            Please review the terms and provide your consent to participate.
          </p>
        </div>

        <div className="rounded-xl bg-[var(--input-bg)] p-6 mb-8 border border-[var(--border)]">
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            <strong className="block mb-2 font-medium">Study Terms</strong>
            Participant agrees to the study terms. (This is a placeholder for the full consent text).
            Your participation is voluntary and you may withdraw at any time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label
              htmlFor="participantId"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Participant ID
            </label>
            <input
              id="participantId"
              name="participantId"
              type="number"
              required
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] shadow-sm focus-ring placeholder-[var(--muted)] transition-colors hover:border-[var(--foreground)]"
              placeholder="Enter your assigned ID"
            />
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-transparent hover:bg-[var(--input-bg)] transition-colors -mx-4 cursor-pointer" onClick={() => setConsented(!consented)}>
            <div className="flex h-6 items-center">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                required
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="consent" className="font-medium text-[var(--foreground)] cursor-pointer">
                Yes, I consent
              </label>
              <p className="text-[var(--muted)] mt-1">
                I have read and understood the terms of this study.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!consented || !participantId}
            className="flex w-full justify-center rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Start Experiment
          </button>
        </form>
      </div>
    </div>
  );
}
