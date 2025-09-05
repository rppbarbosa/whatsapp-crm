// API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const EVOLUTION_API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
export const API_KEY = EVOLUTION_API_KEY; // Alias para compatibilidade

// WebSocket
export const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

// Evolution API WebSocket
export const EVOLUTION_WS_URL = process.env.REACT_APP_EVOLUTION_WS_URL || 'ws://localhost:3002';

// Supabase
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;