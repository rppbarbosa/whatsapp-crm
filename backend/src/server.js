const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Importar configurações
const developmentConfig = require('./config/development');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Configuração CORS
const corsOrigins = developmentConfig.isDevelopment 
  ? developmentConfig.security.cors.origin
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://your-frontend-domain.vercel.app'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-api-key']
}));

// Rate limiting
const rateLimitConfig = developmentConfig.isDevelopment 
  ? developmentConfig.security.rateLimit
  : {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // limite de 100 requests por IP
    };

const limiter = rateLimit(rateLimitConfig);
app.use(limiter);

// Middleware de compressão
app.use(compression());

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Rotas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp CRM API está funcionando!',
    version: '1.0.0',
    endpoints: {
      whatsapp: '/api/whatsapp',
      customers: '/api/customers',
      conversations: '/api/conversations',
      ai: '/api/ai'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Importar rotas
const whatsappRoutes = require('./routes/whatsapp');
const customerRoutes = require('./routes/customers');
const aiRoutes = require('./routes/ai');
const leadsRoutes = require('./routes/leads');

// Usar rotas
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leads', leadsRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar configurações
async function initializeApp() {
  try {
    console.log('🚀 Inicializando WhatsApp CRM API...');
    
    // Iniciar servidor
    app.listen(PORT, async () => {
      console.log('='.repeat(50));
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 WhatsApp CRM API: http://localhost:${PORT}`);
      console.log(`🔑 API Key: ${process.env.EVOLUTION_API_KEY || 'test'}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:3000/manager.html`);
      console.log('='.repeat(50));
      
      // Status das conexões
      console.log('📊 Status das conexões:');
      console.log(`  🗄️ Supabase: ✅ Configurado`);
      console.log(`  ⚡ Cache: ⚠️ Em memória`);
      console.log('='.repeat(50));
      
      // Restaurar instâncias ativas do banco de dados
      try {
        const evolutionApiService = require('./services/evolutionApi');
        await evolutionApiService.restoreActiveInstances();
      } catch (restoreError) {
        console.error('❌ Erro ao restaurar instâncias ativas:', restoreError.message);
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Inicializar aplicação
initializeApp();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, fechando aplicação...');
  process.exit(0);
}); 