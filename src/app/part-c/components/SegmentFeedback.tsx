"use client";

import React, { useState, useEffect } from "react";
import { Question } from "@/app/part-b/types";

interface SegmentFeedbackProps {
    questions: Question[];
    onSubmit: (summary: string, responses: any[]) => void;
}

const GENERIC_RATING_QUESTIONS = [
    {
        id: "c1",
        text: "Compared to the other articles that you have read today, how much new information was in this article?",
    },
    {
        id: "c2",
        text: "How easy was this article to read?",
    },
    {
        id: "c3",
        text: "How much did you learn from this article?",
    },
    {
        id: "c4",
        text: "How much did you learn overall from the articles you have read so far today (including this article)?",
    },
];

export default function SegmentFeedback({ onSubmit }: SegmentFeedbackProps) {
    const [step, setStep] = useState(0); // 0 to 3 for the 4 questions
    const [responses, setResponses] = useState<{ [key: string]: number }>({});
    const [currentValue, setCurrentValue] = useState<number>(50); // Default slider value
    const [startTime, setStartTime] = useState<number>(Date.now());

    useEffect(() => {
        // Reset slider for new question
        setCurrentValue(50);
        setStartTime(Date.now());
    }, [step]);

    const handleNext = () => {
        const currentQuestion = GENERIC_RATING_QUESTIONS[step];
        const reactionTime = Date.now() - startTime;

        const newResponses = {
            ...responses,
            [currentQuestion.id]: currentValue
        };
        setResponses(newResponses);

        if (step < GENERIC_RATING_QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            onSubmit("", Object.entries(newResponses).map(([qid, val]) => ({
                questionId: qid,
                value: val,
                reactionTimeMs: 0
            })));
        }
    };

    const currentQuestion = GENERIC_RATING_QUESTIONS[step];

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h2 className="text-xl font-bold mb-6">Feedback ({step + 1}/{GENERIC_RATING_QUESTIONS.length})</h2>

            <div className="mb-8">
                <label className="block text-lg font-medium mb-4">
                    {currentQuestion.text}
                </label>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">0</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">100</span>
                </div>
                <div className="text-center mt-2 font-bold text-blue-600">
                    {currentValue}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {step === GENERIC_RATING_QUESTIONS.length - 1 ? "Submit" : "Next"}
                </button>
            </div>
        </div>
    );
}
