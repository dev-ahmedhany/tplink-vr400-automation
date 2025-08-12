module.exports = {
  apps: [{
    name: 'tplink-scraper',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    log_file: '~/.pm2/logs/tplink-scraper.log',
    out_file: '~/.pm2/logs/tplink-scraper-out.log',
    error_file: '~/.pm2/logs/tplink-scraper-error.log',
    time: true
  }]
};
