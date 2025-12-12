"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import PracticeTask from "./components/PracticeTask";
import FormalTask from "./components/FormalTask";
import CognitiveTests from "./components/CognitiveTests";
import FinalAssessment from "./components/FinalAssessment";

type PartCPhase = "practice" | "formal" | "cognitive" | "final";

export default function PartCPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartCOrchestrator />
        </Suspense>
    );
}

function PartCOrchestrator() {
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participant_id") || "test-user";

    const [phase, setPhase] = useState<PartCPhase>("practice");

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

    const getNavClass = (isActive: boolean) =>
        `text-sm font-medium transition-colors ${isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`;

    return (
        <div className="min-h-screen bg-[var(--background)] pb-20">
            <header className="sticky top-0 z-10 glass-panel border-b border-[var(--border)] px-6 py-4 mb-8 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="text-sm font-mono text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border)]">
                        ID: <span className="text-[var(--foreground)]">{participantId}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className={getNavClass(phase === "practice")}>Practice</span>
                        <span className="text-[var(--border)]">/</span>
                        <span className={getNavClass(phase === "formal")}>Formal</span>
                        <span className="text-[var(--border)]">/</span>
                        <span className={getNavClass(phase === "cognitive")}>Cognitive</span>
                        <span className="text-[var(--border)]">/</span>
                        <span className={getNavClass(phase === "final")}>Final</span>
                    </div>
                </div>
            </header>
            <main>
                {renderPhase()}
            </main>
        </div>
    );
}
