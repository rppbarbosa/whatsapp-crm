import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { LeadProvider } from './contexts/LeadContext';
import { LeadModalProvider } from './contexts/LeadModalContext';
import { UserProjectProvider } from './contexts/UserProjectContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ConfirmEmail from './pages/auth/ConfirmEmail';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import PipelineVendas from './pages/PipelineVendas';
import Tarefas from './pages/Tarefas';
import Calendario from './pages/Calendario';
import WhatsAppBusinessSimple from './pages/WhatsAppBusinessSimple';
import GerenciarInstanciasSimple from './pages/GerenciarInstanciasSimple';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProjectProvider>
          <TaskProvider>
            <LeadProvider>
              <LeadModalProvider>
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
              </Route>

              {/* Rotas diretas para cada página */}
              <Route path="/leads" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Leads />} />
              </Route>

              <Route path="/pipeline-vendas" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<PipelineVendas />} />
              </Route>

              <Route path="/tarefas" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Tarefas />} />
              </Route>

              <Route path="/calendario" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Calendario />} />
              </Route>

              <Route path="/whatsapp" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<WhatsAppBusinessSimple />} />
              </Route>

              <Route path="/gerenciar-instancias" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<GerenciarInstanciasSimple />} />
              </Route>

              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Relatorios />} />
              </Route>

              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Configuracoes />} />
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
        </LeadModalProvider>
      </LeadProvider>
    </TaskProvider>
  </UserProjectProvider>
</AuthProvider>
</ThemeProvider>
  );
}

export default App;
