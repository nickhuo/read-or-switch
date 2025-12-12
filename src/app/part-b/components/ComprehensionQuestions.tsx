"use client";

import { useState, useEffect } from "react";
import { Question } from "../types";

interface ComprehensionQuestionsProps {
    participantId: string;
    phase: "practice" | "formal";
    onComplete: () => void;
}

export default function ComprehensionQuestions({ participantId, phase, onComplete }: ComprehensionQuestionsProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Record<number, number>>({}); // qId -> optionIndex (1-4)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(0);

    useEffect(() => {
        fetch(`/api/part-b/questions?phase=${phase}`)
            .then(res => res.json())
            .then(data => {
                setQuestions(data);
                setStartTime(Date.now());
            })
            .catch(err => console.error(err));
    }, [phase]);

    const handleSelectOption = (questionId: number, optionIndex: number) => {
        setResponses(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const now = Date.now();

        // Prepare data
        const responseData = questions.map(q => ({
            questionId: q.id,
            responseOption: responses[q.id] || 0,
            isCorrect: responses[q.id] === q.correct_option,
            reactionTimeMs: now - startTime // Rough estimate for whole block
        }));

        try {
            await fetch("/api/part-b/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase,
                    summary: null,
                    responses: responseData
                })
            });
            onComplete();
        } catch (e) {
            console.error(e);
            alert("Failed to submit responses");
            setIsSubmitting(false);
        }
    };

    const allAnswered = questions.length > 0 && questions.every(q => responses[q.id]);

    if (questions.length === 0) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                <p>Loading questions...</p>
                {/* Fallback if no questions found (e.g. mock data empty) */}
                <button onClick={onComplete} className="mt-4 text-sm text-gray-400 underline">Skip</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-10 rounded shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6">Comprehension Questions ({phase})</h2>
            <p className="mb-8 text-gray-600">Please select the correct word to complete each sentence.</p>

            <div className="space-y-8">
                {questions.map((q, idx) => (
                    <div key={q.id} className="border-b pb-8 last:border-0">
                        <div className="flex gap-4 mb-4">
                            <span className="font-bold text-gray-400">{idx + 1}.</span>
                            <p className="text-lg font-medium text-gray-800">
                                {q.sentence_text.replace("___", "________")}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                            {[q.option_1, q.option_2, q.option_3, q.option_4].map((opt, optIdx) => {
                                const val = optIdx + 1;
                                return (
                                    <label
                                        key={val}
                                        className={`flex items-center gap-3 p-4 rounded border cursor-pointer transition-colors ${responses[q.id] === val
                                                ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                                                : "hover:bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            checked={responses[q.id] === val}
                                            onChange={() => handleSelectOption(q.id, val)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <span className="text-gray-700">{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !allAnswered}
                    className={`px-10 py-3 rounded font-bold text-white transition-colors ${isSubmitting || !allAnswered
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg"
                        }`}
                >
                    {isSubmitting ? "Submitting..." : "Submit Answers"}
                </button>
            </div>
        </div>
    );
}
