import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, responses } = body;

        // responses: Array of { problemId, response, isCorrect, reactionTimeMs }

        if (!participantId || !Array.isArray(responses)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Batch insert might be better, but simple loop is fine for small N
        for (const r of responses) {
            await query(
                `INSERT INTO part3_letter_comparison_responses 
                (participant_id, problem_id, response_same, is_correct, reaction_time_ms) 
                VALUES (?, ?, ?, ?, ?)`,
                [participantId, r.problemId, r.response === 'S', r.isCorrect, r.reactionTimeMs]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save letter comparison responses:", error);
        return NextResponse.json({ error: "Failed to save responses" }, { status: 500 });
    }
}
