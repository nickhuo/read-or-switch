"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment } from "../types";

interface FormalTaskProps {
    participantId: string;
    onComplete: () => void;
}

export default function FormalTask({ participantId, onComplete }: FormalTaskProps) {
    void participantId;

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
                            onClick={() => !visitedStoryIds.has(story.id) && handleSelectStory(story)}
                            disabled={visitedStoryIds.has(story.id)}
                            className={`p-6 rounded-xl border text-left transition-all duration-200 min-h-[120px] flex flex-col justify-between ${visitedStoryIds.has(story.id)
                                ? "bg-[var(--input-bg)] border-transparent text-[var(--muted)] cursor-not-allowed"
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

    if (view === "reading" && currentStory) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 relative">
                <div className="absolute top-6 right-8 font-mono font-medium text-[var(--muted)] text-sm bg-[var(--input-bg)] px-2 py-1 rounded">
                    {formatTime(timeLeft)}
                </div>
                <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest mb-6">{currentStory.title}</h3>

                <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-8 text-lg leading-loose text-[var(--foreground)] min-h-[200px]">
                    {segments[currentSegmentIndex]?.content}
                </div>

                <div className="flex justify-between gap-6">
                    <button
                        onClick={handleSwitch}
                        className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors font-medium text-sm"
                    >
                        Switch Topic
                    </button>
                    <button
                        onClick={handleContinue}
                        className="bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium text-sm shadow-sm focus-ring"
                    >
                        Next Segment
                    </button>
                </div>
            </div>
        );
    }

    if (view === "interstitial-questions") {
        return (
            <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <h2 className="text-xl font-semibold mb-8 text-[var(--foreground)]">Quick Check</h2>

                <div className="space-y-8">
                    {/* Questions */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">1. Short Comprehension (Summary)</label>
                        <textarea
                            className="w-full border border-[var(--border)] bg-[var(--surface)] p-3 rounded-lg focus-ring text-sm"
                            rows={3}
                            placeholder="Briefly summarize what you just read..."
                            value={comprehensionQ}
                            onChange={(e) => setComprehensionQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">2. How much did you learn? ({learningQ})</label>
                        <input type="range" min="0" max="100" value={learningQ} onChange={(e) => setLearningQ(Number(e.target.value))} className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">3. How difficult was this? ({difficultyQ})</label>
                        <input type="range" min="0" max="100" value={difficultyQ} onChange={(e) => setDifficultyQ(Number(e.target.value))} className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">4. How interesting was this? ({interestQ})</label>
                        <input type="range" min="0" max="100" value={interestQ} onChange={(e) => setInterestQ(Number(e.target.value))} className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]" />
                    </div>

                    <button onClick={handleSubmitQuestions} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-sm focus-ring">
                        Submit & Continue
                    </button>
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}
