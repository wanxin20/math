/**
 * 导入《国家自然科学基金项目结题成果科普性介绍》（U21A20455）到 news_announcements。
 *
 * 用法（在 backend 目录下执行，依赖 mysql2，已是项目依赖）：
 *   node scripts/seed-news-article.js --env .env.paper          # 指定环境文件
 *   node scripts/seed-news-article.js --env .env.paper --force  # 已存在时更新正文/摘要
 *
 * 行为：
 *   1) 将 scripts/assets/news-u21a20455/fig{1,2,3}.jpg 按上传命名规则拷贝到 uploads/images/
 *   2) 正文占位符替换为 /uploads/<SYSTEM_PREFIX>/images/<文件名>（与现网上传文件一致，由 nginx 解析；
 *      开发环境 vite 已配置 /uploads/paper 代理）
 *   3) 幂等：按标题查重，已存在则跳过（--force 时更新 content/summary 并重新拷贝图片，
 *      旧图片文件会留在 uploads/images/ 中成为冗余，可手动清理）
 *
 * 生产部署：在 paper 实例目录执行并确保 DB_* 指向 paper 库；uploads/ 目录需随实例持久化。
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TITLE =
  '这些技术助力宽带电磁信号高效压缩采样与智能化处理——国家自然科学基金项目结题成果科普性介绍';
const SUMMARY =
  '本介绍来源于国家自然科学基金联合重点项目"宽带电磁信号压缩采样与智能处理一体化研究"（No. U21A20455），项目起止时间为2022年1月至2025年12月。';
const PUBLISH_DATE = '2026-06-11';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { env: '.env', force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env') out.env = args[++i];
    else if (args[i] === '--force') out.force = true;
  }
  return out;
}

/** 极简 .env 解析（KEY=VALUE，忽略注释行） */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

async function main() {
  const { env: envFile, force } = parseArgs();
  const backendRoot = path.resolve(__dirname, '..');
  const fileEnv = loadEnvFile(path.join(backendRoot, envFile));
  const env = { ...fileEnv, ...process.env };

  const prefix = env.SYSTEM_PREFIX || 'paper';
  const assetsDir = path.join(__dirname, 'assets', 'news-u21a20455');
  const uploadsDir = path.join(backendRoot, 'uploads', 'images');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  try {
    const [rows] = await conn.execute(
      'SELECT id FROM news_announcements WHERE title = ? LIMIT 1',
      [TITLE],
    );
    if (rows.length > 0 && !force) {
      console.log(`已存在（id=${rows[0].id}），跳过。如需更新正文请加 --force`);
      return;
    }

    // 1) 拷贝图片（按现有上传命名规则：时间戳-随机数.jpg）
    const urls = {};
    for (const i of [1, 2, 3]) {
      const src = path.join(assetsDir, `fig${i}.jpg`);
      if (!fs.existsSync(src)) {
        throw new Error(`缺少图片资产：${src}`);
      }
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      fs.copyFileSync(src, path.join(uploadsDir, name));
      urls[`__FIG${i}__`] = `/uploads/${prefix}/images/${name}`;
    }

    // 2) 组装正文
    let content = fs.readFileSync(path.join(assetsDir, 'article.html'), 'utf8');
    for (const [ph, url] of Object.entries(urls)) {
      content = content.split(ph).join(url);
    }

    // 3) 入库
    if (rows.length > 0) {
      await conn.execute(
        'UPDATE news_announcements SET content = ?, summary = ? WHERE id = ?',
        [content, SUMMARY, rows[0].id],
      );
      console.log(`已更新正文（id=${rows[0].id}）`);
      console.log(`门户深链：https://competition.szmath.com/#/news/${rows[0].id}`);
      return;
    }
    const [result] = await conn.execute(
      `INSERT INTO news_announcements
        (title, content, summary, type, priority, is_published, publish_date, view_count)
       VALUES (?, ?, ?, 'news', 'normal', 1, ?, 0)`,
      [TITLE, content, SUMMARY, PUBLISH_DATE],
    );
    console.log(`导入成功，id=${result.insertId}`);
    console.log(`门户深链：https://competition.szmath.com/#/news/${result.insertId}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('导入失败：', err.message);
  process.exit(1);
});
