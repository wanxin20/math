// PM2 配置文件 - 双系统部署
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
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.paper',
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
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env.reform',
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
