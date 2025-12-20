import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, phase, summary, responses } = body;

        // 1. Save Summary
        if (summary) {
            const table = phase === 'practice' ? 'part_b_practice_summaries' : 'part_b_formal_summaries';
            await query(
                `INSERT INTO ${table} (participant_id, content) VALUES (?, ?)`,
                [participantId, summary]
            );
        }

        // 2. Save Responses
        if (responses && Array.isArray(responses)) {
            const table = phase === 'practice' ? 'part_b_practice_responses' : 'part_b_formal_responses';
            for (const r of responses) {
                await query(
                    `INSERT INTO ${table} (participant_id, question_id, response_option, is_correct, reaction_time_ms) VALUES (?, ?, ?, ?, ?)`,
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
