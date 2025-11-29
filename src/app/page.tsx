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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Informed Consent
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Please review the terms and provide your consent to participate.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            <strong>Study Terms:</strong> Participant agrees to the study terms.
            (This is a placeholder for the full consent text).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="participantId"
              className="block text-sm font-medium text-gray-700"
            >
              Participant ID
            </label>
            <div className="mt-1">
              <input
                id="participantId"
                name="participantId"
                type="number"
                required
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-black"
                placeholder="Enter your ID"
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                required
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700">
                Yes, I consent
              </label>
              <p className="text-gray-500">
                I have read and understood the terms.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!consented || !participantId}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </form>
      </div>
    </div>
  );
}
