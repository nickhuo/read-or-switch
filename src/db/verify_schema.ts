
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function check() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("DESCRIBE participant_knowledge");
        fs.writeFileSync('schema_desc.txt', JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (e) {
        fs.writeFileSync('schema_desc.txt', 'Error: ' + e.message);
    }
}

check();
