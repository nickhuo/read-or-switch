
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            // No transaction start - auto commit

            const tablesToClear = [
                'part_c_pass_qop', 'part_c_passage', 'part_c_subtopic', 'part_c_topic',
                'part_c_prac_pass_qop', 'part_c_prac_passage', 'part_c_prac_subtopic', 'part_c_prac_topic',
                'part_c_practice_summaries', 'part_c_formal_summaries',
                'part_c_practice_responses', 'part_c_formal_responses',
                'part_c_questions'
            ];

            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const table of tablesToClear) {
                // Ignore if not exists or error
                try {
                    await connection.query(`TRUNCATE TABLE ${table}`);
                } catch (e) { }
            }
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');

            async function insertMockData(phase: 'practice' | 'formal', numStories: number) {
                const topicTable = phase === 'practice' ? 'part_c_prac_topic' : 'part_c_topic';
                const passageTable = phase === 'practice' ? 'part_c_prac_passage' : 'part_c_passage';

                for (let i = 1; i <= numStories; i++) {
                    const title = `Part C ${phase} Story ${i}`;
                    const topID = `TC${phase.charAt(0).toUpperCase()}${i}`;

                    await connection.query(
                        `INSERT INTO ${topicTable} (topID, topTitle, topIdeasBonusWords) VALUES (?, ?, ?)`,
                        [topID, title, '']
                    );

                    for (let s = 1; s <= 4; s++) {
                        const content = `This is content for segment ${s} of ${title}.`;
                        const subtopID = `${topID}-ST${s}`;
                        const conID = 'CON01';
                        const passID = `P${s}`;

                        await connection.query(
                            `INSERT INTO ${passageTable} 
                            (topID, subtopID, conID, passID, passOrder, passTitle, passText) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [topID, subtopID, conID, passID, s.toString(), `Segment ${s}`, content]
                        );

                        for (let qIdx = 0; qIdx < 4; qIdx++) {
                            const qID = `${topID}-Q${s}-${qIdx}`;
                            // Using IGNORE to prevent PK collision if run multiple times
                            await connection.query(
                                `INSERT IGNORE INTO part_c_questions 
                                (questionID, passID, topID, subtopID, conID, passOrder, passTitle, questionText, choiceA, choiceB, choiceC, choiceD, correctAns) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    qID, passID, topID, subtopID, conID, s.toString(),
                                    `Segment ${s}`, `Question ${qIdx + 1}?`,
                                    "0", "100", "", "", "1"
                                ]
                            );
                        }
                    }
                }
            }

            await insertMockData('practice', 2);
            await insertMockData('formal', 4);

            const [rows] = await connection.query('SELECT COUNT(*) as c FROM part_c_prac_topic');
            const count = (rows as any)[0].c;

            return NextResponse.json({ success: true, message: "Part C seeded NEW", count });

        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
