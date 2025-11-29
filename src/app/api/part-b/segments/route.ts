import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
        return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    try {
        const segments = await query(
            "SELECT * FROM story_segments WHERE story_id = ? ORDER BY segment_order ASC",
            [storyId]
        );
        return NextResponse.json(segments);
    } catch (error) {
        console.error("Failed to fetch segments:", error);
        return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
    }
}
