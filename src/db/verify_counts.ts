
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function check() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rowsA] = await connection.query("SELECT COUNT(*) as c FROM part_c_passage");
        const [rowsB] = await connection.query("SELECT COUNT(*) as c FROM part_c_topic");
        const [rowsC] = await connection.query("SELECT COUNT(*) as c FROM part_c_questions");
        const [rowsD] = await connection.query("SELECT COUNT(*) as c FROM part_a_questions");

        const output = `Passages: ${rowsA[0].c}\nTopics: ${rowsB[0].c}\nC Questions: ${rowsC[0].c}\nA Questions: ${rowsD[0].c}`;
        console.log(output); // also log to stdout just in case
        fs.writeFileSync('counts.txt', output);

        await connection.end();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('counts.txt', 'Error: ' + e.message);
    }
}

check();
