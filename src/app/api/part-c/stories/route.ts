import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    if (!phase) {
        return NextResponse.json({ error: "Phase is required" }, { status: 400 });
    }

    try {
        const tableName = phase === 'practice' ? 'part3_practice_stories' : 'part3_formal_stories';
        const stories = await query(
            `SELECT * FROM ${tableName}`
        );
        return NextResponse.json(stories);
    } catch (error) {
        console.error("Failed to fetch stories:", error);
        return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }
}
