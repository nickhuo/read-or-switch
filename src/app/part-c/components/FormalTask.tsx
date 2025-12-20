"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment, Question } from "../../part-b/types";
import SegmentFeedback from "./SegmentFeedback";

interface FormalTaskProps {
    participantId: string;
    onComplete: () => void;
}

// ... types
interface Subtopic {
    id: string;
    title: string;
    topic_id: string;
}

type ViewState = "instructions" | "subtopic-selection" | "reading" | "question";

export default function FormalTask({ participantId, onComplete }: FormalTaskProps) {
    // const [stories, setStories] = useState<Story[]>([]); // Removed
    const [visitedSubtopicIds, setVisitedSubtopicIds] = useState<Set<string>>(new Set());

    const [view, setView] = useState<ViewState>("instructions");
    // const [currentStory, setCurrentStory] = useState<Story | null>(null); // Topic concept removed from UI
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [currentSubtopic, setCurrentSubtopic] = useState<Subtopic | null>(null);
    const [readingStartTime, setReadingStartTime] = useState<number>(0);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAction, setPendingAction] = useState<"continue" | "switch" | null>(null);

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch all subtopics directly
        fetch("/api/part-c/subtopics?phase=formal")
            .then(res => res.json())
            .then(data => setSubtopics(data))
            .catch(err => console.error("Failed to fetch subtopics", err));
    }, []);

    // Fetch all Formal questions
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    useEffect(() => {
        fetch("/api/part-c/questions?phase=formal")
            .then(res => res.json())
            .then(data => setAllQuestions(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        // Run timer ONLY when reading
        if (view === "reading" && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Time up logic could go here
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [view, timeLeft]);

    const handleStart = () => {
        setView("subtopic-selection");
    };

    // handleSelectTopic removed

    const handleSelectSubtopic = async (subtopic: Subtopic) => {
        setCurrentSubtopic(subtopic);

        try {
            // Need topicId for the segments API? Yes, it corresponds to 'storyId' param which maps to 'topID'
            const res = await fetch(`/api/part-c/segments?storyId=${subtopic.topic_id}&subtopicId=${subtopic.id}&phase=formal&participantId=${participantId}`);
            const data = await res.json();
            setSegments(data);

            // Filter questions. 
            // We match subtopic_id and story_id (topic_id)
            const storyQuestions = allQuestions.filter(q =>
                String(q.story_id) === String(subtopic.topic_id) &&
                String(q.subtopic_id) === String(subtopic.id)
            );
            setQuestions(storyQuestions);

            setCurrentSegmentIndex(0);
            setReadingStartTime(Date.now());
            setView("reading");
        } catch (error) {
            console.error(error);
        }
    };

    const triggerQuestion = (action: "continue" | "switch") => {
        setPendingAction(action);
        setView("question");
    };

    const handleFeedbackSubmit = async (unusedSummary: string, ratings: { questionId: string, value: number, reactionTimeMs: number }[]) => {
        const currentSegment = segments[currentSegmentIndex];

        // Calculate passRT (Passage Reading Time)
        // We need to track when they *started* reading.
        // Let's assume we add a ref or state for `startReadingTime`.
        // For now, I'll put a placeholder or use a ref if I can inject it.
        // Actually, let's just use a timestamp from when they entered the view.
        // I will add a `readingStartTime` state in the next step.
        const passRT = Date.now() - (readingStartTime || Date.now());

        try {
            await fetch("/api/part-c/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase: "formal",
                    storyId: currentSubtopic?.topic_id,
                    subtopicId: currentSubtopic?.id,
                    conId: currentSegment.con_id,
                    passId: currentSegment.pass_id,
                    segmentOrder: currentSegment.segment_order,
                    passRT,
                    responses: ratings
                })
            });
        } catch (e) {
            console.error("Failed to submit response", e);
        }

        // Logic for next view
        // Logic for next view
        if (pendingAction === "switch") {
            // "Switch Topic" -> Go back to Subtopic Selection list
            if (currentSubtopic) {
                setVisitedSubtopicIds(prev => new Set(prev).add(currentSubtopic.id));
            }
            setView("subtopic-selection");
        } else if (pendingAction === "continue") {
            if (currentSegmentIndex < segments.length - 1) {
                setCurrentSegmentIndex(prev => prev + 1);
                setReadingStartTime(Date.now());
                setView("reading");
            } else {
                // End of passages for this subtopic
                if (currentSubtopic) {
                    setVisitedSubtopicIds(prev => new Set(prev).add(currentSubtopic.id));
                }
                setView("subtopic-selection");
            }
        }
        setPendingAction(null);
    };

    const segOrder = segments[currentSegmentIndex]?.segment_order || 1;
    const startOrder = (segOrder - 1) * 4 + 1;
    const endOrder = startOrder + 3;
    const currentQuestions = questions.filter(q => q.question_order !== undefined && q.question_order >= startOrder && q.question_order <= endOrder);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (view === "instructions") {
        return (
            <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center">
                <h2 className="text-3xl font-semibold mb-6 tracking-tight text-[var(--foreground)]">Part 2: Formal Task</h2>
                <div className="mb-8 text-[var(--muted)] text-base leading-relaxed">
                    <p className="mb-2">You have <strong className="text-[var(--foreground)]">15 minutes</strong> to read.</p>
                    <p>You can choose any subtopic to read.</p>
                </div>
                <button
                    onClick={handleStart}
                    className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all focus-ring"
                >
                    Start Formal Task
                </button>
            </div>
        );
    }

    // story-selection view removed

    if (view === "subtopic-selection") {
        const allVisited = subtopics.length > 0 && subtopics.every(sub => visitedSubtopicIds.has(sub.id));

        return (
            <div className="max-w-6xl mx-auto mt-12 px-6">
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-[var(--border)]">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Available Subtopics</h2>
                    <div className="text-lg font-mono font-medium text-[var(--foreground)] bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subtopics.map(sub => {
                        const isVisited = visitedSubtopicIds.has(sub.id);
                        return (
                            <button
                                key={sub.id}
                                onClick={() => !isVisited && handleSelectSubtopic(sub)}
                                disabled={isVisited}
                                className={`p-6 rounded-xl border text-left transition-all ${isVisited
                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--foreground)] hover:shadow-sm"
                                    }`}
                            >
                                <h3 className="text-lg font-medium">{sub.title}</h3>
                                {isVisited && <span className="text-xs font-bold uppercase tracking-wider mt-2 block">Visited</span>}
                            </button>
                        );
                    })}
                </div>

                {allVisited && (
                    <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <button
                            onClick={onComplete}
                            className="bg-[var(--primary)] text-[var(--primary-fg)] px-12 py-4 rounded-xl text-lg font-bold shadow-lg hover:opacity-90 transition-all transform hover:scale-105"
                        >
                            Continue to Next Part
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === "reading" && currentSubtopic && segments[currentSegmentIndex]) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-4">
                    <div className="flex flex-col">
                        <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-1">
                            {currentSubtopic.title}
                        </div>
                        <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest hidden">Reading</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                            Segment {currentSegmentIndex + 1}/{segments.length}
                        </span>
                        <div className="font-mono font-medium text-[var(--foreground)] bg-[var(--surface)] px-2 py-1 rounded text-sm border border-[var(--border)]">
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-8 text-lg leading-loose text-[var(--foreground)] min-h-[200px]">
                    {segments[currentSegmentIndex].content}
                </div>

                <div className="flex justify-between gap-6">
                    <button
                        onClick={() => triggerQuestion("switch")}
                        className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors font-medium text-sm"
                    >
                        Go To Other Subtopics
                    </button>
                    <button
                        onClick={() => triggerQuestion("continue")}
                        className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium text-sm shadow-sm focus-ring"
                    >
                        {currentSegmentIndex < segments.length - 1 ? "Next Segment" : "Finish Subtopic"}
                    </button>
                </div>
            </div>
        );
    }

    if (view === "question") {
        return (
            <SegmentFeedback
                questions={[]} // Pass empty or generic if needed, but the component uses hardcoded ones now
                onSubmit={handleFeedbackSubmit}
            />
        );
    }

    return <div>Loading...</div>;
}
