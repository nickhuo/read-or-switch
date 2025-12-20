
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

async function main() {
    console.log('Connecting to database...');
    console.log(`Host: ${dbConfig.host}, User: ${dbConfig.user}, DB: ${dbConfig.database}`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        // Split by semicolon to executestatement by statement for better error reporting
        // This is a naive split, but sufficient for this schema file
        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            // Skip `USE` if we are already connected to DB, or allow it
            try {
                await connection.query(statement);
            } catch (err: any) {
                console.error(`Error executing statement #${i + 1}:`);
                console.error(statement.substring(0, 100) + '...');
                console.error(err.message);
                // Don't exit, try next? Or exit?
                // For DROP it might fail if not exists (but IF EXISTS handles it)
                // For CREATE, we want to know.
                // We'll continue but log error.
            }
        }

        console.log('Schema migration completed.');

        // Verify tables
        const [rows] = await connection.query("SHOW TABLES");
        console.log("Current Tables:", (rows as any[]).map(r => Object.values(r)[0]));

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

main();
