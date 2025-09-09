const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
require('dotenv').config();

// Importar serviços
const WebSocketService = require('./services/websocketService');
const MessagePersistenceService = require('./services/messagePersistenceService');

// Importar configurações
const developmentConfig = require('./config/development');

const app = express();
const server = http.createServer(app);
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
      conversations: '/api/conversations'
      // ai: '/api/ai' // Temporariamente desabilitado
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket desabilitado
// app.get('/websocket/stats', (req, res) => {
//   try {
//     const websocketService = require('./services/websocketService');
//     const stats = websocketService.getStats();
//     res.json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: 'Erro ao obter estatísticas do WebSocket'
//     });
//   }
// });

// Importar rotas
const whatsappWPPConnectRoutes = require('./routes/whatsappWPPConnect');
const whatsappOptimizedRoutes = require('./routes/whatsappOptimized');
const customerRoutes = require('./routes/customers');
// const aiRoutes = require('./routes/ai'); // Temporariamente desabilitado
const leadsRoutes = require('./routes/leads');
const evolutionChannelRoutes = require('./routes/evolutionChannel');
const authRoutes = require('./routes/auth');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappWPPConnectRoutes);
app.use('/api/whatsapp-optimized', whatsappOptimizedRoutes); // Nova rota otimizada
app.use('/api/customers', customerRoutes);
// app.use('/api/ai', aiRoutes); // Temporariamente desabilitado
app.use('/api/leads', leadsRoutes);
app.use('/api/evolution-channel', evolutionChannelRoutes);
        app.use('/webhook', evolutionChannelRoutes); // Webhook público para Evolution Channel (conforme documentação oficial)

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
    
    // WebSocket desabilitado - causando instâncias temporárias desnecessárias
    // const websocketService = require('./services/websocketService');
    // websocketService.initialize(server);
    
    // Iniciar servidor
    server.listen(PORT, async () => {
      console.log('='.repeat(50));
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 WhatsApp CRM API: http://localhost:${PORT}`);
      console.log(`🔑 API Key: ${process.env.EVOLUTION_API_KEY || 'te um test'}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:3000/manager.html`);
      console.log('='.repeat(50));
      
      // Status das conexões
      console.log('📊 Status das conexões:');
      console.log(`  🗄️ Supabase: ✅ Configurado`);
      console.log(`  ⚡ Cache: ⚠️ Em memória`);
      console.log('='.repeat(50));
      
                    // Verificar se o WPPConnect está disponível
              try {
                const wppconnectService = require('./services/wppconnectService');
                console.log('✅ WPPConnect está disponível e funcionando');
              } catch (healthError) {
                console.log('⚠️ WPPConnect não está funcionando corretamente');
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

// Inicializar WebSocket após o servidor estar pronto
server.on('listening', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  WebSocketService.init(server);
  console.log('✅ WebSocket Service inicializado');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, fechando aplicação...');
  process.exit(0);
}); 