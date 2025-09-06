const { EVOLUTION_API_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers.apikey || req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  console.log('🔐 Verificando autenticação:', {
    hasApiKey: !!apiKey,
    hasAuthHeader: !!authHeader,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não está configurada');
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Supabase service key is not configured'
    });
  }

  const expectedKey = EVOLUTION_API_KEY || 'test';
  const isEvolutionKeyValid = apiKey && apiKey === expectedKey;
  const isSupabaseKeyValid = authHeader &&
    authHeader.startsWith('Bearer ') &&
    authHeader.slice(7) === SUPABASE_SERVICE_ROLE_KEY &&
    authHeader.slice(7).length > 0;

  console.log('🔍 Detalhes da validação:', {
    evolutionKey: {
      present: !!apiKey,
      valid: isEvolutionKeyValid,
      length: apiKey?.length || 0
    },
    supabaseKey: {
      present: !!authHeader,
      hasBearer: authHeader?.startsWith('Bearer '),
      valid: isSupabaseKeyValid,
      length: authHeader?.slice(7)?.length || 0
    }
  });

  if (!isEvolutionKeyValid && !isSupabaseKeyValid) {
    console.log('❌ Autenticação falhou:', {
      evolutionKey: isEvolutionKeyValid ? '✅' : '❌',
      supabaseKey: isSupabaseKeyValid ? '✅' : '❌',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key or Supabase service key',
      details: {
        missingApiKey: !apiKey,
        missingAuthHeader: !authHeader,
        invalidFormat: authHeader && !authHeader.startsWith('Bearer ')
      }
    });
  }

  req.auth = {
    type: isEvolutionKeyValid ? 'evolution' : 'supabase',
    timestamp: new Date().toISOString()
  };

  console.log('✅ Autenticação bem-sucedida via', req.auth.type);
  next();
};

module.exports = {
  authenticateApiKey
};