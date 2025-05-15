import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: '115.159.44.226',
  user: 'news_yd',
  password: '4YaJs5pfiWkkCmB2',
  database: 'news_yd',
  port: 3306
};

// Add connection config logging
console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = mysql.createPool({
  ...dbConfig,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://newsnw-ai-2.pages.dev'],
  credentials: true
}));
app.use(express.json());

// Test database connection before starting server
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    return false;
  }
}

app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(`
      SELECT 
        id,
        title,
        mobile_url,
        pc_url,
        pub_date,
        real_pub_date,
        collect_time,
        news_from,
        news_from_id,
        news_pingfen,
        news_pingfen_liyou,
        news_summary,
        market_analysis,
        no_net_pngfen,
        no_net_pingfen_liyou
      FROM news_yd 
      WHERE pc_url IS NOT NULL
      ORDER BY pub_date DESC 
      LIMIT ?, ?
    `, [offset, pageSize]);
    
    res.json(rows);
  } catch (error) {
    console.error('Query failed:', error);
    res.status(500).json({ error: '获取新闻失败' });
  }
});

// 添加重要新闻接口
app.get('/api/news/important', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    
    // 获取今天的开始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        title,
        mobile_url,
        pc_url,
        pub_date,
        real_pub_date,
        collect_time,
        news_from,
        news_from_id,
        news_pingfen,
        news_pingfen_liyou,
        news_summary,
        market_analysis,
        no_net_pngfen,
        no_net_pingfen_liyou
      FROM news_yd 
      WHERE pc_url IS NOT NULL
        AND news_pingfen >= 70
        AND pub_date >= ?
      ORDER BY pub_date DESC 
      LIMIT ?, ?
    `, [today, offset, pageSize]);
    
    res.json(rows);
  } catch (error) {
    console.error('Query failed:', error);
    res.status(500).json({ error: '获取重要新闻失败' });
  }
});

const PORT = process.env.PORT || 3000;

// Start server only after testing connection
testConnection().then(success => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    console.error('Server not started due to database connection failure');
  }
});