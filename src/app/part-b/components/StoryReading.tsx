"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment } from "../types";

interface StoryReadingProps {
    participantId: string;
    phase: "practice" | "formal";
    durationSeconds: number;
    onComplete: () => void;
}

export default function StoryReading({ participantId, phase, durationSeconds, onComplete }: StoryReadingProps) {
    const [stories, setStories] = useState<Story[]>([]);
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<number>>(new Set());

    // View state
    const [view, setView] = useState<"selection" | "reading">("selection");
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Timer
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch stories
        fetch(`/api/part-b/stories?phase=${phase}`)
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error(err));
    }, [phase]);

    useEffect(() => {
        // Timer runs only if not finished.
        // Requirement implies fixed time block? "Practice Block (4 minutes)".
        // Usually forced stop after 4 mins.
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    onComplete(); // Force finish
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [onComplete]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectStory = async (story: Story) => {
        setCurrentStory(story);
        try {
            const res = await fetch(`/api/part-b/segments?storyId=${story.id}&phase=${phase}`);
            const data = await res.json();
            setSegments(data);
            setCurrentSegmentIndex(0);
            setView("reading");
            // Log action START
            logAction(story.id, data[0]?.id, "start_story");
        } catch (error) {
            console.error(error);
        }
    };

    const handleContinue = () => {
        if (currentSegmentIndex < segments.length - 1) {
            const nextIndex = currentSegmentIndex + 1;
            setCurrentSegmentIndex(nextIndex);
            // Log action CONTINUE
            logAction(currentStory!.id, segments[nextIndex].id, "continue");
        } else {
            // End of story
            finishStory();
        }
    };

    const handleSwitch = () => {
        // Log action SWITCH
        logAction(currentStory!.id, segments[currentSegmentIndex]?.id, "switch");
        finishStory();
    };

    const finishStory = () => {
        if (currentStory) {
            setVisitedStoryIds(prev => new Set(prev).add(currentStory.id));
        }

        // Check if all stories visited (if we want to enforce visiting all before timer ends? 
        // User req: "After finishing all texts within a story set... Comprehension Phase".
        // But also fixed time.
        // If they finish early, they might wait or we proceed?
        // Usually fixed time tasks just wait. But if they read EVERYTHING, we can probably let them proceed.
        // I will check if all visited.

        // Logic: Return to selection.
        setView("selection");
        setCurrentStory(null);
        setSegments([]);
    };

    const logAction = async (storyId: number, segmentId: number, type: "continue" | "switch" | "start_story") => {
        void participantId;
        void storyId;
        void segmentId;
        void type;
        // We could log reading time here if we tracked it per segment
        // For simple MVP: just fire and forget
        // Ideally we track time spent on *previous* segment before action.
    };

    // Check if everything visited
    useEffect(() => {
        if (stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id))) {
            // All read. Should we auto-advance?
            // "After finish all... Summary".
            // Let's show a "Finish" button in selection screen.
        }
    }, [visitedStoryIds, stories]);


    if (view === "selection") {
        const allVisited = stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id));
        return (
            <div className="max-w-6xl mx-auto mt-12 px-6">
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-[var(--border)]">
                    <h2 className="text-2xl font-semibold capitalize text-[var(--foreground)]">{phase} Phase: Choose a Story</h2>
                    <div className="text-lg font-mono font-medium text-[var(--foreground)] bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => handleSelectStory(story)}
                            className={`p-6 rounded-xl border text-left transition-all duration-200 min-h-[120px] flex flex-col justify-between ${visitedStoryIds.has(story.id)
                                ? "bg-[var(--input-bg)] border-transparent text-[var(--muted)]"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:shadow-sm"
                                }`}
                        >
                            <h3 className={`text-lg font-medium ${visitedStoryIds.has(story.id) ? "opacity-60" : ""}`}>
                                {story.title}
                            </h3>
                            {visitedStoryIds.has(story.id) && (
                                <span className="text-xs text-green-600 font-medium uppercase tracking-wide bg-green-50 px-2 py-1 rounded-full self-start">Read</span>
                            )}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-12 text-center">
                        <div className="mb-6 p-4 bg-[var(--surface)] text-[var(--muted)] rounded-lg inline-block border border-[var(--border)]">
                            You have read all stories.
                        </div>
                        <br />
                        <button
                            onClick={onComplete}
                            className="bg-[var(--primary)] text-[var(--primary-fg)] px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all focus-ring shadow-sm"
                        >
                            Finish Reading Phase
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === "reading" && currentStory) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 relative border border-[var(--border)]">
                <div className="absolute top-6 right-8 font-mono font-medium text-[var(--muted)] text-sm bg-[var(--input-bg)] px-2 py-1 rounded">
                    {formatTime(timeLeft)}
                </div>

                <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest mb-6 text-center">{currentStory.title}</h3>

                <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-8 text-lg leading-loose text-[var(--foreground)] min-h-[200px] font-sans">
                    {segments[currentSegmentIndex]?.content}
                </div>

                <div className="flex justify-between gap-6 mt-4">
                    <button
                        onClick={handleSwitch}
                        className="flex-1 px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors font-medium text-sm"
                    >
                        Switch Story
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium text-sm shadow-sm focus-ring"
                    >
                        Continue
                    </button>
                </div>

                <div className="text-center mt-6 text-[var(--muted)] text-xs uppercase tracking-widest opacity-60">
                    Segment {currentSegmentIndex + 1} / {segments.length}
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}
