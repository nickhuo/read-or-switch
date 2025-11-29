"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = "instructions" | "practice" | "formal" | "finished";
type View = "story-selection" | "reading" | "decision" | "summary";

interface Story {
    id: number;
    title: string;
    phase: "practice" | "formal";
}

interface Segment {
    id: number;
    content: string;
    segment_order: number;
    is_predictable: boolean;
}

export default function PartBPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participant_id");

    // Global State
    const [phase, setPhase] = useState<Phase>("instructions");
    const [timeLeft, setTimeLeft] = useState(0); // Seconds
    const [view, setView] = useState<View>("story-selection");

    // Data State
    const [stories, setStories] = useState<Story[]>([]);
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Timer Logic
    useEffect(() => {
        if (phase === "instructions" || phase === "finished") return;

        if (timeLeft <= 0) {
            handlePhaseTimeout();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [phase, timeLeft]);

    // Fetch Stories when phase changes
    useEffect(() => {
        if (phase === "practice" || phase === "formal") {
            fetchStories(phase);
        }
    }, [phase]);

    const fetchStories = async (currentPhase: string) => {
        try {
            const res = await fetch(`/api/part-b/stories?phase=${currentPhase}`);
            if (!res.ok) throw new Error("Failed to fetch stories");
            const data = await res.json();
            setStories(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load stories.");
        }
    };

    const startPractice = () => {
        setPhase("practice");
        setTimeLeft(240); // 4 minutes
        setView("story-selection");
    };

    const startFormal = () => {
        setPhase("formal");
        setTimeLeft(900); // 15 minutes
        setView("story-selection");
    };

    const handlePhaseTimeout = () => {
        if (phase === "practice") {
            alert("Practice phase complete. Moving to Formal Task.");
            startFormal();
        } else if (phase === "formal") {
            setPhase("finished");
        }
    };

    const handleSelectStory = async (story: Story) => {
        setCurrentStory(story);
        try {
            const res = await fetch(`/api/part-b/segments?storyId=${story.id}`);
            if (!res.ok) throw new Error("Failed to fetch segments");
            const data = await res.json();
            setSegments(data);
            setCurrentSegmentIndex(0);
            setView("reading");

            // Log start story action
            logAction(story.id, null, "start_story", 0);
        } catch (error) {
            console.error(error);
            alert("Failed to load story segments.");
        }
    };

    const handleContinue = () => {
        if (currentSegmentIndex < segments.length - 1) {
            setCurrentSegmentIndex((prev) => prev + 1);
            setView("reading");
            logAction(currentStory!.id, segments[currentSegmentIndex].id, "continue", 0); // TODO: Add real reading time
        } else {
            alert("Story finished! Please select another story.");
            setView("story-selection");
        }
    };

    const handleSwitch = () => {
        setView("story-selection");
        logAction(currentStory!.id, segments[currentSegmentIndex].id, "switch", 0); // TODO: Add real reading time
    };

    const logAction = async (storyId: number, segmentId: number | null, actionType: string, readingTimeMs: number) => {
        try {
            await fetch("/api/part-b/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    storyId,
                    segmentId,
                    actionType,
                    readingTimeMs
                }),
            });
        } catch (error) {
            console.error("Failed to log action", error);
        }
    };

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (!participantId) return <div>Missing Participant ID</div>;

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 p-8 relative">
            {/* Timer Display */}
            {(phase === "practice" || phase === "formal") && (
                <div className="absolute top-4 right-4 text-xl font-mono font-bold text-gray-700">
                    {phase === "practice" ? "Practice" : "Formal"}: {formatTime(timeLeft)}
                </div>
            )}

            {phase === "instructions" && (
                <div className="max-w-2xl bg-white p-8 rounded shadow text-center mt-20">
                    <h1 className="text-2xl font-bold mb-4">Part B: Narrative Text Foraging</h1>
                    <p className="mb-6 text-gray-700">
                        In this task, you will read short stories segment by segment.
                        <br /><br />
                        First, you will have a <strong>4-minute Practice Phase</strong>.
                        <br />
                        Then, you will have a <strong>15-minute Formal Task Phase</strong>.
                        <br /><br />
                        You can choose which story to read. After each segment, you can decide to <strong>Continue</strong> reading the current story or <strong>Switch</strong> to a different one.
                    </p>
                    <button
                        onClick={startPractice}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Start Practice
                    </button>
                </div>
            )}

            {(phase === "practice" || phase === "formal") && view === "story-selection" && (
                <div className="max-w-4xl w-full mt-20">
                    <h2 className="text-2xl font-bold mb-6 text-center">Select a Story</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stories.map((story) => (
                            <button
                                key={story.id}
                                onClick={() => handleSelectStory(story)}
                                className="bg-white p-6 rounded shadow hover:shadow-lg transition-shadow text-left border border-gray-200"
                            >
                                <h3 className="text-xl font-semibold text-blue-600">{story.title}</h3>
                                <p className="text-gray-500 mt-2 text-sm">Click to start reading</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(phase === "practice" || phase === "formal") && view === "reading" && segments.length > 0 && (
                <div className="max-w-2xl w-full bg-white p-8 rounded shadow mt-20">
                    <h2 className="text-xl font-bold mb-2 text-gray-400">{currentStory?.title}</h2>
                    <p className="text-sm text-gray-400 mb-6">Segment {currentSegmentIndex + 1} of {segments.length}</p>

                    <div className="text-lg leading-relaxed text-gray-800 mb-8 p-4 bg-gray-50 rounded">
                        {segments[currentSegmentIndex].content}
                    </div>

                    <div className="flex justify-between gap-4">
                        <button
                            onClick={handleSwitch}
                            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 font-semibold transition-colors"
                        >
                            Switch Story
                        </button>
                        <button
                            onClick={handleContinue}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold transition-colors"
                        >
                            Continue Reading
                        </button>
                    </div>
                </div>
            )}

            {phase === "finished" && (
                <div className="text-center mt-20">
                    <h2 className="text-2xl font-bold">Part B Complete</h2>
                    <p className="mt-4">Thank you for participating.</p>
                </div>
            )}
        </div>
    );
}
