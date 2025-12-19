"use client";

import { useEffect, useState } from "react";
import { Story, Segment, Question } from "../../part-b/types";
import SegmentFeedback from "./SegmentFeedback";

interface PracticeTaskProps {
    participantId: string;
    onComplete: () => void;
}

type ViewState = "instructions" | "story-selection" | "reading" | "question";

export default function PracticeTask({ participantId, onComplete }: PracticeTaskProps) {
    const [view, setView] = useState<ViewState>("instructions");
    const [stories, setStories] = useState<Story[]>([]);
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<number>>(new Set());

    // Current Story State
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);

    // Pending Action (what to do after question)
    const [pendingAction, setPendingAction] = useState<"continue" | "switch" | null>(null);

    useEffect(() => {
        fetch("/api/part-c/stories?phase=practice")
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error(err));
    }, []);

    // Fetch questions when story changes (or all at once? fetching per story for now)
    // Actually part-c/questions returns all. I'll filter.
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    useEffect(() => {
        fetch("/api/part-c/questions?phase=practice")
            .then(res => res.json())
            .then(data => setAllQuestions(data))
            .catch(err => console.error(err));
    }, []);

    const handleStart = () => {
        setView("story-selection");
    };

    const handleSelectStory = async (story: Story) => {
        setCurrentStory(story);
        try {
            const res = await fetch(`/api/part-c/segments?storyId=${story.id}&phase=practice`);
            const data = await res.json();
            setSegments(data);

            // Filter questions for this story
            const storyQuestions = allQuestions.filter(q => q.story_id === story.id);
            setQuestions(storyQuestions);

            setCurrentSegmentIndex(0);
            setView("reading");
            setVisitedStoryIds(prev => new Set(prev).add(story.id));
        } catch (error) {
            console.error(error);
        }
    };

    const triggerQuestion = (action: "continue" | "switch") => {
        setPendingAction(action);
        setView("question");
    };

    // New handler for feedback (summary + ratings)
    const handleFeedbackSubmit = async (summary: string, ratings: { questionId: number, value: number }[]) => {
        const currentSegment = segments[currentSegmentIndex];

        try {
            await fetch("/api/part-c/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase: "practice",
                    storyId: currentStory?.id,
                    segmentOrder: currentSegment.segment_order,
                    summary,
                    responses: ratings.map(r => ({
                        questionId: r.questionId,
                        value: r.value,
                        isCorrect: false, // Ratings have no correct answer
                        reactionTimeMs: 0
                    }))
                })
            });
        } catch (e) {
            console.error("Failed to submit response", e);
        }

        // Proceed based on pending action
        if (pendingAction === "switch") {
            setView("story-selection");
        } else if (pendingAction === "continue") {
            if (currentSegmentIndex < segments.length - 1) {
                setCurrentSegmentIndex(prev => prev + 1);
                setView("reading");
            } else {
                // End of story -> back to selection
                setView("story-selection");
            }
        }
        setPendingAction(null);
    };

    // Filter questions for the current segment
    // Logic: Questions are block of 4 per segment.
    // 1-based Segment Order -> (order-1)*4 + 1 to +4
    const segOrder = segments[currentSegmentIndex]?.segment_order || 1;
    const startOrder = (segOrder - 1) * 4 + 1;
    const endOrder = startOrder + 3;

    // Sort logic requires questions to have a valid question_order
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
                    Read at your own pace. You can continue or switch articles.
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

    if (view === "story-selection") {
        const allVisited = stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id));
        return (
            <div className="max-w-5xl mx-auto mt-12 px-6">
                <h2 className="text-2xl font-semibold mb-8 text-center text-[var(--foreground)]">Practice Topics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => handleSelectStory(story)}
                            className={`p-8 rounded-xl border text-left transition-all duration-200 bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:shadow-sm`}
                        >
                            <h3 className="text-lg font-medium">{story.title}</h3>
                            {visitedStoryIds.has(story.id) && <div className="text-xs mt-3 font-medium text-[var(--muted)] uppercase tracking-wide">Visited</div>}
                        </button>
                    ))}
                </div>

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

    if (view === "reading" && currentStory && segments[currentSegmentIndex]) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest">{currentStory.title}</h3>
                    <span className="text-xs text-[var(--muted)]">Segment {currentSegmentIndex + 1}/{segments.length}</span>
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
            // Fallback: This shouldn't happen if data populated correctly. 
            // We can show a simple "Continue" button or auto-submit empty.
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

    return <div className="p-12 text-center">Loading...</div>;
}
