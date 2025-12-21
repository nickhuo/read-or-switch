"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, MouseEvent } from "react";

interface CognitiveTestsProps {
    participantId: string;
    onComplete: () => void;
}

interface LetterResponseData {
    problemId: number;
    response: "S" | "D";
    isCorrect: boolean;
    reactionTimeMs: number;
}

interface VocabQuestion {
    id: number;
    word: string;
    options: string[];
    correctOption: number;
}

interface VocabResponseData {
    questionId: number;
    responseVal: string;
    isCorrect: boolean;
    reactionTimeMs: number;
}


// New data structure for multiple rounds
const LETTER_COMPARISON_ROUNDS: Record<number, Array<{ left: string; right: string; answer: "S" | "D" }>> = {
    1: [
        { "left": "PRDBZTYFN", "right": "PRDBZTYFN", "answer": "S" },
        { "left": "NCWJDZ", "right": "NCMJDZ", "answer": "D" },
        { "left": "KHW", "right": "KBW", "answer": "D" },
        { "left": "ZRBGMF", "right": "ZRBCMF", "answer": "D" },
        { "left": "BTH", "right": "BYH", "answer": "D" },
        { "left": "XWKQRYCNZ", "right": "XWKQRYCNZ", "answer": "S" },
        { "left": "HNPDLK", "right": "HNPDLK", "answer": "S" },
        { "left": "WMQTRSGLZ", "right": "WMQTRZGLZ", "answer": "D" },
        { "left": "JPN", "right": "JPN", "answer": "S" },
        { "left": "QLXSVT", "right": "QLNSVT", "answer": "D" },
    ],
    2: [
        { "left": "YXHKZVFPB", "right": "YXHKZVFPD", "answer": "D" },
        { "left": "RJZ", "right": "RJZ", "answer": "S" },
        { "left": "CLNPZD", "right": "CLNPZD", "answer": "S" },
        { "left": "DCBPFHXYJ", "right": "DCBPFHXYJ", "answer": "S" },
        { "left": "MWR", "right": "ZWR", "answer": "D" },
        { "left": "LPKXZW", "right": "LPKXZW", "answer": "S" },
        { "left": "TZL", "right": "TZQ", "answer": "D" },
        { "left": "CSDBFPHXZ", "right": "CSDBFPHXZ", "answer": "S" },
        { "left": "QHZXPC", "right": "QHZWPC", "answer": "D" },
        { "left": "JNWXHPFBD", "right": "JNWXHPFMD", "answer": "D" },
    ],
};


// Fetched dynamically
// const vocabQuestions: VocabQuestion[] = [...]; 


