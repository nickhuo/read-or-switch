
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from ${envPath}`);

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
} else {
    console.error(".env.local not found!");
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

// Robust CSV API that handles newlines in quotes
function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

    // Normalize line endings to \n seems risky if we want to preserve data, 
    // but typically safe for standard text. 
    // Better to handle \r\n in loop.

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentVal += '"';
                i++; // Skip the escaped quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentVal.trim());
            currentVal = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
            currentRow.push(currentVal.trim());
            if (currentRow.length > 0 || currentVal.length > 0) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentVal = '';
            if (char === '\r') i++; // Handling \r\n, skip the \n
        } else if (char === '\r' && !insideQuotes) {
            // Handle \r only line endings
            currentRow.push(currentVal.trim());
            if (currentRow.length > 0 || currentVal.length > 0) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentVal = '';
        } else {
            currentVal += char;
        }
    }

    // Push any remaining data
    if (currentRow.length > 0 || currentVal.length > 0) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
    }

    return rows;
}

async function populatePartA(connection: mysql.Connection) {
    console.log('Populating Part A data...');

    // Disable FK checks for truncation
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    const sentencesPath = path.resolve(process.cwd(), 'docs/Study Material/part_a_sentences.csv');
    if (fs.existsSync(sentencesPath)) {
        console.log(`Reading ${sentencesPath}...`);
        const content = fs.readFileSync(sentencesPath, 'utf8');
        const rows = parseCSV(content).slice(1);

        if (rows.length > 0) {
            await connection.query('TRUNCATE TABLE part_a_sentences');

            for (const cols of rows) {
                if (cols.length < 15) continue;
                await connection.execute(`
                    INSERT INTO part_a_sentences 
                    (study_part_id, set_id, text_id, sentence_index, sp1_con_id, predictability, predict_id, make_sense, make_sense_id, text_type, text_type_id, gen_type, gen_type_id, note, content)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                    cols[0], cols[1], cols[2], cols[3], cols[4], cols[5], cols[6], cols[7], cols[8], cols[9], cols[10], cols[11], cols[12], cols[13], cols[14]
                ]);
            }
            console.log(`Inserted ${rows.length} rows into part_a_sentences.`);
        }
    } else {
        console.warn(`File not found: ${sentencesPath}`);
    }

    const questionsPath = path.resolve(process.cwd(), 'docs/Study Material/part_a_questions.csv');
    if (fs.existsSync(questionsPath)) {
        console.log(`Reading ${questionsPath}...`);
        const content = fs.readFileSync(questionsPath, 'utf8');
        const rows = parseCSV(content).slice(1);

        if (rows.length > 0) {
            await connection.query('TRUNCATE TABLE part_a_questions');

            for (const cols of rows) {
                if (cols.length < 15) continue;

                const correctAns = cols[14].trim();
                let correctOption = 0;
                if (correctAns === cols[10].trim()) correctOption = 1;
                else if (correctAns === cols[11].trim()) correctOption = 2;
                else if (correctAns === cols[12].trim()) correctOption = 3;
                else if (correctAns === cols[13].trim()) correctOption = 4;

                await connection.execute(`
                    INSERT INTO part_a_questions
                    (study_part_id, sent_set, text_id, sent_order, p1_con_id, predict_id, make_sense_id, text_type_id, gen_type_id, question_text, option_1, option_2, option_3, option_4, correct_ans, correct_option)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                    cols[0], cols[1], cols[2], cols[3], cols[4], cols[5], cols[6], cols[7], cols[8], cols[9], cols[10], cols[11], cols[12], cols[13], cols[14], correctOption
                ]);
            }
            console.log(`Inserted ${rows.length} rows into part_a_questions.`);
        }
    } else {
        console.warn(`File not found: ${questionsPath}`);
    }

    // Re-enable FK checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function populatePartB(connection: mysql.Connection) {
    console.log('Populating Part B data...');
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Clear existing data
    await connection.query('TRUNCATE TABLE part_b_formal_responses');
    await connection.query('TRUNCATE TABLE part_b_formal_questions');
    await connection.query('TRUNCATE TABLE part_b_formal_actions');
    await connection.query('TRUNCATE TABLE part_b_formal_summaries');
    await connection.query('TRUNCATE TABLE part_b_formal_segments');
    await connection.query('TRUNCATE TABLE part_b_formal_stories');
    await connection.query('TRUNCATE TABLE part_b_topic');

    await connection.query('TRUNCATE TABLE part_b_practice_responses');
    await connection.query('TRUNCATE TABLE part_b_practice_questions');
    await connection.query('TRUNCATE TABLE part_b_practice_actions');
    await connection.query('TRUNCATE TABLE part_b_practice_segments');
    await connection.query('TRUNCATE TABLE part_b_practice_stories');
    await connection.query('TRUNCATE TABLE part_b_practice_topic');

    // 1. Populate Formal Stories
    const formalStoriesPath = path.resolve(process.cwd(), 'docs/Study Material/part_b_formal_stories.csv');
    if (fs.existsSync(formalStoriesPath)) {
        console.log(`Reading ${formalStoriesPath}...`);
        const content = fs.readFileSync(formalStoriesPath, 'utf8');
        const rows = parseCSV(content).slice(1);

        // Extract Topics and Stories
        // Map TopicID (T1) -> Title
        const topics = new Map<string, string>();
        // Map StoryLabel (T1P1) -> { topicId: string, title: string, predictability: string }
        const stories = new Map<string, { topicId: string, title: string, predictability: string }>();
        // Segments
        const segments: any[] = [];

        for (const cols of rows) {
            // Cols: StudyPartID, StoryTopicID, Predictability, PredictID, TextID, SP2ConID, StoryTitle, Order, StoryText
            if (cols.length < 9) continue;

            const storyLabel = cols[1]; // T1P1
            const predictability = cols[2];
            const textId = cols[4];
            const title = cols[6];
            let order = 0;
            try { order = parseInt(cols[7]); } catch (e) { }
            const text = cols[8];
            const sp2ConId = cols[5];
            let predictId = 0;
            try { predictId = parseInt(cols[3]); } catch (e) { }

            if (!storyLabel) continue;

            // Extract Topic ID (T1 from T1P1)
            const topicMatch = storyLabel.match(/^(T\d+)/);
            if (topicMatch) {
                const topicId = topicMatch[1];
                topics.set(topicId, title);

                if (!stories.has(storyLabel)) {
                    stories.set(storyLabel, { topicId, title, predictability });
                }
            }

            segments.push({
                storyLabel,
                content: text,
                segmentOrder: order,
                textId,
                predictability,
                predictId,
                sp2ConId
            });
        }

        // Insert Topics
        for (const [id, title] of topics) {
            await connection.execute('INSERT INTO part_b_topic (id, title) VALUES (?, ?)', [id, title]);
        }
        console.log(`Inserted ${topics.size} Part B Topics.`);

        // Insert Stories and keep map of label -> db_id
        const storyLabelToId = new Map<string, number>();
        for (const [label, data] of stories) {
            const [res]: any = await connection.execute(
                'INSERT INTO part_b_formal_stories (topic_id, title, story_label) VALUES (?, ?, ?)',
                [data.topicId, data.title, label]
            );
            storyLabelToId.set(label, res.insertId);
        }
        console.log(`Inserted ${stories.size} Part B Formal Stories.`);

        // Insert Segments
        for (const seg of segments) {
            const storyId = storyLabelToId.get(seg.storyLabel);
            if (storyId) {
                await connection.execute(
                    `INSERT INTO part_b_formal_segments 
                    (story_id, content, segment_order, text_id, predictability, predict_id, sp2_con_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [storyId, seg.content, seg.segmentOrder, seg.textId, seg.predictability, seg.predictId, seg.sp2ConId]
                );
            }
        }
        console.log(`Inserted ${segments.length} Part B Formal Segments.`);

        // Populate Formal Questions
        const questionsPath = path.resolve(process.cwd(), 'docs/Study Material/part_b_formal_questions.csv');
        if (fs.existsSync(questionsPath)) {
            console.log(`Reading ${questionsPath}...`);
            const qContent = fs.readFileSync(questionsPath, 'utf8');
            const qRows = parseCSV(qContent).slice(1);

            let qCount = 0;
            for (const cols of qRows) {
                // Cols: StudyPartID, StoryTopicID...
                if (cols.length < 14) continue;

                const storyLabel = cols[1];
                const qText = cols[8];
                const opt1 = cols[9];
                const opt2 = cols[10];
                const opt3 = cols[11];
                const opt4 = cols[12];
                const correctAns = cols[13];
                let qOrder = 0;
                try { qOrder = parseInt(cols[7]); } catch (e) { }

                const storyId = storyLabelToId.get(storyLabel);
                if (storyId) {
                    let correctOption = 0;
                    if (correctAns.trim() === opt1.trim()) correctOption = 1;
                    else if (correctAns.trim() === opt2.trim()) correctOption = 2;
                    else if (correctAns.trim() === opt3.trim()) correctOption = 3;
                    else if (correctAns.trim() === opt4.trim()) correctOption = 4;

                    await connection.execute(
                        `INSERT INTO part_b_formal_questions
                        (story_id, question_text, question_order, option_1, option_2, option_3, option_4, correct_option)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [storyId, qText, qOrder, opt1, opt2, opt3, opt4, correctOption]
                    );
                    qCount++;
                }
            }
            console.log(`Inserted ${qCount} Part B Formal Questions.`);
        }
    }

    // 2. Populate Practice Data
    const practicePath = path.resolve(process.cwd(), 'docs/Study Material/part_b_practice_segments.csv');
    if (fs.existsSync(practicePath)) {
        console.log(`Reading ${practicePath}...`);
        const content = fs.readFileSync(practicePath, 'utf8');
        const rows = parseCSV(content).slice(1);

        const pTopics = new Map<string, string>(); // ID -> Title
        const pSegments: any[] = [];

        for (const cols of rows) {
            // Cols: PartID, StoryTopicID, TextID, StoryTitle, Order, StoryText
            if (cols.length < 6) continue;

            const topicId = cols[1]; // "1"
            const title = cols[3];
            const textId = cols[2];
            let order = 0;
            try { order = parseInt(cols[4]); } catch (e) { }
            const text = cols[5];

            pTopics.set(topicId, title);
            pSegments.push({
                topicId,
                title,
                textId,
                order,
                text
            });
        }

        // Insert Practice Topics
        for (const [id, title] of pTopics) {
            await connection.execute('INSERT INTO part_b_practice_topic (id, title) VALUES (?, ?)', [id, title]);
        }
        console.log(`Inserted ${pTopics.size} Part B Practice Topics.`);

        // Insert Practice Stories (One per topic)
        const practiceLabelToId = new Map<string, number>();
        for (const [id, title] of pTopics) {
            const [res]: any = await connection.execute(
                'INSERT INTO part_b_practice_stories (topic_id, title, story_label) VALUES (?, ?, ?)',
                [id, title, id] // Use ID as label
            );
            practiceLabelToId.set(id, res.insertId);
        }

        // Insert Practice Segments
        let pSegCount = 0;
        for (const seg of pSegments) {
            const storyId = practiceLabelToId.get(seg.topicId);
            if (storyId) {
                await connection.execute(
                    `INSERT INTO part_b_practice_segments
                    (story_id, content, segment_order, text_id)
                    VALUES (?, ?, ?, ?)`,
                    [storyId, seg.text, seg.order, seg.textId]
                );
                pSegCount++;
            }
        }
        console.log(`Inserted ${pSegCount} Part B Practice Segments.`);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function populatePartC(connection: mysql.Connection) {
    console.log('Populating Part C data...');
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Helper to read CSV and insert data
    const seedTable = async (fileName: string, tableName: string, columns: string[], mapFn?: (cols: string[]) => any[]) => {
        const filePath = path.resolve(process.cwd(), `docs/Study Material/${fileName}`);
        if (fs.existsSync(filePath)) {
            console.log(`Reading ${filePath}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            const rows = parseCSV(content).slice(1); // Skip header

            if (rows.length > 0) {
                await connection.query(`TRUNCATE TABLE ${tableName}`);

                // Prepare statement placeholders
                const placeholders = columns.map(() => '?').join(', ');
                const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

                for (const cols of rows) {
                    if (cols.length < columns.length) continue;

                    let values = cols;
                    if (mapFn) values = mapFn(cols);

                    // Ensure we only take the number of columns we expect
                    values = values.slice(0, columns.length);

                    try {
                        await connection.execute(sql, values);
                    } catch (err) {
                        console.error(`Error inserting into ${tableName}:`, err);
                    }
                }
                console.log(`Inserted ${rows.length} rows into ${tableName}.`);
            }
        } else {
            console.warn(`File not found: ${filePath}`);
        }
    };

    // 1. Part C Topic
    await seedTable('part_c_topic.csv', 'part_c_topic',
        ['topID', 'topTitle', 'topIdeasBonusWords']
    );

    // 2. Part C Subtopic
    await seedTable('part_c_subtopic.csv', 'part_c_subtopic',
        ['subtopID', 'topID', 'subtopTitle']
    );

    // 3. Part C Passage
    await seedTable('part_c_passage.csv', 'part_c_passage',
        ['topID', 'subtopID', 'conID', 'passID', 'passOrder', 'passTitle', 'passText']
    );

    // 4. Part C Questions
    await seedTable('part_c_questions.csv', 'part_c_questions',
        ['questionID', 'passID', 'topID', 'subtopID', 'conID', 'passOrder', 'passTitle', 'questionText', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'correctAns']
    );

    // 5. Part C Practice Topic
    await seedTable('part_c_prac_topic.csv', 'part_c_prac_topic',
        ['topID', 'topTitle', 'topIdeasBonusWords']
    );

    // 6. Part C Practice Subtopic
    await seedTable('part_c_prac_subtopic.csv', 'part_c_prac_subtopic',
        ['subtopID', 'topID', 'subtopTitle']
    );

    // 7. Part C Practice Passage
    await seedTable('part_c_prac_passage.csv', 'part_c_prac_passage',
        ['topID', 'subtopID', 'conID', 'passID', 'passOrder', 'passTitle', 'passText']
    );

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function main() {
    console.log('Connecting to database...');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await connection.query(statement);
            } catch (err: any) {
                // Ignore
            }
        }

        console.log('Schema migration completed.');
        await populatePartA(connection);
        await populatePartB(connection);
        await populatePartC(connection);

        console.log('Verification completed.');

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

main();
