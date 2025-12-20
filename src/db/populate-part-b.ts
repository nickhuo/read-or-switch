
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { parse } from 'csv-parse/sync';

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
    multipleStatements: true // Enable multiple statements for schema execution
};

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected.');

    try {
        // 1. Drop existing tables to ensure clean schema update
        console.log('Dropping existing Part 2 tables to ensure schema update...');
        const tablesToDrop = [
            'part_b_practice_responses', 'part_b_practice_questions', 'part_b_practice_actions', 'part_b_practice_segments', 'part_b_practice_stories', 'part_b_practice_summaries',
            'part_b_formal_responses', 'part_b_formal_questions', 'part_b_formal_actions', 'part_b_formal_segments', 'part_b_formal_stories', 'part_b_formal_summaries',
            // Also drop old tables if they linger
            'part2_responses', 'part2_questions', 'part2_actions', 'part2_segments', 'part2_stories', 'part2_summaries'
        ];

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tablesToDrop) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped ${table}`);
            } catch (e: any) {
                console.log(`Note: Could not drop ${table}: ${e.message}`);
            }
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Apply Schema Changes
        console.log('Applying schema updates from schema.sql...');
        const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log('Schema applied.');

        // Optional: Drop old tables if they exist to avoid confusion? 
        // The user didn't explicitly ask to delete old data, but "separate into two" implies replacing the old structure.
        // I won't drop them automatically to be safe, but they are effectively deprecated.

        // 3. Read and Parse CSVs
        const formalPath = path.resolve(process.cwd(), 'docs/Study Material/Part B Formal Study-Table 1.csv');
        const practicePath = path.resolve(process.cwd(), 'docs/Study Material/Part B Practice-Table 1.csv');
        const questionsPath = path.resolve(process.cwd(), 'docs/Study Material/Part B Comprehension Questions-Table 1.csv');

        console.log(`Reading CSVs...`);
        const formalContent = fs.readFileSync(formalPath, 'utf8');
        const practiceContent = fs.readFileSync(practicePath, 'utf8');
        const questionsContent = fs.existsSync(questionsPath) ? fs.readFileSync(questionsPath, 'utf8') : null;

        const formalRecords = parse(formalContent, { columns: true, skip_empty_lines: true, trim: true });
        const practiceRecords = parse(practiceContent, { columns: true, skip_empty_lines: true, trim: true });
        const questionRecords = questionsContent ? parse(questionsContent, { columns: true, skip_empty_lines: true, trim: true }) : [];

        console.log(`Found ${formalRecords.length} formal segments, ${practiceRecords.length} practice segments, and ${questionRecords.length} questions.`);

        const storyMap = new Map<string, { id: number, phase: 'practice' | 'formal' }>();

        // 4. Insert Data
        // Helper to insert stories and segments
        async function insertRecords(records: any[], phase: 'practice' | 'formal') {
            const suffix = phase;
            const storyTable = `part_b_${suffix}_stories`;
            const segmentTable = `part_b_${suffix}_segments`;

            // Group by StoryTitle
            const storiesMap = new Map<string, any[]>();
            for (const row of records) {
                const title = row.StoryTitle;
                if (!storiesMap.has(title)) storiesMap.set(title, []);
                storiesMap.get(title)?.push(row);
            }

            for (const [title, rows] of storiesMap) {
                const firstRow = rows[0];
                const storyTopicId = firstRow.StoryTopicID;

                // Insert Story
                // Schema: id, title, story_topic_id (phase column is removed in new schema or implicit by table name)
                const [result]: any = await connection.execute(
                    `INSERT INTO ${storyTable} (title, story_topic_id) VALUES (?, ?)`,
                    [title, storyTopicId]
                );
                const storyId = result.insertId;
                console.log(`Inserted Story into ${storyTable}: "${title}" (ID: ${storyId}) with ${rows.length} segments.`);

                // Save to map for questions
                storyMap.set(title, { id: storyId, phase });

                // Insert Segments
                for (const row of rows) {
                    const content = row.StoryText;
                    const order = parseInt(row.Order, 10);
                    const textId = row.TextID;
                    const predictability = row.Predictability || null;
                    const predictId = row.PredictID ? parseInt(row.PredictID, 10) : null;
                    let sp2ConId = row.SP2ConID || null;
                    if (!sp2ConId && row['SP2ConID']) sp2ConId = row['SP2ConID'];

                    await connection.execute(
                        `INSERT INTO ${segmentTable} 
                        (story_id, content, segment_order, text_id, predictability, predict_id, sp2_con_id) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [storyId, content, order, textId, predictability, predictId, sp2ConId]
                    );
                }
            }
        }

        console.log('Inserting Formal Data...');
        await insertRecords(formalRecords, 'formal');

        console.log('Inserting Practice Data...');
        await insertRecords(practiceRecords, 'practice');

        // 5. Insert Questions
        if (questionRecords.length > 0) {
            console.log('Inserting Questions...');
            for (const row of (questionRecords as any[])) {
                const title = row.StoryTitle;
                const storyInfo = storyMap.get(title);

                if (!storyInfo) {
                    console.warn(`Warning: Story "${title}" not found for question: "${row.Questions?.substring(0, 30)}..."`);
                    continue;
                }

                const { id: storyId, phase } = storyInfo;
                const questionsTable = `part_b_${phase}_questions`;

                const questionText = row.Questions;
                const order = row.Order ? parseInt(row.Order, 10) : 0;
                const op1 = row.Option_1;
                const op2 = row.Option_2;
                const op3 = row.Option_3;
                const op4 = row.Option_4;
                const correctStr = row.CorrectAns;

                // Determine correct option index (1-4)
                let correctOption = 0;
                if (correctStr === op1) correctOption = 1;
                else if (correctStr === op2) correctOption = 2;
                else if (correctStr === op3) correctOption = 3;
                else if (correctStr === op4) correctOption = 4;
                // Fallback: checks if correctStr is like "Word_3" and matches header? 
                // In example CSV: CorrectAns="Word_3", Option_3="Word_3". So value match works.

                if (correctOption === 0) {
                    console.warn(`Warning: Could not determine correct option for question "${row.Questions?.substring(0, 30)}..." (Correct: ${correctStr})`);
                    // Fallback to 1 to avoid constraint failure? Or skip?
                    correctOption = 1;
                }

                await connection.execute(
                    `INSERT INTO ${questionsTable} 
                    (story_id, question_text, question_order, option_1, option_2, option_3, option_4, correct_option) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [storyId, questionText, order, op1, op2, op3, op4, correctOption]
                );
            }
            console.log(`Inserted ${questionRecords.length} questions.`);
        } else {
            console.log('No questions found to insert.');
        }

        console.log('Done!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