export default function CognitiveTests({ participantId, onComplete }: CognitiveTestsProps) {
    const [subPhase, setSubPhase] = useState<"intro" | "letter" | "vocab">("intro");

    // Letter Test State
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [letterResponses, setLetterResponses] = useState<Record<number, string>>({}); // Keyed by absolute ID (1-20)
    const [letterData, setLetterData] = useState<LetterResponseData[]>([]);
    const [startTime, setStartTime] = useState<number>(0);

    // Vocab Test State
    const [vocabQuestions, setVocabQuestions] = useState<VocabQuestion[]>([]);
    const [vocabResponses, setVocabResponses] = useState<Record<number, string>>({});
    const [vocabData, setVocabData] = useState<VocabResponseData[]>([]);

    // Initialize timing when entering a phase
    const handleIntroNext = (event: MouseEvent<HTMLButtonElement>) => {
        setSubPhase("letter");
        setStartTime(event.timeStamp);
    };

    // Fetch vocab questions when subPhase changes to vocab
    // Or pre-fetch. Let's fetch when entering vocab phase or on mount (if we want them ready).
    // Better to fetch when entering vocab phase to ensure latest.
    const fetchVocabQuestions = async () => {
        try {
            const res = await fetch("/api/part-c/cognitive/vocab");
            const data = await res.json();
            if (data.questions) {
                setVocabQuestions(data.questions);
            }
        } catch (e) {
            console.error("Failed to fetch vocab questions", e);
        }
    };

    const handleLetterResponse = (event: MouseEvent<HTMLButtonElement>, absoluteId: number, val: "S" | "D", problem: { left: string, right: string, answer: "S" | "D" }) => {
        const reactionTime = startTime ? event.timeStamp - startTime : 0;

        setLetterResponses(prev => ({ ...prev, [absoluteId]: val }));

        setLetterData(prev => {
            const filtered = prev.filter(p => p.problemId !== absoluteId);
            const isCorrect = (val === problem.answer);

            return [...filtered, {
                problemId: absoluteId,
                response: val,
                isCorrect,
                reactionTimeMs: reactionTime
            }];
        });
    };

    const handleLetterSubmit = async (event: MouseEvent<HTMLButtonElement>) => {
        const eventTimestamp = event.timeStamp;

        const totalRounds = Object.keys(LETTER_COMPARISON_ROUNDS).length;

        if (currentRound < totalRounds) {
            // Move to next round
            setCurrentRound(prev => prev + 1);
            setStartTime(eventTimestamp); // Reset timer for next round
            window.scrollTo(0, 0); // Scroll to top for new round
        } else {
            // Submit all data and move to Vocab
            try {
                await fetch("/api/part-c/cognitive/letter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantId, responses: letterData })
                });

                setSubPhase("vocab");
                setStartTime(eventTimestamp);
                fetchVocabQuestions();
            } catch (e) {
                console.error(e);
                alert("Failed to save letter data");
            }
        }
    };

    const handleVocabResponse = (event: ChangeEvent<HTMLInputElement>, id: number, val: string) => {
        const reactionTime = startTime ? event.timeStamp - startTime : 0;

        setVocabResponses(prev => ({ ...prev, [id]: val }));

        setVocabData(prev => {
            const filtered = prev.filter(p => p.questionId !== id);
            const selectedNum = Number.parseInt(val.split(" - ")[0], 10);
            const q = vocabQuestions.find(v => v.id === id);
            const isCorrect = q ? (selectedNum === q.correctOption) : false;

            return [...filtered, {
                questionId: id,
                responseVal: val,
                isCorrect,
                reactionTimeMs: reactionTime
            }];
        });
    };

    const handleVocabSubmit = async () => {
        try {
            await fetch("/api/part-c/cognitive/vocab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId, responses: vocabData })
            });
            onComplete();
        } catch (e) {
            console.error(e);
            alert("Failed to save vocab data");
        }
    };

    if (subPhase === "intro") {
        return (
            <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center">
                <h2 className="text-3xl font-semibold mb-6 tracking-tight text-[var(--foreground)]">Part 3: Cognitive Tests</h2>
                <div className="mb-8 text-[var(--muted)] text-base leading-relaxed">
                    <p className="mb-4">You will now complete two short cognitive tests.</p>
                    <ul className="space-y-2">
                        <li>1. Letter Comparison</li>
                        <li>2. Vocabulary Test</li>
                    </ul>
                </div>
                <button
                    onClick={handleIntroNext}
                    className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all focus-ring"
                >
                    Start Tests
                </button>
            </div>
        );
    }

    if (subPhase === "letter") {
        const currentProblems = LETTER_COMPARISON_ROUNDS[currentRound] || [];
        // Calculate offset for absolute ID: (round - 1) * 10
        // Assumes 10 items per round as per spec
        const idOffset = (currentRound - 1) * 10;

        return (
            <div className="max-w-5xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 border border-[var(--border)]">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Letter Comparison Round {currentRound}</h2>
                    <p className="text-[var(--muted)] font-medium">Please compare the strings as fast as you can.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {currentProblems.map((prob, idx) => {
                        const absoluteId = idOffset + idx + 1;
                        return (
                            <div key={absoluteId} className="grid grid-cols-[1fr_120px_1fr] items-center border border-[var(--border)] rounded-lg p-5 bg-[var(--surface)] hover:border-[var(--muted)] transition-colors">
                                <div className="flex items-center justify-between pr-4 w-full">
                                    <span className="font-mono text-[var(--muted)] text-sm w-6">{absoluteId}.</span>
                                    <span className="font-mono text-lg font-medium tracking-widest text-[var(--foreground)] text-right">{prob.left}</span>
                                </div>

                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={(event) => handleLetterResponse(event, absoluteId, "S", prob)}
                                        className={`w-10 h-10 rounded-md border font-bold transition-all ${letterResponses[absoluteId] === "S"
                                            ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]"
                                            : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--foreground)]"
                                            }`}
                                    >S</button>
                                    <button
                                        onClick={(event) => handleLetterResponse(event, absoluteId, "D", prob)}
                                        className={`w-10 h-10 rounded-md border font-bold transition-all ${letterResponses[absoluteId] === "D"
                                            ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]"
                                            : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--foreground)]"
                                            }`}
                                    >D</button>
                                </div>

                                <div className="text-left pl-4 w-full">
                                    <span className="font-mono text-lg font-medium tracking-widest text-[var(--foreground)]">{prob.right}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <button
                        onClick={handleLetterSubmit}
                        className="bg-[var(--primary)] text-[var(--primary-fg)] px-10 py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-sm focus-ring flex items-center justify-center gap-2 mx-auto"
                    >
                        {currentRound < Object.keys(LETTER_COMPARISON_ROUNDS).length ? (
                            <>Next Round <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
                        ) : (
                            <>Done <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (subPhase === "vocab") {
        return (
            <div className="max-w-6xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <div className="mb-8 border-l-4 border-[var(--foreground)] pl-4">
                    <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">Vocabulary Task</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vocabQuestions.map((q) => (
                        <div key={q.id} className="border border-[var(--border)] p-5 rounded-lg bg-[var(--surface)]">
                            <h3 className="font-medium text-lg mb-4 border-b border-[var(--border)] pb-2">{q.id}. <span className="font-bold">{q.word}</span></h3>
                            <div className="space-y-2">
                                {q.options.map((opt, idx) => (
                                    <label key={idx} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-[var(--border)] transition-colors">
                                        <input
                                            type="radio"
                                            name={`vocab-${q.id}`}
                                            value={opt}
                                            checked={vocabResponses[q.id] === opt}
                                            onChange={(event) => handleVocabResponse(event, q.id, opt)}
                                            className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                                        />
                                        <span className="text-sm text-[var(--foreground)]/80">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <button onClick={handleVocabSubmit} className="bg-[var(--primary)] text-[var(--primary-fg)] px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all focus-ring shadow-sm">
                        Finish Vocabulary Test
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
