"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment, Question } from "../../part-b/types";
import SegmentFeedback from "./SegmentFeedback";

interface FormalTaskProps {
    participantId: string;
    onComplete: () => void;
}

type ViewState = "instructions" | "story-selection" | "reading" | "question";

export default function FormalTask({ participantId, onComplete }: FormalTaskProps) {
    const [stories, setStories] = useState<Story[]>([]);
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<number>>(new Set());

    const [view, setView] = useState<ViewState>("instructions");
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAction, setPendingAction] = useState<"continue" | "switch" | null>(null);

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch("/api/part-c/stories?phase=formal")
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error("Failed to fetch stories", err));
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
        setView("story-selection");
    };

    const handleSelectStory = async (story: Story) => {
        setCurrentStory(story);
        try {
            const res = await fetch(`/api/part-c/segments?storyId=${story.id}&phase=formal&participantId=${participantId}`);
            const data = await res.json();
            setSegments(data);

            // Filter questions for this story
            const storyQuestions = allQuestions.filter(q => q.story_id === story.id);
            setQuestions(storyQuestions);

            setCurrentSegmentIndex(0);
            setView("reading");
        } catch (error) {
            console.error(error);
        }
    };

    const triggerQuestion = (action: "continue" | "switch") => {
        setPendingAction(action);
        setView("question");
    };

    const handleFeedbackSubmit = async (summary: string, ratings: { questionId: number, value: number }[]) => {
        const currentSegment = segments[currentSegmentIndex];

        try {
            await fetch("/api/part-c/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase: "formal",
                    storyId: currentStory?.id,
                    segmentOrder: currentSegment.segment_order,
                    summary,
                    responses: ratings.map(r => ({
                        questionId: r.questionId,
                        value: r.value,
                        isCorrect: false,
                        reactionTimeMs: 0
                    }))
                })
            });
        } catch (e) {
            console.error("Failed to submit response", e);
        }

        // Mark story as 'visited' (at least 1 segment done) if continuing or switching
        if (currentStory) {
            setVisitedStoryIds(prev => new Set(prev).add(currentStory.id));
        }

        // Logic for next view
        if (pendingAction === "switch") {
            setView("story-selection");
        } else if (pendingAction === "continue") {
            if (currentSegmentIndex < segments.length - 1) {
                setCurrentSegmentIndex(prev => prev + 1);
                setView("reading");
            } else {
                setView("story-selection");
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
                    <p>You must visit all available topics.</p>
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

    if (view === "story-selection") {
        const allVisited = stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id));
        return (
            <div className="max-w-6xl mx-auto mt-12 px-6">
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-[var(--border)]">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Formal Topics</h2>
                    <div className="text-lg font-mono font-medium text-[var(--foreground)] bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => handleSelectStory(story)}
                            // Formal task usually allows revisiting too
                            className={`p-6 rounded-xl border text-left transition-all duration-200 min-h-[120px] flex flex-col justify-between ${visitedStoryIds.has(story.id)
                                ? "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] opacity-80" // Visited style
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:shadow-sm"
                                }`}
                        >
                            <h3 className={`text-lg font-medium ${visitedStoryIds.has(story.id) ? "opacity-60" : ""}`}>{story.title}</h3>
                            {visitedStoryIds.has(story.id) && <span className="text-xs text-green-600 font-medium uppercase tracking-wide bg-green-50 px-2 py-1 rounded-full self-start">Visited</span>}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={onComplete}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Complete Formal Task
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === "reading" && currentStory && segments[currentSegmentIndex]) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-4">
                    <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest">{currentStory.title}</h3>
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
                        Switch Topic
                    </button>
                    <button
                        onClick={() => triggerQuestion("continue")}
                        className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium text-sm shadow-sm focus-ring"
                    >
                        {currentSegmentIndex < segments.length - 1 ? "Next Segment" : "Finish Story"}
                    </button>
                </div>
            </div>
        );
    }

    if (view === "question") {
        if (currentQuestions.length === 0) {
            return (
                <div className="max-w-xl mx-auto glass-panel p-10 mt-12 text-center">
                    <p>No questions loaded for this segment.</p>
                    <button onClick={() => handleFeedbackSubmit("No questions found", [])} className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded mt-4">Continue</button>
                </div>
            );
        }
        return (
            <SegmentFeedback
                questions={currentQuestions}
                onSubmit={handleFeedbackSubmit}
            />
        );
    }

    return <div>Loading...</div>;
}
