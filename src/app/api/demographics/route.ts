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

        // 1. Insert Participant (with conditions)
        const part2Condition = Math.floor(Math.random() * 2); // 0 or 1
        const part3Condition = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

        try {
            await connection.execute(
                `INSERT INTO participants (participant_id, part2_condition, part3_condition) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 part2_condition = IFNULL(part2_condition, VALUES(part2_condition)), 
                 part3_condition = IFNULL(part3_condition, VALUES(part3_condition))`,
                [participantId, part2Condition, part3Condition]
            );
        } catch (err: any) {
            // Self-healing: invalid column
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Detected missing columns, attempting to fix schema...");
                await connection.rollback(); // Rollback current transaction to allow DDL

                // Add columns (one by one or together)
                // Note: IF NOT EXISTS available in newer MySQL/MariaDB, but standard MySQL might fail if exists.
                // We'll try adding them. If they exist, it might fail, which is fine, we just proceed to retry.
                try {
                    await connection.query(`ALTER TABLE participants ADD COLUMN part2_condition INT COMMENT '0 or 1'`);
                } catch (e) { }
                try {
                    await connection.query(`ALTER TABLE participants ADD COLUMN part3_condition INT COMMENT '0, 1, or 2'`);
                } catch (e) { }

                // Restart transaction
                await connection.beginTransaction();
                await connection.execute(
                    `INSERT INTO participants (participant_id, part2_condition, part3_condition) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE 
                     part2_condition = IFNULL(part2_condition, VALUES(part2_condition)), 
                     part3_condition = IFNULL(part3_condition, VALUES(part3_condition))`,
                    [participantId, part2Condition, part3Condition]
                );
            } else {
                throw err;
            }
        }

        // 2. Insert or Update Demographics
        const dob = `${dobYear}-${dobMonth}-${dobDay}`;
        // Delete existing demographics if any to simplify update
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
        await connection.execute("DELETE FROM participant_knowledge WHERE participant_id = ?", [participantId]);

        // Fetch topics from Part B and Part C
        const [topicsB] = await connection.query<RowDataPacket[]>("SELECT id, title FROM part_b_topic");
        const [topicsC] = await connection.query<RowDataPacket[]>("SELECT topID as id, topTitle as title FROM part_c_topic");
        const [topicsCPrac] = await connection.query<RowDataPacket[]>("SELECT topID as id, topTitle as title FROM part_c_prac_topic");

        const topicMap = new Map<string, string>();

        topicsB.forEach((t: any) => topicMap.set(t.title, t.id));
        topicsC.forEach((t: any) => topicMap.set(t.title, t.id));
        topicsCPrac.forEach((t: any) => topicMap.set(t.title, t.id));

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
        if (connection) await connection.rollback();
        console.error("Database error details:", error);
        const errorMessage = error instanceof Error ? error.message : "Database error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
