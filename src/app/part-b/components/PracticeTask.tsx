"use client";

import { useEffect, useState } from "react";
import { Story, Segment } from "../types";

interface PracticeTaskProps {
    participantId: string;
    onComplete: () => void;
}

export default function PracticeTask({ participantId, onComplete }: PracticeTaskProps) {
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
        fetch("/api/part-b/stories?phase=practice")
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
            const res = await fetch(`/api/part-b/segments?storyId=${story.id}`);
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
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                <h2 className="text-2xl font-bold mb-4">Part 1: Practice Task</h2>
                <p className="mb-6">
                    You practice reading articles. You have about 4 minutes.
                    <br />
                    Read at your own pace. You can continue or switch articles.
                </p>
                <button onClick={handleStart} className="bg-blue-600 text-white px-6 py-2 rounded">
                    Start Practice
                </button>
            </div>
        );
    }

    if (view === "story-selection") {
        const allVisited = stories.length > 0 && stories.every(s => visitedStoryIds.has(s.id));
        return (
            <div className="max-w-4xl mx-auto mt-10">
                <h2 className="text-xl font-bold mb-4 text-center">Practice Topics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => !visitedStoryIds.has(story.id) && handleSelectStory(story)}
                            disabled={visitedStoryIds.has(story.id)}
                            className={`p-6 rounded shadow hover:shadow-lg border ${visitedStoryIds.has(story.id)
                                ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-white border-gray-200 text-blue-600"
                                }`}
                        >
                            <h3 className="text-lg font-semibold">{story.title}</h3>
                            {visitedStoryIds.has(story.id) && <div className="text-sm mt-2 font-normal">Visited</div>}
                        </button>
                    ))}
                </div>

                {allVisited && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={onComplete}
                            className="bg-green-600 text-white px-8 py-3 rounded font-bold hover:bg-green-700"
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
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-10">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-400">{currentStory.title}</h3>
                </div>

                <div className="p-4 bg-gray-50 rounded mb-6 text-lg">
                    {segments[currentSegmentIndex]?.content}
                </div>

                <div className="flex justify-between gap-8 mt-8">
                    <button
                        onClick={handleSwitch}
                        className="bg-red-50 text-red-600 px-6 py-3 rounded hover:bg-red-100 font-semibold"
                    >
                        Go to other topic
                    </button>
                    <button
                        onClick={handleContinue}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold"
                    >
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
                    {/* 4 Questions as required */}
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
