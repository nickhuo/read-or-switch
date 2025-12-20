
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

function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                currentValue += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue.trim());
    return values;
}

async function populatePartA(connection) {
    console.log('Populating Part A data...');

    const sentencesPath = path.resolve(process.cwd(), 'docs/Study Material/part_a_sentences.csv');
    if (fs.existsSync(sentencesPath)) {
        console.log(`Reading ${sentencesPath}...`);
        const content = fs.readFileSync(sentencesPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const dataLines = lines.slice(1);

        if (dataLines.length > 0) {
            await connection.query('TRUNCATE TABLE part_a_sentences');

            for (const line of dataLines) {
                const cols = parseCSVLine(line);
                if (cols.length < 15) continue;
                await connection.execute(`
                    INSERT INTO part_a_sentences 
                    (study_part_id, set_id, text_id, sentence_index, sp1_con_id, predictability, predict_id, make_sense, make_sense_id, text_type, text_type_id, gen_type, gen_type_id, note, content)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                    cols[0], cols[1], cols[2], cols[3], cols[4], cols[5], cols[6], cols[7], cols[8], cols[9], cols[10], cols[11], cols[12], cols[13], cols[14]
                ]);
            }
            console.log(`Inserted ${dataLines.length} rows into part_a_sentences.`);
        }
    } else {
        console.warn(`File not found: ${sentencesPath}`);
    }

    const questionsPath = path.resolve(process.cwd(), 'docs/Study Material/part_a_questions.csv');
    if (fs.existsSync(questionsPath)) {
        console.log(`Reading ${questionsPath}...`);
        const content = fs.readFileSync(questionsPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const dataLines = lines.slice(1);

        if (dataLines.length > 0) {
            await connection.query('TRUNCATE TABLE part_a_questions');

            for (const line of dataLines) {
                const cols = parseCSVLine(line);
                if (cols.length < 15) continue;

                // CSV structure: StudyPartID...Option_1(10)...CorrectAns(14)
                if (cols.length < 15) {
                    console.warn('Skipping malformed question line:', line);
                    continue;
                }

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
            console.log(`Inserted ${dataLines.length} rows into part_a_questions.`);
        }
    } else {
        console.warn(`File not found: ${questionsPath}`);
    }
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
            } catch (err) {
                // Ignore
            }
        }

        console.log('Schema migration completed.');
        await populatePartA(connection);

        // Verification counts
        const [sentRows] = await connection.query("SELECT COUNT(*) as count FROM part_a_sentences");
        const [questRows] = await connection.query("SELECT COUNT(*) as count FROM part_a_questions");

        const verificationOutput = `
Verification Results:
part_a_sentences count: ${sentRows[0].count}
part_a_questions count: ${questRows[0].count}
        `;

        fs.writeFileSync('verification.txt', verificationOutput);
        console.log(verificationOutput);

    } catch (error) {
        console.error('Fatal Error:', error);
        fs.writeFileSync('verification_error.txt', String(error));
    } finally {
        if (connection) await connection.end();
    }
}

main();
