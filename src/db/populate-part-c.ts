
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
            'part3_practice_responses', 'part3_practice_questions', 'part3_practice_actions', 'part3_practice_segments', 'part3_practice_stories', 'part3_practice_summaries',
            'part3_formal_responses', 'part3_formal_questions', 'part3_formal_actions', 'part3_formal_segments', 'part3_formal_stories', 'part3_formal_summaries'
        ];

        console.log('Dropping existing Part 3 tables to ensure schema updates...');
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
            console.log(`Inserting Part 3 ${phase} mock data...`);
            const suffix = phase;

            for (let i = 1; i <= numStories; i++) {
                // Insert Story
                const title = `Part C ${phase} Story ${i}`;
                const topicId = `TC${phase.charAt(0).toUpperCase()}${i}`; // TCP1, TCF1

                const [res]: any = await connection.execute(
                    `INSERT INTO part3_${suffix}_stories (title, story_topic_id) VALUES (?, ?)`,
                    [title, topicId]
                );
                const storyId = res.insertId;

                // Insert Segments (let's say 4 segments per story)
                // And for each segment, we need a corresponding QUESTION (since user wants per-segment questions)
                for (let s = 1; s <= 4; s++) {
                    const content = `This is content for segment ${s} of ${title}. It contains some information that will be tested.`;

                    await connection.execute(
                        `INSERT INTO part3_${suffix}_segments 
                        (story_id, content, segment_order, text_id, predictability, predict_id) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [storyId, content, s, `${topicId}-S${s}`, 'High', 1]
                    );

                    // Insert 4 Fixed Rating Questions for this segment
                    const ratingQuestions = [
                        "How much did you learn from this segment? (0-100)",
                        "How difficult was this segment? (0-100)",
                        "How interesting was this segment? (0-100)",
                        "How predictable was this segment? (0-100)"
                    ];

                    for (let qIdx = 0; qIdx < 4; qIdx++) {
                        const globalOrder = (s - 1) * 4 + (qIdx + 1); // 1-based order: 1,2,3,4 for seg1; 5,6,7,8 for seg2...

                        await connection.execute(
                            `INSERT INTO part3_${suffix}_questions 
                            (story_id, question_text, question_order, option_1, option_2, option_3, option_4, correct_option) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                storyId,
                                ratingQuestions[qIdx],
                                globalOrder,
                                "Min: 0",
                                "Max: 100",
                                "",
                                "",
                                1
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
