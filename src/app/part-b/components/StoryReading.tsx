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
        if (timeLeft > 0) {
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
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []); // Run once on mount

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectStory = async (story: Story) => {
        setCurrentStory(story);
        try {
            const res = await fetch(`/api/part-b/segments?storyId=${story.id}`);
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
            <div className="max-w-4xl mx-auto mt-10 p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold capitalize">{phase} Phase: Choose a Story</h2>
                    <div className="text-xl font-mono bg-blue-100 px-3 py-1 rounded text-blue-800">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => handleSelectStory(story)}
                            className={`p-6 rounded shadow border text-left hover:shadow-lg transition-all ${visitedStoryIds.has(story.id)
                                    ? "bg-gray-100 border-gray-300"
                                    : "bg-white border-blue-200"
                                }`}
                        >
                            <h3 className={`text-lg font-semibold ${visitedStoryIds.has(story.id) ? "text-gray-600" : "text-blue-800"}`}>
                                {story.title}
                            </h3>
                            {visitedStoryIds.has(story.id) && (
                                <span className="text-xs text-green-700 font-bold block mt-1">Read</span>
                            )}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-12 text-center">
                        <p className="mb-4 text-green-700 font-medium">You have read all stories.</p>
                        <button
                            onClick={onComplete}
                            className="bg-green-600 text-white px-8 py-3 rounded font-bold hover:bg-green-700 shadow"
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
            <div className="max-w-2xl mx-auto bg-white p-10 rounded shadow-md mt-10 relative border-t-4 border-blue-500">
                <div className="absolute top-4 right-4 font-mono font-bold text-gray-400">
                    {formatTime(timeLeft)}
                </div>

                <h3 className="text-xl font-bold mb-6 text-gray-800 text-center">{currentStory.title}</h3>

                <div className="p-6 bg-gray-50 rounded mb-8 text-xl leading-relaxed text-gray-800 font-serif">
                    {segments[currentSegmentIndex]?.content}
                </div>

                <div className="flex justify-between gap-8 mt-4">
                    <button
                        onClick={handleSwitch}
                        className="flex-1 bg-white border-2 border-red-100 text-red-600 px-6 py-3 rounded hover:bg-red-50 font-bold transition-colors"
                    >
                        Switch Story
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-bold shadow-md transition-transform active:scale-95"
                    >
                        Continue
                    </button>
                </div>

                <div className="text-center mt-4 text-gray-400 text-sm">
                    Segment {currentSegmentIndex + 1} of {segments.length}
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}
