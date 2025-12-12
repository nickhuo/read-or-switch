import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, responses } = body;

        // responses: Array of { questionId, response_option_string, isCorrect, reactionTimeMs }
        // Note: DB expects response_option as INT (1-6). 
        // We'll need to parse "1 - speak..." to just 1.

        if (!participantId || !Array.isArray(responses)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        for (const r of responses) {
            // Extract number from "1 - speak..."
            const optionNum = parseInt(r.responseVal.split(' - ')[0]);

            await query(
                `INSERT INTO part3_vocabulary_responses 
                (participant_id, question_id, response_option, is_correct, reaction_time_ms) 
                VALUES (?, ?, ?, ?, ?)`,
                [participantId, r.questionId, optionNum, r.isCorrect, r.reactionTimeMs]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save vocab responses:", error);
        return NextResponse.json({ error: "Failed to save responses" }, { status: 500 });
    }
}
