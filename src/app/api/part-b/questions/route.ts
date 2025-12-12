import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    if (!phase) {
        return NextResponse.json({ error: "Phase is required" }, { status: 400 });
    }

    try {
        const questions = await query(
            `SELECT q.*, s.title as story_title 
             FROM part2_questions q 
             JOIN part2_stories s ON q.story_id = s.id 
             WHERE s.phase = ?`,
            [phase]
        );
        return NextResponse.json(questions);
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
