
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface SentenceRecord {
    StudyPartID: string;
    SentSetID: string;
    TextID: string;
    Order: string;
    SP1ConID: string;
    Predictability: string;
    PredictID: string;
    Make_sense: string;
    Make_sense_ID: string;
    TextType: string;
    TextTypeID: string;
    GenType: string;
    GenTypeID: string;
    Note: string;
    SentenceText: string;
}

export async function GET() {
    try {
        const csvPath = path.join(process.cwd(), "docs", "Study Material", "Study Part A Materials-Table 1.csv");
        const fileContent = fs.readFileSync(csvPath, "utf-8");

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as SentenceRecord[];

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Re-create table to ensure schema matches (since we can't easily run schema.sql from here without raw query)
            // This is a dev-helper route, so dropping is acceptable for initial setup.
            await connection.execute("DROP TABLE IF EXISTS part_a_sentences");

            await connection.execute(`
                CREATE TABLE part_a_sentences (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    study_part_id INT,
                    set_id INT NOT NULL,
                    text_id VARCHAR(50),
                    sentence_index INT NOT NULL,
                    sp1_con_id VARCHAR(50),
                    predictability VARCHAR(10),
                    predict_id INT,
                    make_sense VARCHAR(10),
                    make_sense_id INT,
                    text_type VARCHAR(20),
                    text_type_id INT,
                    gen_type VARCHAR(20),
                    gen_type_id INT,
                    note TEXT,
                    content TEXT NOT NULL
                )
            `);

            const insertQuery = `
                INSERT INTO part_a_sentences (
                    study_part_id, set_id, text_id, sentence_index, sp1_con_id, 
                    predictability, predict_id, make_sense, make_sense_id, 
                    text_type, text_type_id, gen_type, gen_type_id, note, content
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const record of records) {
                // Map CSV fields to DB columns
                // CSV: StudyPartID,SentSetID,TextID,Order,SP1ConID,Predictability,PredictID,Make_sense,Make_sense_ID,TextType,TextTypeID,GenType,GenTypeID,Note,SentenceText

                await connection.execute(insertQuery, [
                    parseInt(record.StudyPartID) || 0,
                    parseInt(record.SentSetID),
                    record.TextID,
                    parseInt(record.Order),
                    record.SP1ConID,
                    record.Predictability,
                    parseInt(record.PredictID) || 0,
                    record.Make_sense,
                    parseInt(record.Make_sense_ID) || 0,
                    record.TextType,
                    parseInt(record.TextTypeID) || 0,
                    record.GenType,
                    parseInt(record.GenTypeID) || 0,
                    record.Note,
                    record.SentenceText
                ]);
            }

            await connection.commit();
            return NextResponse.json({ success: true, count: records.length, message: "Table recreated and data seeded" });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

    } catch (error: unknown) {
        console.error("Seeding error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
