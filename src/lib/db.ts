import mysql from 'mysql2/promise';

const poolConfig = process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
    : {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
      };

export const pool = mysql.createPool(poolConfig);

export async function query(sql: string, values?: (string | number | boolean | null | undefined)[]) {
    const [results] = await pool.execute(sql, values);
    return results;
}
