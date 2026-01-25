"use client";

import { useEffect, useState, useRef } from "react";
import { Story, Segment, Question } from "../../part-b/types";
import SegmentFeedback from "./SegmentFeedback";
import SummaryInput from "./SummaryInput";

interface FormalTaskProps {
    participantId: string;
    onComplete: () => void;
}

// ... types
interface Subtopic {
    id: string;
    title: string;
    topic_id: string;
}

type ViewState = "instructions" | "subtopic-selection" | "reading" | "question" | "summary";

export default function FormalTask({ participantId, onComplete }: FormalTaskProps) {
    // const [stories, setStories] = useState<Story[]>([]); // Removed
    const [visitedSubtopicIds, setVisitedSubtopicIds] = useState<Set<string>>(new Set());

    const [view, setView] = useState<ViewState>("instructions");
    // const [currentStory, setCurrentStory] = useState<Story | null>(null); // Topic concept removed from UI
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [currentSubtopic, setCurrentSubtopic] = useState<Subtopic | null>(null);
    const [readingStartTime, setReadingStartTime] = useState<number>(0);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAction, setPendingAction] = useState<"continue" | "switch" | null>(null);

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch all subtopics directly
        fetch("/api/part-c/subtopics?phase=formal")
            .then(res => res.json())
            .then(data => setSubtopics(data))
            .catch(err => console.error("Failed to fetch subtopics", err));
    }, []);

    // Fetch all Formal questions
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    useEffect(() => {
        fetch("/api/part-c/questions?phase=formal")
            .then(res => res.json())
            .then(data => setAllQuestions(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        // Run timer ONLY when reading
        if (view === "reading" && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Time up logic could go here
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
        setView("subtopic-selection");
    };

    // handleSelectTopic removed

    const handleSelectSubtopic = async (subtopic: Subtopic) => {
        setCurrentSubtopic(subtopic);

        try {
            // Need topicId for the segments API? Yes, it corresponds to 'storyId' param which maps to 'topID'
            const res = await fetch(`/api/part-c/segments?storyId=${subtopic.topic_id}&subtopicId=${subtopic.id}&phase=formal&participantId=${participantId}`);
            const data = await res.json();
            setSegments(data);

            // Filter questions. 
            // We match subtopic_id and story_id (topic_id)
            const storyQuestions = allQuestions.filter(q =>
                String(q.story_id) === String(subtopic.topic_id) &&
                String(q.subtopic_id) === String(subtopic.id)
            );
            setQuestions(storyQuestions);

            setCurrentSegmentIndex(0);
            setReadingStartTime(Date.now());
            setView("reading");
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

        // Calculate passRT (Passage Reading Time)
        // We need to track when they *started* reading.
        // Let's assume we add a ref or state for `startReadingTime`.
        // For now, I'll put a placeholder or use a ref if I can inject it.
        // Actually, let's just use a timestamp from when they entered the view.
        // I will add a `readingStartTime` state in the next step.
        const passRT = Date.now() - (readingStartTime || Date.now());

        try {
            await fetch("/api/part-c/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    phase: "formal",
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

        // Logic for next view
        // Logic for next view
        if (pendingAction === "switch") {
            // "Switch Topic" -> Go back to Subtopic Selection list
            if (currentSubtopic) {
                setVisitedSubtopicIds(prev => new Set(prev).add(currentSubtopic.id));
            }
            setView("subtopic-selection");
        } else if (pendingAction === "continue") {
            if (currentSegmentIndex < segments.length - 1) {
                setCurrentSegmentIndex(prev => prev + 1);
                setReadingStartTime(Date.now());
                setView("reading");
            } else {
                // End of passages for this subtopic
                if (currentSubtopic) {
                    setVisitedSubtopicIds(prev => new Set(prev).add(currentSubtopic.id));
                }
                setView("subtopic-selection");
            }
        }
        setPendingAction(null);
    };

    const segOrder = segments[currentSegmentIndex]?.segment_order || 1;
    const startOrder = (segOrder - 1) * 4 + 1;
    const endOrder = startOrder + 3;
    const currentQuestions = questions.filter(q => q.question_order !== undefined && q.question_order >= startOrder && q.question_order <= endOrder);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (view === "instructions") {
        return (
            <div className="max-w-4xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12">
                <h2 className="text-3xl font-semibold mb-6 tracking-tight text-[var(--foreground)] text-center">Formal Task Instruction</h2>
                
                <div className="text-[var(--muted)] text-lg space-y-6 leading-relaxed text-left">
                    <p>
                        Now, it's time for the formal task! You will receive a bonus based on your overall learning performance in the formal task.
                    </p>
                    <p>
                        Your task is to learn about health. There are articles about five health-related topics. The goal is to learn as much as you can about health instead of memorizing the articles word for word. You will have 15 minutes to read and learn about these topics before answering some questions. It is very important for you to pay attention to the articles and do your best to learn from them. Some health topics are more difficult than others, so please try to manage your time effectively to optimize your learning within the time limit.
                    </p>
                    <p>
                        During the 15 minutes, you will select one health topic at a time and read a collection of articles about it. You will see one article at a time and can read at your own pace.
                    </p>
                    <p>
                        After reading each article, you will have a choice:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To continue reading about the same health topic, click <strong>"Read the Next Article."</strong></li>
                        <li>To switch to a new topic, click <strong>"Go to Other Topics."</strong></li>
                    </ul>
                    <p>
                        You only have <strong>15 minutes</strong> to learn about health, so <strong>do your best to concentrate and stay with a topic only as long as you feel you are still learning something.</strong> If the articles for the topic seem too difficult or not helping you learn, you might want to choose to switch to another topic. The choice is yours.
                    </p>
                    <p>
                        Note that there are more articles than you can read fully within 15 minutes, so choose carefully when you continue or switch topics so that you can learn as much information as possible about health.
                    </p>
                    <p>
                        After reading each article, you will be asked to rate how easy the article was, how much new information you thought was in the article, how much you learned from the article, AND how much you learned from all the articles you read so far today. You will be asked to make these ratings on a scale from 0 to 100 by moving the circle:
                    </p>
                    
                    <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] space-y-6">
                        <div>
                            <p className="font-medium text-[var(--foreground)] mb-2">1. Compared to the other articles that you have read today, how much new information was in this article?</p>
                            <ul className="list-disc pl-6 text-sm">
                                <li>0: No New Information</li>
                                <li>100: Completely New Information</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-[var(--foreground)] mb-2">2. How easy was this article to read?</p>
                            <ul className="list-disc pl-6 text-sm">
                                <li>0: Very Difficult</li>
                                <li>100: Very Easy</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-[var(--foreground)] mb-2">3. How much did you learn from this article?</p>
                            <ul className="list-disc pl-6 text-sm">
                                <li>0: Didn't Learn Anything at All</li>
                                <li>100: Learned a Lot</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-[var(--foreground)] mb-2">4. How much did you learn overall from the articles you have read so far today (including this article)?</p>
                            <ul className="list-disc pl-6 text-sm">
                                <li>0: Didn't Learn Anything at All</li>
                                <li>100: Learned a Lot</li>
                            </ul>
                        </div>
                    </div>

                    <p>
                        Again, after reading each article, you can decide to keep reading about this health topic by moving to the next article, or go back to the main page to choose another health topic. Once you decide to leave a topic, you will not be able to return.
                    </p>
                    <p>
                        You will be asked what you have learned at the end of the task. Please try your best to learn as much information about health in 15 minutes.
                    </p>
                    <p>
                        When you are ready, please go to the next page by pressing the <strong>"Start"</strong> button.
                    </p>
                </div>

                <div className="mt-10 text-center">
                    <button
                        type="button"
                        onClick={handleStart}
                        className="bg-[var(--primary)] text-[var(--primary-fg)] px-10 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-all focus-ring shadow-md"
                    >
                        Start
                    </button>
                </div>
            </div>
        );
    }

    // story-selection view removed

    if (view === "subtopic-selection") {
        const allVisited = subtopics.length > 0 && subtopics.every(sub => visitedSubtopicIds.has(sub.id));

        return (
            <div className="w-full h-full flex flex-col p-6">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col mt-8">
                    <div className="flex justify-between items-end mb-12 border-b border-[var(--border)] pb-6">
                        <div>
                            <h2 className="text-3xl font-serif font-medium text-[var(--foreground)] mb-2">Formal Subtopics</h2>
                            <p className="text-[var(--muted)]">Choose a subtopic to begin reading.</p>
                        </div>
                        <div className="text-lg font-mono font-medium text-[var(--primary)] bg-[var(--surface)] px-4 py-2 rounded border border-[var(--border)] shadow-sm tabular-nums">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                        {subtopics.map(sub => {
                            const isVisited = visitedSubtopicIds.has(sub.id);
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
                                onClick={() => setView("summary")}
                                className="bg-[var(--primary)] text-[var(--primary-fg)] px-10 py-4 rounded-full font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm uppercase tracking-widest"
                            >
                                Continue to Summary
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === "summary") {
        return (
            <SummaryInput
                participantId={participantId}
                onComplete={onComplete}
            />
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
                            Formal
                        </span>
                        <h1 className="text-sm font-semibold text-[var(--foreground)] truncate max-w-md">
                            {currentSubtopic.title}
                        </h1>
                    </div>
                    <div className="font-mono text-sm font-medium text-[var(--foreground)] tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="h-1 w-full bg-[var(--input-bg)] shrink-0">
                    <div 
                        className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto relative bg-[var(--background)] scroll-smooth">
                    <div className="min-h-full w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col items-center">
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
                            className="border-2 border-[var(--primary)] text-[var(--primary)] px-8 py-3 rounded-lg hover:bg-[var(--primary)] hover:text-[var(--primary-fg)] active:scale-[0.98] transition-all font-semibold text-sm shadow-sm hover:shadow-md focus-ring uppercase tracking-widest"
                        >
                            Go to Other Topics
                        </button>
                        
                        <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest hidden md:block">
                             {currentSegmentIndex + 1} <span className="mx-1 opacity-30">/</span> {segments.length}
                        </div>

                        <button
                            type="button"
                            onClick={() => triggerQuestion("continue")}
                            disabled={!currentSegment}
                            className="bg-[var(--primary)] text-[var(--primary-fg)] px-8 py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all font-semibold text-sm shadow-md hover:shadow-lg focus-ring uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Read the Next Article
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

    return <div>Loading...</div>;
}
