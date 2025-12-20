import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, setId, sentenceIndex, wordIndex, action } = body;

        // Basic validation
        if (!participantId || setId === undefined || sentenceIndex === undefined) {
            // wordIndex is now optional
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `INSERT INTO part_a_logs (participant_id, set_id, sentence_index, word_index, action_type) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    participantId,
                    setId,
                    sentenceIndex,
                    wordIndex !== undefined ? wordIndex : null,
                    action || 'word_reveal'
                ]
            );
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error: unknown) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
    }
}
