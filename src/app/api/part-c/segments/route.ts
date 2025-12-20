import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");
    const phase = searchParams.get("phase");
    const participantId = searchParams.get("participantId");

    if (!storyId || !phase || !participantId) {
        return NextResponse.json({ error: "Story ID, Phase, and Participant ID are required" }, { status: 400 });
    }

    try {
        // 1. Get Participant Condition
        const participants = await query(
            "SELECT part3_condition FROM participants WHERE participant_id = ?",
            [participantId]
        ) as any[];

        if (!participants.length) {
            return NextResponse.json({ error: "Participant not found" }, { status: 404 });
        }

        const condition = participants[0].part3_condition;

        // 2. Fetch Segments filtered by condition
        const segmentsTable = phase === 'practice' ? 'part_c_prac_passage' : 'part_c_passage';

        let querySql = `SELECT * FROM ${segmentsTable} WHERE story_id = ? ORDER BY segment_order ASC`;
        let queryParams = [storyId];

        if (phase === 'formal') {
            querySql = `SELECT * FROM ${segmentsTable} WHERE story_id = ? AND sp2_con_id = ? ORDER BY segment_order ASC`;
            queryParams = [storyId, condition];
        }

        const segments = await query(querySql, queryParams);
        return NextResponse.json(segments);
    } catch (error) {
        console.error("Failed to fetch segments:", error);
        return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
    }
}
