import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, content } = body;

        if (!participantId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [result] = await pool.execute(
            "INSERT INTO part_c_summaries (participant_id, content) VALUES (?, ?)",
            [participantId, content]
        );

        return NextResponse.json({ success: true, id: (result as any).insertId });
    } catch (error) {
        console.error("Failed to submit Part C summary:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
