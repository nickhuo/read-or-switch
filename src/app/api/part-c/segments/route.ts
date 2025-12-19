import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");
    const phase = searchParams.get("phase");

    if (!storyId || !phase) {
        return NextResponse.json({ error: "Story ID and Phase are required" }, { status: 400 });
    }

    try {
        const segmentsTable = phase === 'practice' ? 'part3_practice_segments' : 'part3_formal_segments';
        const segments = await query(
            `SELECT * FROM ${segmentsTable} WHERE story_id = ? ORDER BY segment_order ASC`,
            [storyId]
        );
        return NextResponse.json(segments);
    } catch (error) {
        console.error("Failed to fetch segments:", error);
        return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
    }
}
