// config/db.js
const mysql = require('mysql');

const db_config = {
  host: 'localhost',
  user: 'root',
  password: 'Database!',
  database: 'tripday',
  connectionLimit: 10,
  acquireTimeout: 30000,
  connectTimeout: 10000,
  waitForConnections: true,
  queueLimit: 0
};

let pool;

function createPool() {
  pool = mysql.createPool(db_config);

  pool.on('connection', (connection) => {
    console.log('MySQL 연결 풀에 새 연결이 생성되었습니다.');
  });

  pool.on('error', (err) => {
    console.error('MySQL 연결 풀 오류:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('MySQL 연결이 끊겼습니다. 재연결을 시도합니다...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

function handleDisconnect() {
  createPool();
}

function getConnection() {
  return new Promise((resolve, reject) => {
    if (!pool) {
      createPool();
    }
    pool.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }
      resolve(connection);
    });
  });
}

function query(sql, values) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      connection.query(sql, values, (error, results) => {
        connection.release();
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Initial pool creation
createPool();

module.exports = { query, getConnection };
