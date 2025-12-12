"use client";

import { Suspense, useState, useEffect } from "react";
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm p-4 mb-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>Participant: {participantId}</div>
                    <div className="font-mono">{view.replace("_", " ").toUpperCase()}</div>
                </div>
            </header>
            <main>
                {view === "instructions" && (
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                        <h2 className="text-2xl font-bold mb-4">Part 2: Story Reading Task</h2>
                        <p className="mb-6">
                            You will read several stories.
                            <br />
                            Some are for practice, followed by a main task.
                            <br />
                            After reading, you will answer some questions.
                        </p>
                        <button onClick={handleNext} className="bg-blue-600 text-white px-6 py-2 rounded">
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
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center mt-20">
                        <h2 className="text-2xl font-bold mb-4">Main Task</h2>
                        <p className="mb-6">
                            You will now begin the formal reading task.
                            <br />
                            You have 15 minutes.
                        </p>
                        <button onClick={handleNext} className="bg-blue-600 text-white px-6 py-2 rounded">
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
