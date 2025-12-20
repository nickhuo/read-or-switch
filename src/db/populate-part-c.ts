
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
        }
    });
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected.');

    try {
        const tablesToClear = [
            'part_c_pass_qop', 'part_c_passage', 'part_c_subtopic', 'part_c_topic',
            'part_c_prac_pass_qop', 'part_c_prac_passage', 'part_c_prac_subtopic', 'part_c_prac_topic',
            // Legacy/Extra tables
            'part_c_practice_summaries', 'part_c_formal_summaries',
            'part_c_practice_responses', 'part_c_formal_responses',
            'part_c_vocabulary_responses', 'part_c_letter_item',
            'part_c_questions'
        ];

        console.log('Dropping existing Part C tables to ensure schema updates...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tablesToClear) {
            try {
                // DROP instead of TRUNCATE to enforce schema refresh
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped ${table}`);
            } catch (e: any) {
                console.log(`Note: Could not drop ${table}: ${e.message}`);
            }
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 0. Apply Schema Changes (Now will create fresh tables)
        console.log('Applying schema updates from schema.sql...');
        const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // multi-statements enabled? Yes.
        await connection.query(schemaSql);
        console.log('Schema applied.');

        // Re-truncate just in case
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tablesToClear) {
            try {
                await connection.query(`TRUNCATE TABLE ${table}`);
                console.log(`Cleared ${table}`);
            } catch (e: any) {
                console.log(`Note: Could not truncate ${table}: ${e.message}`);
            }
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        async function insertMockData(phase: 'practice' | 'formal', numStories: number) {
            console.log(`Inserting Part C ${phase} mock data...`);

            // Map to new schema tables
            // formal -> part_c_topic, part_c_passage
            // practice -> part_c_prac_topic, part_c_prac_passage

            const topicTable = phase === 'practice' ? 'part_c_prac_topic' : 'part_c_topic';
            const passageTable = phase === 'practice' ? 'part_c_prac_passage' : 'part_c_passage';

            for (let i = 1; i <= numStories; i++) {
                // Insert Topic (Story)
                // Schema: topID, topTitle, topIdeasBonusWords
                const title = `Part C ${phase} Story ${i}`;
                const topID = `TC${phase.charAt(0).toUpperCase()}${i}`; // TCP1, TCF1

                await connection.execute(
                    `INSERT INTO ${topicTable} (topID, topTitle, topIdeasBonusWords) VALUES (?, ?, ?)`,
                    [topID, title, '']
                );
                console.log(`Inserted Topic: ${title} (${topID})`);

                // Insert Passages (Segments)
                // Schema: topID, subtopID, conID, passID, passOrder, passTitle, passText
                for (let s = 1; s <= 4; s++) {
                    const content = `This is content for segment ${s} of ${title}. It contains some information that will be tested.`;
                    const subtopID = `${topID}-ST${s}`;
                    const conID = 'CON01';
                    const passID = `${topID}-P${s}`; // char(6)? Might be too long if not careful. schema says char(6). 
                    // TCP1-P1 is 7 chars. schema definition: `passID` char(6) NOT NULL. 
                    // I'll adjust passID to be short. P1, P2? passID isn't unique globally? 
                    // PK is (topID, subtopID, conID, passID).
                    // Let's use P0${s} (3 chars).
                    const shortPassID = `P0${s}`;

                    await connection.execute(
                        `INSERT INTO ${passageTable} 
                        (topID, subtopID, conID, passID, passOrder, passTitle, passText) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [topID, subtopID, conID, shortPassID, s.toString(), `Segment ${s}`, content]
                    );

                    // Insert Questions? part_c_questions (Schema: questionID, passID, topID ...)
                    // Note: API questions route joins with questions table looking for story_id? NO, I removed that join in loop.
                    // But in Step 90 I removed the join logic in questions route?
                    // Checked Step 90: `SELECT q.*, s.title as story_title FROM part_c_questions q JOIN part_c_topic s ON ...`
                    // Wait, Step 90 was replace_file_content... 
                    // "const questionsTable = 'part_c_questions';"
                    // "const storiesTable = phase === 'practice' ? 'part_c_prac_topic' : 'part_c_topic';"
                    // The join logic `q.story_id = s.id` is likely invalid because `part_c_questions` doesn't have `story_id`.
                    // It has `topID`. `part_c_topic` has `topID`.
                    // So join should be `q.topID = s.topID`.
                    // And `part_c_questions` needs data.

                    const ratingQuestions = [
                        "How much new information?",
                        "How easy to read?",
                        "How much learned?",
                        "Overall learning?"
                    ];

                    for (let qIdx = 0; qIdx < 4; qIdx++) {
                        const qID = `${topID}-Q${s}-${qIdx}`;

                        // Schema: questionID, passID, topID, subtopID, conID, passOrder, passTitle, questionText, choiceA..D, correctAns
                        await connection.execute(
                            `INSERT INTO part_c_questions 
                            (questionID, passID, topID, subtopID, conID, passOrder, passTitle, questionText, choiceA, choiceB, choiceC, choiceD, correctAns) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                qID,
                                shortPassID,
                                topID,
                                subtopID,
                                conID,
                                s.toString(),
                                `Segment ${s}`,
                                ratingQuestions[qIdx],
                                "0", "100", "", "", "1"
                            ]
                        );
                    }
                }
            }
        }

        await insertMockData('practice', 2);
        await insertMockData('formal', 4);

        console.log('Done!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
