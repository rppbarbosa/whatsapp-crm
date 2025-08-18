// Configurações específicas para Vercel
const vercelConfig = {
  // Verificar se está rodando na Vercel
  isVercel: process.env.VERCEL === '1',
  
  // Configurações de timeout
  timeout: 30000, // 30 segundos
  
  // Configurações de memória
  maxMemory: '1024mb',
  
  // Configurações de região
  region: process.env.VERCEL_REGION || 'iad1',
  
  // Configurações de ambiente
  environment: process.env.NODE_ENV || 'production',
  
  // URLs de produção
  getApiUrl: () => {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.API_URL || 'http://localhost:3001';
  },
  
  // Configurações de CORS para Vercel
  corsOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://*.vercel.app',
    'https://*.vercel.app/*'
  ],
  
  // Configurações de rate limiting para Vercel
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite por IP
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Configurações de segurança para Vercel
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.vercel.app"],
        },
      },
    }
  }
};

module.exports = vercelConfig; 