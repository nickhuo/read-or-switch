
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

export async function GET() {
    try {
        const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        // Use a dedicated connection with multipleStatements
        // pool might not have it enabled by default?
        // We can try to use pool if it allows, but safer to create new connection using env vars?
        // But we don't have access to process.env.DB_PASSWORD if it's not loaded in Next.js process?
        // Next.js loads .env.local automatically. So process.env should produce values.

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, // This might be empty if not loaded?
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        await connection.query(schemaSql);
        await connection.end();

        return NextResponse.json({ success: true, message: "Schema applied" });
    } catch (error: any) {
        console.error("Schema execution error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
