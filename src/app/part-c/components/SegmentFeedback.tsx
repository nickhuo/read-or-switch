"use client";

import { useState } from "react";
import { Question } from "../../part-b/types";

interface SegmentFeedbackProps {
    questions: Question[]; // Expecting exactly 4 questions
    onSubmit: (summary: string, ratings: { questionId: number, value: number }[]) => void;
}

export default function SegmentFeedback({ questions, onSubmit }: SegmentFeedbackProps) {
    const [summary, setSummary] = useState("");
    const [ratings, setRatings] = useState<{ [key: number]: number }>({});

    // Initialize ratings
    if (Object.keys(ratings).length === 0 && questions.length > 0) {
        const initial: any = {};
        questions.forEach(q => initial[q.id] = 50);
        // This causes infinite loop if not careful, better to init in handleClick or lazily?
        // Actually useState callback or useEffect is better.
        // But let's just use default 50 in render if missing.
    }

    const handleRatingChange = (qId: number, val: number) => {
        setRatings(prev => ({ ...prev, [qId]: val }));
    };

    const handleClick = () => {
        const results = questions.map(q => ({
            questionId: q.id,
            value: ratings[q.id] !== undefined ? ratings[q.id] : 50
        }));
        onSubmit(summary, results);
    };

    return (
        <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
            <h2 className="text-xl font-semibold mb-8 text-[var(--foreground)]">Quick Check</h2>

            <div className="space-y-8">
                {/* 1. Summary */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">1. Short Comprehension (Summary)</label>
                    <textarea
                        className="w-full border border-[var(--border)] bg-[var(--surface)] p-3 rounded-lg focus-ring text-sm"
                        rows={3}
                        placeholder="Briefly summarize what you just read..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                    />
                </div>

                {/* 2. Ratings (Dynamic from DB questions) */}
                {questions.map((q, idx) => (
                    <div key={q.id}>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                            {idx + 2}. {q.question_text} ({ratings[q.id] !== undefined ? ratings[q.id] : 50})
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={ratings[q.id] !== undefined ? ratings[q.id] : 50}
                            onChange={(e) => handleRatingChange(q.id, Number(e.target.value))}
                            className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                        />
                        <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                            <span>{q.option_1}</span>
                            <span>{q.option_2}</span>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleClick}
                    className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-sm focus-ring"
                >
                    Submit & Continue
                </button>
            </div>
        </div>
    );
}
