"use client";
import { getApiPath } from "@/lib/api";

import { useState } from "react";

interface SummaryInputProps {
    participantId: string;
    phase: "practice" | "formal";
    onComplete: () => void;
}

export default function SummaryInput({ participantId, phase, onComplete }: SummaryInputProps) {
    const [summary, setSummary] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await fetch(getApiPath("/api/part-b/submit"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase,
                    summary,
                    responses: [] // Only summary
                })
            });
            onComplete();
        } catch (e) {
            console.error(e);
            alert("Failed to submit summary");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--foreground)]">Written Summary ({phase})</h2>
            <p className="mb-8 text-[var(--muted)] text-base">
                Please write a summary of what you have read in the {phase} stories.
            </p>

            <textarea
                className="w-full border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg focus-ring text-base text-[var(--foreground)] min-h-[200px] mb-8"
                placeholder="Type your summary here..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
            />

            <div className="text-right">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || summary.trim().length === 0}
                    className={`px-8 py-3 rounded-lg font-medium transition-all focus-ring ${isSubmitting || summary.trim().length === 0
                        ? "bg-[var(--input-bg)] text-[var(--muted)] cursor-not-allowed"
                        : "bg-[var(--primary)] text-[var(--primary-fg)] hover:opacity-90 shadow-sm"
                        }`}
                >
                    {isSubmitting ? "Submitting..." : "Submit Summary"}
                </button>
            </div>
        </div>
    );
}
