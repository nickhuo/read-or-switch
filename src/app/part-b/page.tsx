"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import PracticeTask from "./components/PracticeTask";
import FormalTask from "./components/FormalTask";
import CognitiveTests from "./components/CognitiveTests";
import FinalAssessment from "./components/FinalAssessment";

type PartBPhase = "practice" | "formal" | "cognitive" | "final";

export default function PartBPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartBOrchestrator />
        </Suspense>
    );
}

function PartBOrchestrator() {
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participant_id") || "test-user";

    const [phase, setPhase] = useState<PartBPhase>("practice");

    const renderPhase = () => {
        switch (phase) {
            case "practice":
                return <PracticeTask participantId={participantId} onComplete={() => setPhase("formal")} />;
            case "formal":
                return <FormalTask participantId={participantId} onComplete={() => setPhase("cognitive")} />;
            case "cognitive":
                return <CognitiveTests participantId={participantId} onComplete={() => setPhase("final")} />;
            case "final":
                return <FinalAssessment participantId={participantId} onComplete={() => { }} />;
            default:
                return <div>Unknown Phase</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm p-4 mb-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>Participant: {participantId}</div>
                    <div className="flex gap-4">
                        <span className={phase === "practice" ? "font-bold text-blue-600" : ""}>1. Practice</span>
                        <span className="text-gray-300">/</span>
                        <span className={phase === "formal" ? "font-bold text-blue-600" : ""}>2. Formal</span>
                        <span className="text-gray-300">/</span>
                        <span className={phase === "cognitive" ? "font-bold text-blue-600" : ""}>3. Cognitive</span>
                        <span className="text-gray-300">/</span>
                        <span className={phase === "final" ? "font-bold text-blue-600" : ""}>4. Final</span>
                    </div>
                </div>
            </header>
            <main>
                {renderPhase()}
            </main>
        </div>
    );
}
