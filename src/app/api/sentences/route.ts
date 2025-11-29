import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, content, group_id FROM sentences ORDER BY group_id, id"
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to fetch sentences" }, { status: 500 });
    }
}
