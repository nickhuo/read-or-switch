
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Sentence {
    id: number;
    content: string;
    group_id: number;
}

export default function PartAPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartAContent />
        </Suspense>
    );
}

function PartAContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participant_id");

    // States: 'instructions', 'reading', 'summary', 'finished'
    const [step, setStep] = useState<"instructions" | "reading" | "summary" | "finished">("instructions");

    // Data State
    const [sentences, setSentences] = useState<Sentence[]>([]);
    // const [loading, setLoading] = useState(true); // Unused

    // SPR State
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1); // -1 means before start
    const [words, setWords] = useState<string[]>([]);

    // Summary State
    const [summary, setSummary] = useState("");

    // Fetch sentences on mount
    useEffect(() => {
        async function fetchSentences() {
            try {
                const res = await fetch("/api/sentences");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setSentences(data);
            } catch (error) {
                console.error(error);
                alert("Failed to load sentences.");
            } finally {
                // setLoading(false);
            }
        }
        fetchSentences();
    }, []);

    useEffect(() => {
        if (step === "reading" && sentences[currentSentenceIndex]) {
            setWords(sentences[currentSentenceIndex].content.split(" "));
            setCurrentWordIndex(0); // Start at the first word immediately
        }
    }, [step, currentSentenceIndex, sentences]);

    // Handle Spacebar for SPR
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (step !== "reading") return;
            if (e.code === "Space") {
                e.preventDefault();

                // Advance
                if (currentWordIndex < words.length - 1) {
                    setCurrentWordIndex((prev) => prev + 1);
                } else {
                    // End of sentence
                    if (currentSentenceIndex < sentences.length - 1) {
                        setCurrentSentenceIndex((prev) => prev + 1);
                        // Reset word index for next sentence is handled by the effect above
                        // But we need to ensure we don't get stuck if effect hasn't run yet?
                        // Actually, the effect depends on currentSentenceIndex, so it will trigger.
                    } else {
                        // End of block -> Go to Summary
                        setStep("summary");
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step, currentWordIndex, words, currentSentenceIndex, sentences]);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleSummarySubmit = useCallback(async () => {
        // Allow empty summary if time ran out
        // if (!summary.trim()) return; // Removed to allow auto-submit on timeout

        try {
            const res = await fetch("/api/part-a", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    groupId: sentences[0]?.group_id || 1,
                    content: summary,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to save summary");
            }

            setStep("finished");
        } catch (error) {
            console.error(error);
            // If it fails on timeout, we still want to show finished state or alert
            // We can't easily check timeLeft here inside useCallback without adding it to deps, 
            // but we only call this when manually submitting or timeout.
            // Let's just alert if it wasn't a timeout (we can't check timeLeft easily without ref or dep).
            // Simplified: just alert.
            alert("Failed to save summary. Please try again.");
        }
    }, [participantId, sentences, summary]);

    // Timer Logic
    useEffect(() => {
        if (step !== "reading" && step !== "summary") return;

        if (timeLeft <= 0) {
            handleSummarySubmit();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [step, timeLeft, handleSummarySubmit]);

    if (!participantId) return <div>Missing Participant ID</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 relative">
            {(step === "reading" || step === "summary") && (
                <div className="absolute top-4 right-4 text-xl font-mono font-bold text-gray-700">
                    Time Left: {formatTime(timeLeft)}
                </div>
            )}
            {step === "instructions" && (
                <div className="max-w-2xl bg-white p-8 rounded shadow text-center">
                    <h1 className="text-2xl font-bold mb-4">Part A: Sentence Reading</h1>
                    <p className="mb-6 text-gray-700">
                        In this task, you will read a series of sentences.
                        <br /><br />
                        You have a total of <strong>10 minutes</strong> to complete this section (reading + summary).
                        <br /><br />
                        Press the <strong>SPACEBAR</strong> to reveal each word one by one.
                        <br />
                        Read at your own natural pace.
                        <br /><br />
                        After the sentences, you will be asked to write a short summary.
                    </p>
                    <button
                        onClick={() => setStep("reading")}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Start Reading
                    </button>
                </div>
            )}

            {step === "reading" && (
                <div className="max-w-4xl w-full">
                    <div className="bg-white p-12 rounded shadow-lg min-h-[300px] flex flex-col justify-center">
                        <div className="flex flex-wrap gap-x-3 gap-y-6 text-2xl font-mono leading-loose">
                            {words.map((word, index) => (
                                <span
                                    key={index}
                                    className={`${index === currentWordIndex ? "text-black bg-yellow-100" : "text-gray-300"
                                        }`}
                                >
                                    {index === currentWordIndex
                                        ? word
                                        : "_".repeat(word.length)}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="mt-8 text-center text-gray-500">
                        Sentence {currentSentenceIndex + 1} of {sentences.length}
                    </p>
                </div>
            )}

            {step === "summary" && (
                <div className="max-w-2xl w-full bg-white p-8 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Summary</h2>
                    <p className="mb-4 text-gray-700">Please write a brief summary of what you just read.</p>
                    <textarea
                        className="w-full h-32 p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-black"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Type your summary here..."
                    />
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSummarySubmit}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            Submit Summary
                        </button>
                    </div>
                </div>
            )}

            {step === "finished" && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Part A Complete</h2>
                    <p className="mt-4 mb-8">Thank you. Please proceed to the next part.</p>
                    <button
                        onClick={() => router.push(`/part-b?participant_id=${participantId}`)}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        Go to Part B
                    </button>
                </div>
            )}
        </div>
    );
}
