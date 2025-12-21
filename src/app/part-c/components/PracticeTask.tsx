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
            <div className="max-w-5xl mx-auto mt-12 px-6">
                <h2 className="text-2xl font-semibold mb-8 text-center text-[var(--foreground)]">Practice Subtopics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subtopics.map(sub => {
                        const isVisited = visitedStoryIds.has(sub.id);
                        return (
                            <button
                                key={sub.id}
                                onClick={() => !isVisited && handleSelectSubtopic(sub)}
                                disabled={isVisited}
                                className={`p-8 rounded-xl border text-left transition-all duration-200 ${isVisited
                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:shadow-sm"
                                    }`}
                            >
                                <h3 className="text-lg font-medium">{sub.title}</h3>
                                {isVisited && <div className="text-xs mt-3 font-medium text-[var(--muted)] uppercase tracking-wide">Visited</div>}
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

                <div className="mt-12 text-center">
                    <button
                        onClick={onComplete}
                        className="text-[var(--muted)] underline hover:text-[var(--foreground)]"
                    >
                        Skip Practice
                    </button>
                </div>
            </div>
        );
    }

    if (view === "reading" && currentSubtopic && segments[currentSegmentIndex]) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-1">
                            {currentSubtopic.title}
                        </div>
                        <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest hidden">Reading</h3>
                    </div>
                    <span className="text-xs text-[var(--muted)]">Segment {currentSegmentIndex + 1}/{segments.length}</span>
                </div>

                <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-8 text-lg leading-loose text-[var(--foreground)] flex-grow font-sans">
                    {segments[currentSegmentIndex].content}
                </div>

                <div className="flex justify-between gap-6 mt-auto">
                    <button
                        onClick={() => triggerQuestion("switch")}
                        className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors font-medium text-sm"
                    >
                        Go to Other Subtopics
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
                questions={[]}
                onSubmit={handleFeedbackSubmit}
            />
        );
    }

    return <div className="p-12 text-center">Loading...</div>;
}
