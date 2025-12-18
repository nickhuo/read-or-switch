"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ComprehensionQuestions from "./components/ComprehensionQuestions";

// Matches API response structure
interface Sentence {
    id: number;
    set_id: number;
    sentence_index: number;
    content: string;
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

    // States
    const [step, setStep] = useState<"instructions" | "reading" | "summary" | "questions" | "finished">("instructions");
    const [readingPhase, setReadingPhase] = useState<"word-by-word" | "decision">("word-by-word");

    // Group sentences by set_id: { [setId]: Sentence[] }
    const [sentenceSets, setSentenceSets] = useState<Record<number, Sentence[]>>({});
    const [allSetIds, setAllSetIds] = useState<number[]>([]);

    // Tracking
    const [currentSetId, setCurrentSetId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(1); // 1-based index from CSV
    const [seenFirstSentences, setSeenFirstSentences] = useState<Set<number>>(new Set());
    const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

    // Word-by-word tracking
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // UI
    const [loading, setLoading] = useState(true);

    // Fetch sentences on mount
    useEffect(() => {
        async function fetchSentences() { // ... no change
            try {
                const res = await fetch("/api/sentences");
                if (!res.ok) throw new Error("Failed to fetch");
                const data: Sentence[] = await res.json();

                // Group by set_id
                const sets: Record<number, Sentence[]> = {};
                const ids = new Set<number>();
                data.forEach(s => {
                    if (!sets[s.set_id]) sets[s.set_id] = [];
                    sets[s.set_id].push(s);
                    ids.add(s.set_id);
                });

                // Sort sentences within sets just in case
                for (const id in sets) {
                    sets[id].sort((a, b) => a.sentence_index - b.sentence_index);
                }

                setSentenceSets(sets);
                setAllSetIds(Array.from(ids).sort((a, b) => a - b));
            } catch (error) {
                console.error(error);
                alert("Failed to load sentences.");
            } finally {
                setLoading(false);
            }
        }
        fetchSentences();
    }, []);

    // Selection Logic
    const pickNextSet = useCallback(() => {
        if (allSetIds.length === 0) return null;

        const sortedIds = [...allSetIds].sort((a, b) => a - b);

        // Start at 1 if nothing selected
        if (currentSetId === null) {
            return sortedIds[0];
        }

        // Strictly follow set_id += 1
        const nextId = currentSetId + 1;
        if (sortedIds.includes(nextId)) {
            return nextId;
        }

        return null; // All sets completed (or reached end of list)
    }, [allSetIds, currentSetId, completedSets]);

    const startNextSet = useCallback(() => {
        const nextId = pickNextSet();

        // Check if we are done with all sets OR if we just finished set 16 and that was the last linear one?
        // User request: "when setid = 16 ... enter comprehensive questions"
        // Actually, the request says "when all sets are done, i.e. setid=16".
        // This likely means when we finish the last set.

        if (nextId === null) {
            // All sets done
            setStep("questions");
            return;
        }

        // If we are strictly following 1->16, and maybe we skipped some?
        // The user logic update request implies linear flow. 
        // If pickNextSet returns valid ID, we go there.

        setCurrentSetId(nextId);
        setCurrentIndex(1); // Always start at 1
        setSeenFirstSentences(prev => new Set(prev).add(nextId));

        // Reset reading state
        setReadingPhase("word-by-word");
        setCurrentWordIndex(0);

    }, [pickNextSet]);

    async function logAction(action: "continue" | "switch" | "start_set") {
        if (!participantId || !currentSetId) return;
        try {
            await fetch("/api/part-a/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    setId: currentSetId,
                    sentenceIndex: currentIndex,
                    action
                })
            });
        } catch (e) {
            console.error("Log error", e);
        }
    }

    const handleContinue = async () => {
        if (!currentSetId) return;

        await logAction("continue");

        // Logic:
        // If index < 6, advance in same set.
        // If index = 6, set completed, move to next set.
        if (currentIndex < 6) {
            setCurrentIndex(prev => prev + 1);
            setReadingPhase("word-by-word");
            setCurrentWordIndex(0);
        } else {
            // Completed set
            setCompletedSets(prev => new Set(prev).add(currentSetId));
            startNextSet();
        }
    };

    const handleSwitch = async () => {
        if (!currentSetId) return;

        await logAction("switch");

        // Abandon set -> Move to valid next set (set id + 1)
        startNextSet();
    };

    const handleQuestionsComplete = () => {
        setStep("finished");
    };


    // INIT
    const handleStart = () => {
        setStep("reading");
        startNextSet();
    };

    // RENDER HELPERS
    const currentSentence = currentSetId && sentenceSets[currentSetId]?.find(s => s.sentence_index === currentIndex);
    // Split content into words, removing empty strings
    const words = currentSentence ? currentSentence.content.split(" ").filter(w => w.length > 0) : [];

    // Keyboard Listener for SPR
    useEffect(() => {
        if (step !== "reading" || readingPhase !== "word-by-word") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();

                if (currentWordIndex < words.length - 1) {
                    setCurrentWordIndex(prev => prev + 1);
                } else {
                    // Finished sentence -> go to decision
                    setReadingPhase("decision");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step, readingPhase, currentWordIndex, words.length]);


    if (loading) return <div>Loading experiment data...</div>;
    if (!participantId) return <div>Missing Participant ID</div>;

    const cardClass = "max-w-2xl w-full glass-panel p-10 rounded-2xl shadow-sm transition-all duration-300";
    const buttonBase = "justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 min-w-[160px]";
    const primaryBtn = `${buttonBase} bg-black text-white hover:opacity-90 active:scale-[0.99] focus:ring-black/20`;
    const outlineBtn = `${buttonBase} bg-white text-black border border-gray-200 hover:bg-gray-50 active:scale-[0.99] focus:ring-gray-200`;


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[var(--background)]">
            {step === "instructions" && (
                <div className={cardClass}>
                    <h1 className="text-3xl font-semibold mb-6">Part A: Sentence Reading</h1>
                    <div className="text-[var(--muted)] text-base leading-relaxed mb-8 space-y-4">
                        <p>In this task, you will read sets of sentences.</p>
                        <p>Press the <strong className="text-[var(--foreground)] border border-[var(--border)] px-1 py-0.5 rounded bg-[var(--input-bg)] text-xs uppercase tracking-wider">Spacebar</strong> to reveal each word one by one.</p>
                        <p>After each sentence, you can choose to <strong>Continue reading</strong> more about the topic, or <strong>Switch topic</strong> to read about something else.</p>
                    </div>
                    <button onClick={handleStart} className={primaryBtn}>Start Task</button>
                </div>
            )}

            {step === "reading" && currentSentence && (
                <div className="w-full flex flex-col items-center">

                    {/* SPR View - Always visible to maintain layout, but changes state in decision phase */}
                    <div className="max-w-4xl w-full">
                        <div className="glass-panel p-16 rounded-2xl shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 text-3xl font-mono leading-loose max-w-3xl">
                                {words.map((word, index) => {
                                    // In decision phase, we hide everything (or show all underscores).
                                    // User said "don't reveal the whole sentence". 
                                    const isVisible = readingPhase === "word-by-word" && index === currentWordIndex;

                                    return (
                                        <span
                                            key={index}
                                            className={`transition-all duration-200 ${isVisible
                                                ? "text-[var(--foreground)] font-medium bg-[var(--input-bg)] px-2 -mx-2 rounded"
                                                : "text-[var(--border)]"
                                                }`}
                                        >
                                            {isVisible
                                                ? word
                                                : "_".repeat(word.length)}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        {readingPhase === "word-by-word" && (
                            <p className="mt-8 text-center text-sm font-medium text-[var(--muted)] uppercase tracking-widest opacity-60">
                                Press Spacebar to advance
                            </p>
                        )}
                    </div>

                    {/* Decision View - Buttons Only */}
                    {readingPhase === "decision" && (
                        <div className="max-w-3xl w-full flex justify-between items-center px-4 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <button onClick={handleSwitch} className={outlineBtn}>
                                Switch Topic
                            </button>
                            <button onClick={handleContinue} className={primaryBtn}>
                                Continue Reading
                            </button>
                        </div>
                    )}

                    <div className="fixed bottom-4 left-4 text-xs text-[var(--muted)] opacity-50">
                        Debug: Set {currentSetId} | Index {currentIndex} | Phase {readingPhase}
                    </div>
                </div>
            )}

            {step === "questions" && (
                <div className="w-full">
                    <ComprehensionQuestions
                        participantId={participantId}
                        onComplete={handleQuestionsComplete}
                    />
                </div>
            )}

            {step === "finished" && (
                <div className="text-center space-y-6">
                    <h2 className="text-3xl font-semibold">Part A Complete</h2>
                    <button onClick={() => router.push(`/part-b?participant_id=${participantId}`)} className={primaryBtn}>
                        Go to Part B
                    </button>
                </div>
            )}
        </div>
    );
}
