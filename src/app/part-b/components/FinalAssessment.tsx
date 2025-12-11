"use client";

import { useState } from "react";

interface FinalAssessmentProps {
    participantId: string;
    onComplete: () => void;
}

// Mock Data
const finalQuestions = [
    {
        id: 1,
        text: "A medical supplier is interested in understanding the market size of bone graft material. What kind of population may be in the market?",
        options: [
            "an athlete with severe fractures",
            "a retiree with significant bone loss",
            "a patient suffering from cancer",
            "all of the above"
        ],
        correctOption: 4
    },
    {
        id: 2,
        text: "A tissue banks is responsible for screening the medical histories of the donors and freeze the donated bones (T/F)",
        options: ["TRUE", "FALSE"],
        correctOption: 1
    },
    {
        id: 3,
        text: "What could be a risk that is associated with surgical procedure of bone graft?",
        options: ["osteoporosis", "infection", "muscle atrophy", "nerve damage"],
        correctOption: 2
    },
    {
        id: 4,
        text: "Due to ethical concerns, all bone graft materials can only come from donors who have died (T/F)",
        options: ["TRUE", "FALSE"],
        correctOption: 2
    }
];

export default function FinalAssessment({ participantId, onComplete }: FinalAssessmentProps) {
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [responseData, setResponseData] = useState<any[]>([]);
    const [startTime, setStartTime] = useState<number>(Date.now()); // Start timer on mount
    const [isDone, setIsDone] = useState(false);
    const [accuracy, setAccuracy] = useState(0);

    const handleResponse = (id: number, val: string) => {
        const now = Date.now();
        const reactionTime = now - startTime;

        setResponses(prev => ({ ...prev, [id]: val }));

        setResponseData(prev => {
            const filtered = prev.filter(p => p.questionId !== id);
            // Map strict string to index 1-4
            const q = finalQuestions.find(qq => qq.id === id);
            const index = q ? q.options.indexOf(val) + 1 : 0;
            const isCorrect = q ? (index === q.correctOption) : false;

            return [...filtered, {
                questionId: id,
                responseIndex: index,
                isCorrect: isCorrect,
                reactionTimeMs: reactionTime
            }];
        });
    };

    const handleSubmit = async () => {
        try {
            await fetch("/api/part-b/final", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId, responses: responseData })
            });

            // Calculate accuracy
            const correctCount = responseData.filter(r => r.isCorrect).length;
            const total = finalQuestions.length; // Use total questions, not just answered? Or answered. 
            // Ideally should enforce all answered. Assuming they did.
            setAccuracy(Math.round((correctCount / total) * 100));

            setIsDone(true);
            onComplete();
        } catch (e) {
            console.error(e);
            alert("Failed to save responses");
        }
    };

    // const accuracy = 75; // Removed mock
    // Actually onComplete usually moves parent to next phase or summary. 
    // If Part B is done, maybe show results here or redirect?
    // Requirement: "Results page showing accuracy percentage"
    // So we should calculate accuracy locally or fetch it.
    // For now, I'll keep the mock Accuracy view logic but trigger it after save.

    if (isDone) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                <h2 className="text-3xl font-bold mb-6 text-green-600">All Done!</h2>
                <div className="text-xl mb-8">
                    {/* Dynamic accuracy calculation could be added here */}
                    Your Accuracy: <span className="font-bold text-blue-600">{accuracy}%</span>
                </div>
                <p className="text-gray-600 mb-8">Thank you for participating in this study.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow mt-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Comprehension Questions</h2>
            <p className="mb-8 text-gray-600">
                This is the final task! The multiple-choice questions here are based on the passages you read in the formal task.
            </p>

            <div className="grid grid-cols-2 gap-8">
                {finalQuestions.map((q) => (
                    <div key={q.id} className="border p-6 rounded shadow-sm bg-white">
                        <div className="border-l-4 border-blue-500 pl-3 mb-4">
                            <h3 className="font-bold text-gray-800">Question {q.id}</h3>
                        </div>
                        <p className="mb-4 text-gray-700 font-medium min-h-[60px]">{q.text}</p>

                        <div className="space-y-3">
                            {q.options.map((opt, idx) => (
                                <label key={idx} className={`block border p-3 rounded cursor-pointer transition-colors ${responses[q.id] === opt ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            value={opt}
                                            checked={responses[q.id] === opt}
                                            onChange={() => handleResponse(q.id, opt)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12 mb-8">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 text-white px-10 py-3 rounded text-lg font-bold hover:bg-blue-700 shadow-md"
                >
                    Submit Answers
                </button>
            </div>
        </div>
    );
}
