"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StoryReading from "./components/StoryReading";
import SummaryInput from "./components/SummaryInput";
import ComprehensionQuestions from "./components/ComprehensionQuestions";

type Phase =
    | "instructions"
    | "practice_reading"
    | "practice_summary"
    | "practice_questions"
    | "formal_intro"
    | "formal_reading"
    | "formal_summary"
    | "formal_questions";

export default function PartBPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartBOrchestrator />
        </Suspense>
    );
}

function PartBOrchestrator() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const participantId = searchParams.get("participant_id") || "test-user";
    const [view, setView] = useState<Phase>("instructions");

    const handleNext = () => {
        switch (view) {
            case "instructions":
                setView("practice_reading");
                break;
            case "practice_reading":
                setView("practice_summary");
                break;
            case "practice_summary":
                setView("practice_questions");
                break;
            case "practice_questions":
                setView("formal_intro");
                break;
            case "formal_intro":
                setView("formal_reading");
                break;
            case "formal_reading":
                setView("formal_summary");
                break;
            case "formal_summary":
                setView("formal_questions");
                break;
            case "formal_questions":
                // Go to Part C (Part 3)
                router.push(`/part-c?participant_id=${participantId}`);
                break;
        }
    };

    const getViewLabel = (v: Phase) => v.replace("_", " ").toUpperCase();

    // Component Styles
    const cardClass = "max-w-xl mx-auto glass-panel p-10 rounded-xl shadow-sm mt-12 text-center";
    const buttonClass = "flex justify-center rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 active:scale-[0.99] transition-all focus:outline-none focus-ring mx-auto";
    const primaryTitle = "text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-6";
    const bodyText = "text-[var(--muted)] text-base leading-relaxed mb-8";

    return (
        <div className="min-h-screen bg-[var(--background)] pb-20">
            <header className="sticky top-0 z-10 glass-panel border-b border-[var(--border)] px-6 py-4 mb-8 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="text-sm font-mono text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border)]">
                        ID: <span className="text-[var(--foreground)]">{participantId}</span>
                    </div>
                    <div className="text-sm font-medium text-[var(--foreground)] tracking-wide">
                        {getViewLabel(view)}
                    </div>
                </div>
            </header>
            <main className="px-6">
                {view === "instructions" && (
                    <div className={cardClass}>
                        <h2 className={primaryTitle}>Part 2: Story Reading Task</h2>
                        <div className={bodyText}>
                            <p className="mb-4">You will read several stories.</p>
                            <p className="mb-4">Some are for practice, followed by a main task.</p>
                            <p>After reading, you will answer some questions.</p>
                        </div>
                        <button onClick={handleNext} className={buttonClass}>
                            Start Practice
                        </button>
                    </div>
                )}

                {view === "practice_reading" && (
                    <StoryReading
                        participantId={participantId}
                        phase="practice"
                        durationSeconds={240} // 4 min
                        onComplete={handleNext}
                    />
                )}

                {view === "practice_summary" && (
                    <SummaryInput
                        participantId={participantId}
                        phase="practice"
                        onComplete={handleNext}
                    />
                )}

                {view === "practice_questions" && (
                    <ComprehensionQuestions
                        participantId={participantId}
                        phase="practice"
                        onComplete={handleNext}
                    />
                )}

                {view === "formal_intro" && (
                    <div className={cardClass}>
                        <h2 className={primaryTitle}>Main Task</h2>
                        <div className={bodyText}>
                            <p className="mb-4">You will now begin the formal reading task.</p>
                            <p>You have <strong className="text-[var(--foreground)]">15 minutes</strong>.</p>
                        </div>
                        <button onClick={handleNext} className={buttonClass}>
                            Start Main Task
                        </button>
                    </div>
                )}

                {view === "formal_reading" && (
                    <StoryReading
                        participantId={participantId}
                        phase="formal"
                        durationSeconds={900} // 15 min
                        onComplete={handleNext}
                    />
                )}

                {view === "formal_summary" && (
                    <SummaryInput
                        participantId={participantId}
                        phase="formal"
                        onComplete={handleNext}
                    />
                )}

                {view === "formal_questions" && (
                    <ComprehensionQuestions
                        participantId={participantId}
                        phase="formal"
                        onComplete={handleNext}
                    />
                )}
            </main>
        </div>
    );
}
