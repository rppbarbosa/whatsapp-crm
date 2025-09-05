module.exports = {
  apps: [{
    name: 'evolution-api',
    script: 'evolution-api.jar',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 8080,
      EVOLUTION_API_KEY: 'whatsapp-crm-evolution-key-2024-secure'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}; 