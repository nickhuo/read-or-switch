import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, phase, summary, responses } = body;

        // 1. Save Summary
        if (summary) {
            await query(
                "INSERT INTO part2_summaries (participant_id, phase, content) VALUES (?, ?, ?)",
                [participantId, phase, summary]
            );
        }

        // 2. Save Responses
        if (responses && Array.isArray(responses)) {
            for (const r of responses) {
                await query(
                    "INSERT INTO part2_responses (participant_id, question_id, response_option, is_correct, reaction_time_ms) VALUES (?, ?, ?, ?, ?)",
                    [participantId, r.questionId, r.responseOption, r.isCorrect, r.reactionTimeMs]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to submit part 2 responses:", error);
        return NextResponse.json({ error: "Failed to submit responses" }, { status: 500 });
    }
}
