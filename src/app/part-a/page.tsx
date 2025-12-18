
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    const [step, setStep] = useState<"instructions" | "reading" | "summary" | "finished">("instructions");
    // Group sentences by set_id: { [setId]: Sentence[] }
    const [sentenceSets, setSentenceSets] = useState<Record<number, Sentence[]>>({});
    const [allSetIds, setAllSetIds] = useState<number[]>([]);

    // Tracking
    const [currentSetId, setCurrentSetId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(1); // 1-based index from CSV
    const [seenFirstSentences, setSeenFirstSentences] = useState<Set<number>>(new Set());
    const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

    // UI
    const [loading, setLoading] = useState(true);

    // Fetch sentences on mount
    useEffect(() => {
        async function fetchSentences() {
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
        // Enforce: Must verify participant sees first sentence of all 16 sets.
        // Priority 1: Sets where first sentence hasn't been seen.
        const unseenSets = allSetIds.filter(id => !seenFirstSentences.has(id));

        if (unseenSets.length > 0) {
            // Pick rand or sequential? Sequential is fine/simple, or random from unseen.
            // Let's pick random from unseen to avoid predictable order if that matters, or just first available.
            // Random from unseen is better experimental design usually.
            const nextId = unseenSets[Math.floor(Math.random() * unseenSets.length)];
            return nextId;
        }

        // Priority 2: Sets that are seemingly incomplete?
        // Requirement says: "Once all 16 first sentences have been shown... continue any additional set-selection logic".
        // Use case: Maybe revisit abandoned sets? Or if all sets finished, done?
        // Assuming if all sets are "completed" (index 6 reached), we might be done?
        // But if user switched early, that set is "abandoned". Can they go back?
        // Prompt says: "After each sentence (except possibly the last) ... decides".
        // It doesn't explicitly say we MUST finish all sets, but usually we move until some condition.
        // Let's assume we cycle through remaining incomplete sets?
        // Let's filter for sets that are NOT in completedSets.
        const incompleteSets = allSetIds.filter(id => !completedSets.has(id));

        if (incompleteSets.length > 0) {
            // Avoid current if possible, unless it's the only one
            const candidates = incompleteSets.filter(id => id !== currentSetId);
            if (candidates.length === 0) return incompleteSets[0]; // Only one left

            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        // If all completed?
        return null; // Done
    }, [allSetIds, seenFirstSentences, completedSets, currentSetId]);

    const startNextSet = useCallback(() => {
        const nextId = pickNextSet();
        if (nextId === null) {
            setStep("summary"); // Or finished? Prompt says Summary after sentences.
            return;
        }

        setCurrentSetId(nextId);
        setCurrentIndex(1); // Always start at 1
        setSeenFirstSentences(prev => new Set(prev).add(nextId));
    }, [pickNextSet]);

    const logAction = async (action: "continue" | "switch" | "start_set") => {
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
    };

    const handleContinue = async () => {
        if (!currentSetId) return;

        await logAction("continue");

        // Logic:
        // If index < 6, advance in same set.
        // If index = 6, set completed, move to next set.
        if (currentIndex < 6) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Completed set
            setCompletedSets(prev => new Set(prev).add(currentSetId));
            startNextSet();
        }
    };

    const handleSwitch = async () => {
        if (!currentSetId) return;

        await logAction("switch");

        // Abandon set -> Move to valid next set
        startNextSet();
    };

    const handleSummarySubmit = async (summaryText: string) => {
        try {
            await fetch("/api/part-a", { // Existing summary route
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    groupId: 999, // global summary
                    content: summaryText,
                }),
            });
            setStep("finished");
        } catch (err) {
            alert("Error saving summary");
        }
    };


    // INIT
    const handleStart = () => {
        setStep("reading");
        startNextSet();
    };

    // RENDER HELPERS
    const currentSentence = currentSetId && sentenceSets[currentSetId]?.find(s => s.sentence_index === currentIndex);

    if (loading) return <div>Loading experiment data...</div>;
    if (!participantId) return <div>Missing Participant ID</div>;

    const cardClass = "max-w-2xl w-full glass-panel p-10 rounded-2xl shadow-sm transition-all duration-300";
    const buttonBase = "flex justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2";
    const primaryBtn = `${buttonBase} bg-[var(--primary)] text-[var(--primary-fg)] hover:opacity-90 active:scale-[0.99] focus:ring-[var(--primary)]/20`;
    const outlineBtn = `${buttonBase} border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] active:scale-[0.99] focus:ring-[var(--ring)]`;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[var(--background)]">
            {step === "instructions" && (
                <div className={cardClass}>
                    <h1 className="text-3xl font-semibold mb-6">Part A: Sentence Reading</h1>
                    <div className="text-[var(--muted)] text-base leading-relaxed mb-8 space-y-4">
                        <p>In this task, you will read sets of sentences.</p>
                        <p>After each sentence, you can choose to <strong>Continue reading</strong> more about the topic, or <strong>Switch topic</strong> to read about something else.</p>
                        <p>Please read carefully.</p>
                    </div>
                    <button onClick={handleStart} className={primaryBtn}>Start Task</button>
                </div>
            )}

            {step === "reading" && currentSentence && (
                <div className="max-w-3xl w-full flex flex-col items-center gap-12">
                    <div className="glass-panel p-16 rounded-2xl shadow-sm w-full min-h-[300px] flex items-center justify-center">
                        <p className="text-2xl leading-loose font-medium text-center text-[var(--foreground)]">
                            {currentSentence.content}
                        </p>
                    </div>

                    <div className="flex w-full justify-between items-center px-4">
                        <button onClick={handleSwitch} className={outlineBtn}>
                            Switch Topic
                        </button>
                        <button onClick={handleContinue} className={primaryBtn}>
                            Continue Reading
                        </button>
                    </div>

                    <div className="text-xs text-[var(--muted)] opacity-50">
                        Debug: Set {currentSetId} | Index {currentIndex} | Seen: {seenFirstSentences.size}/16
                    </div>
                </div>
            )}

            {step === "summary" && (
                <SummaryView onSubmit={handleSummarySubmit} />
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

function SummaryView({ onSubmit }: { onSubmit: (t: string) => void }) {
    const [text, setText] = useState("");
    return (
        <div className="max-w-2xl w-full glass-panel p-10 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <p className="text-[var(--muted)] mb-4">Please write a brief summary of what you read.</p>
            <textarea
                className="w-full h-40 p-4 border rounded-lg bg-[var(--input-bg)] mb-6 text-[var(--foreground)]"
                value={text}
                onChange={e => setText(e.target.value)}
            />
            <div className="flex justify-end">
                <button onClick={() => onSubmit(text)} className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2 rounded-lg">Submit</button>
            </div>
        </div>
    );
}
