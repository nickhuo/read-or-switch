"use client";

import { useEffect, useState } from "react";
import { Story, Segment } from "../types";

interface PracticeTaskProps {
    participantId: string;
    onComplete: () => void;
}

export default function PracticeTask({ participantId, onComplete }: PracticeTaskProps) {
    void participantId;

    const [view, setView] = useState<"instructions" | "story-selection" | "reading" | "interstitial-questions">("instructions");
    const [stories, setStories] = useState<Story[]>([]);
    const [visitedStoryIds, setVisitedStoryIds] = useState<Set<number>>(new Set());
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Question State
    const [comprehensionQ, setComprehensionQ] = useState("");
    const [learningQ, setLearningQ] = useState(50); // How much did you learn?
    // Added 2 more dummy questions to match "4 questions" requirement
    const [difficultyQ, setDifficultyQ] = useState(50);
    const [interestQ, setInterestQ] = useState(50);

    useEffect(() => {
        // Fetch practice stories
        fetch("/api/part-c/stories?phase=practice")
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error("Failed to fetch stories", err));
    }, []);

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
            // Log start story (mock)
        } catch (error) {
            console.error(error);
        }
    };

    const handleContinue = () => {
        if (currentSegmentIndex < segments.length - 1) {
            setCurrentSegmentIndex(prev => prev + 1);
        } else {
            // End of story
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

    const handleSubmitQuestions = async () => {
        // Mock save response
        setView("story-selection");
        // Reset questions
        setComprehensionQ("");
        setLearningQ(50);
        setDifficultyQ(50);
        setInterestQ(50);
    };

    // Note: No timer enforcing "finish" here. The parent orchestrator handles the global 4-minute timer? 
    // Or users just practice until they feel ready? 
    // Requirement says " Practice Task (~4 minutes)". Usually fixed time.
    // Logic: The orchestrator will likely switch the phase after 4 minutes.

    if (view === "instructions") {
        return (
            <div className="max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center">
                <h2 className="text-3xl font-semibold mb-6 tracking-tight text-[var(--foreground)]">Part 1: Practice Task</h2>
                <p className="mb-8 text-[var(--muted)] text-base leading-relaxed">
                    You practice reading articles. You have about 4 minutes.
                    <br />
                    Read at your own pace. You can continue or switch articles.
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
                            onClick={() => !visitedStoryIds.has(story.id) && handleSelectStory(story)}
                            disabled={visitedStoryIds.has(story.id)}
                            className={`p-8 rounded-xl border text-left transition-all duration-200 ${visitedStoryIds.has(story.id)
                                ? "bg-[var(--input-bg)] border-transparent text-[var(--muted)] cursor-not-allowed"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:shadow-sm"
                                }`}
                        >
                            <h3 className="text-lg font-medium">{story.title}</h3>
                            {visitedStoryIds.has(story.id) && <div className="text-xs mt-3 font-medium text-[var(--muted)] uppercase tracking-wide">Visited</div>}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={onComplete}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Finish Practice Task
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === "reading" && currentStory) {
        return (
            <div className="max-w-3xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest">{currentStory.title}</h3>
                </div>

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
                    {/* 4 Questions as required */}
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
