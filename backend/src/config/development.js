// Configurações específicas para desenvolvimento
const developmentConfig = {
  // Verificar se está em desenvolvimento
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Configurações de debug
  debug: {
    enabled: process.env.DEBUG === 'true',
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // Configurações de cache
  cache: {
    memoryCache: {
      maxSize: 1000,
      ttl: 3600 // 1 hora
    }
  },
  
  // Configurações de banco de dados
  database: {
    // Usar Supabase por padrão em desenvolvimento
    useSupabase: true
  },
  
  // Configurações de WhatsApp
  whatsapp: {
    // Configurações do Puppeteer para desenvolvimento
    puppeteer: {
      headless: process.env.WHATSAPP_HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  },
  
  // Configurações de segurança
  security: {
    // Permitir CORS mais permissivo em desenvolvimento
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ],
      credentials: true
    },
    
    // Rate limiting mais permissivo em desenvolvimento
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000 // 1000 requests por IP
    }
  },
  
  // Configurações de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'dev',
    colorize: true
  }
};

module.exports = developmentConfig; 