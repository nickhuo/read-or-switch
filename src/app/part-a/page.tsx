
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

    if (!participantId) return <div className="p-10 text-center text-red-500">Missing Participant ID</div>;

    // Component Styles
    const cardClass = "max-w-2xl w-full glass-panel p-10 rounded-2xl shadow-sm transition-all duration-300";
    const buttonClass = "flex justify-center rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20";
    const primaryTitle = "text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-6";
    const bodyText = "text-[var(--muted)] text-base leading-relaxed mb-8";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            {(step === "reading" || step === "summary") && (
                <div className="absolute top-6 right-8 text-sm font-mono font-medium text-[var(--muted)] bg-[var(--surface)]/80 px-3 py-1.5 rounded-md border border-[var(--border)] backdrop-blur-sm">
                    Time Left: <span className="text-[var(--foreground)]">{formatTime(timeLeft)}</span>
                </div>
            )}

            {step === "instructions" && (
                <div className={cardClass}>
                    <h1 className={primaryTitle}>Part A: Sentence Reading</h1>
                    <div className={bodyText}>
                        <p className="mb-4">
                            In this task, you will read a series of sentences.
                        </p>
                        <p className="mb-4">
                            You have a total of <strong className="text-[var(--foreground)]">10 minutes</strong> to complete this section (reading + summary).
                        </p>
                        <p className="mb-4">
                            Press the <strong className="text-[var(--foreground)] border border-[var(--border)] px-1 py-0.5 rounded bg-[var(--input-bg)] text-xs uppercase tracking-wider">Spacebar</strong> to reveal each word one by one.
                            Read at your own natural pace.
                        </p>
                        <p>
                            After the sentences, you will be asked to write a short summary.
                        </p>
                    </div>
                    <button
                        onClick={() => setStep("reading")}
                        className={buttonClass}
                    >
                        Start Reading
                    </button>
                </div>
            )}

            {step === "reading" && (
                <div className="max-w-4xl w-full">
                    <div className="glass-panel p-16 rounded-2xl shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 text-3xl font-mono leading-loose max-w-3xl">
                            {words.map((word, index) => (
                                <span
                                    key={index}
                                    className={`transition-all duration-200 ${index === currentWordIndex
                                            ? "text-[var(--foreground)] font-medium bg-[var(--input-bg)] px-2 -mx-2 rounded"
                                            : "text-[var(--border)]"
                                        }`}
                                >
                                    {index === currentWordIndex
                                        ? word
                                        : "_".repeat(word.length)}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="mt-8 text-center text-sm font-medium text-[var(--muted)] uppercase tracking-widest opacity-60">
                        Sentence {currentSentenceIndex + 1} / {sentences.length}
                    </p>
                </div>
            )}

            {step === "summary" && (
                <div className={cardClass}>
                    <h2 className={primaryTitle}>Summary</h2>
                    <p className={bodyText}>Please write a brief summary of what you just read.</p>
                    <textarea
                        className="w-full h-40 p-4 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] focus-ring resize-none text-[var(--foreground)] placeholder-[var(--muted)] mb-6"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Type your summary here..."
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSummarySubmit}
                            className={buttonClass}
                        >
                            Submit Summary
                        </button>
                    </div>
                </div>
            )}

            {step === "finished" && (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-semibold text-[var(--foreground)]">Part A Complete</h2>
                    <p className="text-[var(--muted)] max-w-md mx-auto">Thank you for completing this section. You are now ready to proceed to the next part of the study.</p>
                    <div className="pt-4">
                        <button
                            onClick={() => router.push(`/part-b?participant_id=${participantId}`)}
                            className={buttonClass + " w-full sm:w-auto mx-auto"}
                        >
                            Go to Part B
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
