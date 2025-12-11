import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, groupId, content } = body;

        if (!participantId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `INSERT INTO participant_summaries (participant_id, group_id, content) 
                 VALUES (?, ?, ?)`,
                [participantId, groupId || 1, content]
            );
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error: unknown) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }
}
