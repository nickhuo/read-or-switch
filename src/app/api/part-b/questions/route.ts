import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    if (!phase) {
        return NextResponse.json({ error: "Phase is required" }, { status: 400 });
    }

    try {
        const questionsTable = phase === 'practice' ? 'part2_practice_questions' : 'part2_formal_questions';
        const storiesTable = phase === 'practice' ? 'part2_practice_stories' : 'part2_formal_stories';

        const questions = await query(
            `SELECT q.*, s.title as story_title 
             FROM ${questionsTable} q 
             JOIN ${storiesTable} s ON q.story_id = s.id`
        );
        return NextResponse.json(questions);
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
