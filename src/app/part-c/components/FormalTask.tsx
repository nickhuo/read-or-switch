"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment } from "../types";

interface FormalTaskProps {
    participantId: string;
    onComplete: () => void;
}

export default function FormalTask({ participantId, onComplete }: FormalTaskProps) {
    const [stories, setStories] = useState<Story[]>([]);
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<number>>(new Set());

    const [view, setView] = useState<"instructions" | "story-selection" | "reading" | "interstitial-questions">("instructions");
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Questions
    // Questions state matching PracticeTask
    const [comprehensionQ, setComprehensionQ] = useState("");
    const [learningQ, setLearningQ] = useState(50);
    const [difficultyQ, setDifficultyQ] = useState(50);
    const [interestQ, setInterestQ] = useState(50);

    useEffect(() => {
        // Fetch formal stories (5 subtopics, 11 articles each is the requirement, 
        // but for now we fetch whatever 'formal' stories are in DB and group them or just list them)
        fetch("/api/part-c/stories?phase=formal")
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error("Failed to fetch stories", err));
    }, []);

    // Timer only runs when reading
    useEffect(() => {
        if (view === "reading" && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Time up! But we need to ensure they visited all 5 topics.
                        // Requirement: "Must visit all 5 subtopics to proceed"
                        // If time is up, maybe we force them to finish current questions and then check?
                        // For now, let's just alert.
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
            const res = await fetch(`/api/part-c/segments?storyId=${story.id}`);
            const data = await res.json();
            setSegments(data);
            setCurrentSegmentIndex(0);
            setView("reading");
            // Do NOT mark as visited here, only on switch or finish
        } catch (error) {
            console.error(error);
        }
    };

    const handleContinue = () => {
        if (currentSegmentIndex < segments.length - 1) {
            setCurrentSegmentIndex(prev => prev + 1);
        } else {
            if (currentStory) {
                setVisitedStoryIds(prev => new Set(prev).add(currentStory.id));
            }
            setView("interstitial-questions");
        }
    };

    const handleSwitch = () => {
        if (currentStory) {
            setVisitedStoryIds(prev => new Set(prev).add(currentStory.id));
        }
        setView("interstitial-questions");
    };

    const handleSubmitQuestions = () => {
        setView("story-selection");
        // Reset questions
        setComprehensionQ("");
        setLearningQ(50);
        setDifficultyQ(50);
        setInterestQ(50);

        // Check completion condition
        // "Must visit all 5 subtopics to proceed" - assuming 'stories' from API are the subtopics?
        // Or if stories are articles within subtopics, we need to track subtopics.
        // For simplified implementation, assuming we just need to visit all 'stories' presented.
        const allVisited = stories.every(s => visitedStoryIds.has(s.id));
        if (allVisited && timeLeft <= 0) {
            onComplete();
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (view === "instructions") {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                <h2 className="text-2xl font-bold mb-4">Part 2: Formal Task</h2>
                <p className="mb-6">
                    You have 15 minutes to read.
                    <br />
                    You must visit all available topics.
                </p>
                <button onClick={handleStart} className="bg-blue-600 text-white px-6 py-2 rounded">
                    Start Formal Task
                </button>
            </div>
        );
    }

    if (view === "story-selection") {
        const allVisited = stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id));
        return (
            <div className="max-w-4xl mx-auto mt-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Formal Topics</h2>
                    <div className="text-xl font-mono">{formatTime(timeLeft)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => !visitedStoryIds.has(story.id) && handleSelectStory(story)}
                            disabled={visitedStoryIds.has(story.id)}
                            className={`p-6 rounded shadow border text-left ${visitedStoryIds.has(story.id)
                                ? "bg-gray-200 border-gray-300 cursor-not-allowed text-gray-500"
                                : "bg-white border-blue-200 hover:shadow-lg"
                                }`}
                        >
                            <h3 className={`text-lg font-semibold ${visitedStoryIds.has(story.id) ? "text-gray-600" : "text-blue-800"}`}>{story.title}</h3>
                            {visitedStoryIds.has(story.id) && <span className="text-xs text-green-700 font-bold block mt-1">Visited</span>}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-8 text-center">
                        <button onClick={onComplete} className="bg-green-600 text-white px-8 py-3 rounded font-bold shadow">
                            Completing Part 2
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === "reading" && currentStory) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-10 relative">
                <div className="absolute top-4 right-4 font-mono font-bold text-gray-500">
                    {formatTime(timeLeft)}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-400">{currentStory.title}</h3>
                <div className="p-4 bg-gray-50 rounded mb-6 text-lg">
                    {segments[currentSegmentIndex]?.content}
                </div>

                <div className="flex justify-between gap-8 mt-8">
                    {/* "Positioned far apart" */}
                    <button onClick={handleSwitch} className="bg-red-50 text-red-600 px-6 py-3 rounded hover:bg-red-100 font-semibold">
                        Go to other topic
                    </button>
                    <button onClick={handleContinue} className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold">
                        Continue to next article
                    </button>
                </div>
            </div>
        );
    }

    if (view === "interstitial-questions") {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-10">
                <h2 className="text-xl font-bold mb-6">Questions</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block font-medium mb-2">1. Short Comprehension (Summary)</label>
                        <textarea
                            className="w-full border p-2 rounded"
                            rows={3}
                            value={comprehensionQ}
                            onChange={(e) => setComprehensionQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-2">2. How much did you learn? ({learningQ})</label>
                        <input type="range" min="0" max="100" value={learningQ} onChange={(e) => setLearningQ(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label className="block font-medium mb-2">3. How difficult was this? ({difficultyQ})</label>
                        <input type="range" min="0" max="100" value={difficultyQ} onChange={(e) => setDifficultyQ(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label className="block font-medium mb-2">4. How interesting was this? ({interestQ})</label>
                        <input type="range" min="0" max="100" value={interestQ} onChange={(e) => setInterestQ(Number(e.target.value))} className="w-full" />
                    </div>

                    <button onClick={handleSubmitQuestions} className="w-full bg-blue-600 text-white py-2 rounded font-bold mt-4">
                        Submit & Continue
                    </button>
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}
