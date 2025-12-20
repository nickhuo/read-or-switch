
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SHOW TABLES");
        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to list tables" }, { status: 500 });
    }
}
