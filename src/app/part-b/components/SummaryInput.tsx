"use client";

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
            await fetch("/api/part-b/submit", {
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
        <div className="max-w-3xl mx-auto bg-white p-10 rounded shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Written Summary ({phase})</h2>
            <p className="mb-4 text-gray-600">
                Please write a summary of what you have read in the {phase} stories.
            </p>

            <textarea
                className="w-full border p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg min-h-[200px]"
                placeholder="Type your summary here..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
            />

            <div className="mt-8 text-right">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || summary.trim().length === 0}
                    className={`px-8 py-3 rounded font-bold text-white transition-colors ${isSubmitting || summary.trim().length === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {isSubmitting ? "Submitting..." : "Submit Summary"}
                </button>
            </div>
        </div>
    );
}
