import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
    const body = await request.json();
    const {
        participantId,
        dobMonth,
        dobDay,
        dobYear,
        gender,
        education,
        nativeSpeaker,
        firstLanguage,
        proficiencyReading,
        proficiencyWriting,
        isHispanic,
        race,
        knowledge,
    } = body;

    if (!participantId) {
        return NextResponse.json({ error: "Missing participant ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert Participant (Ignore if exists)
        await connection.execute(
            "INSERT IGNORE INTO participants (participant_id) VALUES (?)",
            [participantId]
        );

        // 2. Insert or Update Demographics
        const dob = `${dobYear}-${dobMonth}-${dobDay}`;
        // Delete existing demographics if any to simplify update (or use UPDATE)
        await connection.execute("DELETE FROM demographics WHERE participant_id = ?", [participantId]);

        await connection.execute(
            `INSERT INTO demographics (
        participant_id, dob, gender, education_level, 
        native_speaker, first_language, proficiency_reading, proficiency_writing, 
        is_hispanic, race
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                participantId,
                dob,
                gender,
                education,
                nativeSpeaker === "Yes",
                firstLanguage || null,
                proficiencyReading,
                proficiencyWriting,
                isHispanic === "Yes",
                race,
            ]
        );

        // 3. Insert Knowledge Ratings
        // First delete existing knowledge to avoid duplicates
        await connection.execute("DELETE FROM participant_knowledge WHERE participant_id = ?", [participantId]);

        // Get topic IDs
        const [topics] = await connection.query<RowDataPacket[]>("SELECT id, name FROM topics");
        const topicMap = new Map(topics.map((t: RowDataPacket) => [t.name, t.id]));

        for (const [topicName, rating] of Object.entries(knowledge)) {
            const topicId = topicMap.get(topicName);
            if (topicId) {
                await connection.execute(
                    "INSERT INTO participant_knowledge (participant_id, topic_id, rating) VALUES (?, ?, ?)",
                    [participantId, topicId, rating]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        await connection.rollback();
        console.error("Database error details:", error);
        const errorMessage = error instanceof Error ? error.message : "Database error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        connection.release();
    }
}
