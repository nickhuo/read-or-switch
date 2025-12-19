import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, phase, summary, responses } = body;

        // 1. Save Summary
        if (summary) {
            const table = phase === 'practice' ? 'part3_practice_summaries' : 'part3_formal_summaries';
            // We expect extra fields for Part C summaries: story_id, segment_order.
            // But this route is shared with Part B? Part B submit doesn't send segment_order/story_id for summary?
            // Part B refactor kept Part B separate in /api/part-b/submit.
            // This is /api/part-c/submit. So I can diverge.

            const storyId = body.storyId;
            const segmentOrder = body.segmentOrder;

            await query(
                `INSERT INTO ${table} (participant_id, story_id, segment_order, content) VALUES (?, ?, ?, ?)`,
                [participantId, storyId, segmentOrder, summary]
            );
        }

        // 2. Save Responses
        if (responses && Array.isArray(responses)) {
            const table = phase === 'practice' ? 'part3_practice_responses' : 'part3_formal_responses';
            for (const r of responses) {
                // Responses for ratings (question_id linked).
                // Value is stored in response_option? Yes. 0-100 fits in INT.
                await query(
                    `INSERT INTO ${table} (participant_id, question_id, response_option, is_correct, reaction_time_ms) VALUES (?, ?, ?, ?, ?)`,
                    [participantId, r.questionId, r.value, r.isCorrect || false, r.reactionTimeMs || 0]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to submit part 2 responses:", error);
        return NextResponse.json({ error: "Failed to submit responses" }, { status: 500 });
    }
}
