import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    if (!phase) {
        return NextResponse.json({ error: "Phase is required" }, { status: 400 });
    }

    try {
        const questionsTable = 'part_c_questions'; // Unified table for now
        const storiesTable = phase === 'practice' ? 'part_c_prac_topic' : 'part_c_topic';

        const questions = await query(
            `SELECT q.*, s.topTitle as story_title 
             FROM ${questionsTable} q 
             JOIN ${storiesTable} s ON q.topID = s.topID`
        );
        return NextResponse.json(questions);
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
