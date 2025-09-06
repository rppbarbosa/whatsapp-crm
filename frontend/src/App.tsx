import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ConfirmEmail from './pages/auth/ConfirmEmail';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import PipelineVendas from './pages/PipelineVendas';
import WhatsAppBusinessSimple from './pages/WhatsAppBusinessSimple';
import WhatsAppSimple from './pages/WhatsAppSimple';
import GerenciarInstanciasSimple from './pages/GerenciarInstanciasSimple';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Rotas de autenticação - não requerem login */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
                              <Route path="/register" element={
                                <ProtectedRoute requireAuth={false}>
                                  <Register />
                                </ProtectedRoute>
                              } />
                              <Route path="/confirm-email" element={
                                <ProtectedRoute requireAuth={false}>
                                  <ConfirmEmail />
                                </ProtectedRoute>
                              } />
              
              {/* Rota raiz - redireciona para dashboard */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
              </Route>
              
              {/* Rotas principais - requerem autenticação */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="pipeline-vendas" element={<PipelineVendas />} />
                <Route path="whatsapp" element={<WhatsAppBusinessSimple />} />
                <Route path="whatsapp-simple" element={<WhatsAppSimple />} />
                <Route path="gerenciar-instancias" element={<GerenciarInstanciasSimple />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Route>
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
