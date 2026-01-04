"use client";

import { useEffect, useState } from "react";
import { Question } from "../../part-b/types";
import SegmentFeedback from "./SegmentFeedback";

interface Story {
    id: string;
    title: string;
}

interface Segment {
    id: string;
    story_id: string;
    content: string;
    segment_order: number;
    pass_id?: string;
    con_id?: string;
}

interface PracticeTaskProps {
    participantId: string;
    onComplete: () => void;
}

// ... types and imports
interface Subtopic {
    id: string;
    title: string;
    topic_id: string;
}

type ViewState = "instructions" | "subtopic-selection" | "reading" | "question";

export default function PracticeTask({ participantId, onComplete }: PracticeTaskProps) {
    const [view, setView] = useState<ViewState>("instructions");
    // const [stories, setStories] = useState<Story[]>([]); // Topic selection removed
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<string>>(new Set());

    // const [currentStory, setCurrentStory] = useState<Story | null>(null); // Removed
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [currentSubtopic, setCurrentSubtopic] = useState<Subtopic | null>(null);
    const [readingStartTime, setReadingStartTime] = useState<number>(0);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAction, setPendingAction] = useState<"continue" | "switch" | null>(null);

    useEffect(() => {
        // Fetch all subtopics directly
        fetch("/api/part-c/subtopics?phase=practice")
            .then(res => res.json())
            .then(data => setSubtopics(data))
            .catch(err => console.error(err));
    }, []);

    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    useEffect(() => {
        fetch("/api/part-c/questions?phase=practice")
            .then(res => res.json())
            .then(data => setAllQuestions(data))
            .catch(err => console.error(err));
    }, []);

    const handleStart = () => {
        setView("subtopic-selection");
    };

    const handleSelectSubtopic = async (subtopic: Subtopic) => {
        setCurrentSubtopic(subtopic);

        try {
            const res = await fetch(`/api/part-c/segments?storyId=${subtopic.topic_id}&subtopicId=${subtopic.id}&phase=practice&participantId=${participantId}`);
            const data = await res.json();
            setSegments(data);

            const storyQuestions = allQuestions.filter(q =>
                String(q.story_id) === String(subtopic.topic_id) &&
                String(q.subtopic_id) === String(subtopic.id)
            );
            setQuestions(storyQuestions);

            setCurrentSegmentIndex(0);
            setReadingStartTime(Date.now());
            setView("reading");
            setVisitedStoryIds(prev => new Set(prev).add(subtopic.id)); // Use subtopic ID for visited tracking now? Or topic? User said "visitedStoryIds" -> keeping var name but storing subtopic ID seems logical if skipping topics.
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
        const passRT = Date.now() - (readingStartTime || Date.now());

        try {
            await fetch("/api/part-c/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase: "practice",
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

        if (pendingAction === "switch") {
            if (currentSubtopic) {
                setVisitedStoryIds(prev => new Set(prev).add(currentSubtopic.id));
            }
            setView("subtopic-selection");
        } else if (pendingAction === "continue") {
            if (currentSegmentIndex < segments.length - 1) {
                setCurrentSegmentIndex(prev => prev + 1);
                setReadingStartTime(Date.now());
                setView("reading");
            } else {
                if (currentSubtopic) {
                    setVisitedStoryIds(prev => new Set(prev).add(currentSubtopic.id));
                }
                setView("subtopic-selection");
            }
        }
        setPendingAction(null);
    };

    const segOrder = segments[currentSegmentIndex]?.segment_order || 1;
    const startOrder = (segOrder - 1) * 4 + 1;
    const endOrder = startOrder + 3;
    const currentQuestions = questions
        .filter(q => q.question_order !== undefined && q.question_order >= startOrder && q.question_order <= endOrder)
        .sort((a, b) => (a.question_order || 0) - (b.question_order || 0));


    if (view === "instructions") {
        return (
            <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center">
                <h2 className="text-3xl font-semibold mb-6 tracking-tight text-[var(--foreground)]">Part 3: Practice Task</h2>
                <p className="mb-8 text-[var(--muted)] text-base leading-relaxed">
                    You practice reading articles.
                    <br />
                    Select a subtopic to read.
                    <br />
                    After each segment, you will answer a few feedback questions.
                </p>
                <button
                    type="button"
                    onClick={handleStart}
                    className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all focus-ring"
                >
                    Start Practice
                </button>
            </div>
        );
    }

    if (view === "subtopic-selection") {
        const allVisited = subtopics.length > 0 && subtopics.every(sub => visitedStoryIds.has(sub.id));

        return (
            <div className="w-full h-full flex flex-col p-6">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col mt-8">
                    <div className="flex justify-between items-end mb-12 border-b border-[var(--border)] pb-6">
                        <div>
                            <h2 className="text-3xl font-serif font-medium text-[var(--foreground)] mb-2">Practice Subtopics</h2>
                            <p className="text-[var(--muted)]">Choose a subtopic to begin reading.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                        {subtopics.map(sub => {
                            const isVisited = visitedStoryIds.has(sub.id);
                            return (
                                <button
                                    type="button"
                                    key={sub.id}
                                    onClick={() => !isVisited && handleSelectSubtopic(sub)}
                                    disabled={isVisited}
                                    className={`relative p-8 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-48 group overflow-hidden ${isVisited
                                        ? "bg-[var(--input-bg)] border-transparent text-[var(--muted)]"
                                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:-translate-y-1"
                                        }`}
                                >
                                    <div className="relative z-10">
                                        <h3 className={`text-xl font-serif font-medium mb-2 ${!isVisited && "group-hover:text-[var(--primary)]"} transition-colors`}>
                                            {sub.title}
                                        </h3>
                                        <div className="w-8 h-1 bg-[var(--border)] group-hover:bg-[var(--primary)] transition-colors rounded-full" />
                                    </div>

                                    {isVisited && (
                                        <span className="absolute bottom-6 right-6 text-xs font-bold uppercase tracking-widest text-[var(--muted)] border border-[var(--border)] px-3 py-1 rounded-full">
                                            Completed
                                        </span>
                                    )}

                                    {!isVisited && (
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--primary)]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {allVisited && (
                        <div className="mt-auto pt-8 text-center">
                            <button
                                type="button"
                                onClick={onComplete}
                                className="bg-[var(--primary)] text-[var(--primary-fg)] px-10 py-4 rounded-full font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm uppercase tracking-widest"
                            >
                                Continue to Next Part
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                         <button
                            type="button"
                            onClick={onComplete}
                            className="text-[var(--muted)] underline hover:text-[var(--foreground)] text-sm"
                        >
                            Skip Practice
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "reading" && currentSubtopic) {
        const currentSegment = segments[currentSegmentIndex];
        const progress = segments.length > 0 ? ((currentSegmentIndex + 1) / segments.length) * 100 : 0;

        return (
            <div className="fixed inset-0 z-50 bg-[var(--surface)] flex flex-col h-screen w-screen">
                <div className="shrink-0 h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded">
                            Practice
                        </span>
                        <h1 className="text-sm font-semibold text-[var(--foreground)] truncate max-w-md">
                            {currentSubtopic.title}
                        </h1>
                    </div>
                    <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                        Segment {currentSegmentIndex + 1}/{segments.length}
                    </div>
                </div>

                <div className="h-1 w-full bg-[var(--input-bg)] shrink-0">
                    <div 
                        className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto relative bg-[var(--background)] scroll-smooth">
                    <div className="min-h-full w-full max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 flex flex-col items-center">
                        {!currentSegment ? (
                            <div className="flex flex-col items-center justify-center h-64 text-[var(--muted)] animate-pulse">
                                <p>Loading segment...</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <p className="text-xl md:text-2xl leading-loose font-serif text-[var(--foreground)] antialiased text-left border-l-4 border-[var(--border)] pl-6 py-2">
                                    {currentSegment.content}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 p-6 bg-[var(--surface)] border-t border-[var(--border)] z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                        <button
                            type="button"
                            onClick={() => triggerQuestion("switch")}
                            className="px-6 py-3 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors text-sm font-medium uppercase tracking-wider focus-ring"
                        >
                            Switch Subtopic
                        </button>
                        <button
                            type="button"
                            onClick={() => triggerQuestion("continue")}
                            disabled={!currentSegment}
                            className="bg-[var(--primary)] text-[var(--primary-fg)] px-8 py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all font-semibold text-sm shadow-md hover:shadow-lg focus-ring uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {currentSegmentIndex < segments.length - 1 ? "Next Segment" : "Finish Subtopic"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "question") {
        return (
            <SegmentFeedback
                onSubmit={handleFeedbackSubmit}
            />
        );
    }

    return <div className="p-12 text-center">Loading...</div>;
}
