// PM2 配置文件 - 双系统部署
const fs = require('fs');
const path = require('path');

// 加载环境变量文件的函数
function loadEnvFile(filePath) {
  const envConfig = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      line = line.trim();
      // 跳过注释和空行
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envConfig[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  return envConfig;
}

// 加载两个系统的环境变量
const paperEnv = loadEnvFile(path.join(__dirname, '.env.paper'));
const reformEnv = loadEnvFile(path.join(__dirname, '.env.reform'));

module.exports = {
  apps: [
    {
      name: 'paper-system',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        ...paperEnv,
        NODE_ENV: 'production',  // 确保生产环境
      },
      error_file: 'logs/paper-error.log',
      out_file: 'logs/paper-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'reform-system',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        ...reformEnv,
        NODE_ENV: 'production',  // 确保生产环境
      },
      error_file: 'logs/reform-error.log',
      out_file: 'logs/reform-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
