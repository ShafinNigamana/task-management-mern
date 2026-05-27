import mysql from 'mysql2/promise';

let mysqlPool;

const createMySQLPool = () =>
  mysqlPool ??=
    mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

const verifyMySQLPool = async () => {
  const pool = createMySQLPool();
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
};

const connectMySQL = async () => {
  try {
    await verifyMySQLPool();

    console.log('MySQL connected successfully');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);

    process.exit(1);
  }
};

const getMySQLHealthStatus = async () => {
  try {
    await verifyMySQLPool();
    return 'ok';
  } catch {
    return 'error';
  }
};

export { connectMySQL, getMySQLHealthStatus };