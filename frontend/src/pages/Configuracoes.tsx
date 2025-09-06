import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
  Mail,
  Smartphone,
  Monitor,
  Download,
  Upload,
  Trash2,
  Save,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import UserProfile from '../components/UserProfile';

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    dataSharing: boolean;
    analytics: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
}

const Configuracoes: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    phone: '+55 11 99999-9999',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    notifications: {
      email: true,
      push: true,
      sms: false,
      whatsapp: true
    },
    privacy: {
      profileVisibility: 'team',
      dataSharing: true,
      analytics: true
    },
    appearance: {
      theme: 'auto',
      fontSize: 'medium',
      compactMode: false
    }
  });

  const [activeTab, setActiveTab] = useState('perfil');
  // const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [expandedSections, setExpandedSections] = useState<string[]>(['perfil']);

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'privacidade', label: 'Privacidade', icon: Shield },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'integracao', label: 'Integrações', icon: Zap },
    { id: 'sistema', label: 'Sistema', icon: Monitor }
  ];

  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' }
  ];

  // const toggleSection = (sectionId: string) => {
  //   setExpandedSections(prev => 
  //     prev.includes(sectionId) 
  //       ? prev.filter(id => id !== sectionId)
  //       : [...prev, sectionId]
  //   );
  // };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleSave = () => {
    console.log('Salvando configurações:', settings);
    // Implementar lógica de salvamento
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configuracoes.json';
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
        } catch (error) {
          console.error('Erro ao importar configurações:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurações
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie suas preferências e configurações do sistema
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <label className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar de Navegação */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <nav className="p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-6">
          {/* Perfil */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              {/* Componente UserProfile */}
              <UserProfile />

              {/* Configurações adicionais do perfil */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configurações Adicionais
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fuso Horário
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Segurança
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Senha</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Última alteração há 30 dias
                      </p>
                    </div>
                    <button
                      onClick={() => console.log('Alterar senha')}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Alterar
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Autenticação de Dois Fatores</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Adicione uma camada extra de segurança
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notificações */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preferências de Notificação
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {key === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                        {key === 'push' && <Bell className="w-5 h-5 text-green-600" />}
                        {key === 'sms' && <Smartphone className="w-5 h-5 text-purple-600" />}
                        {key === 'whatsapp' && <MessageCircle className="w-5 h-5 text-green-600" />}
                        
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                            {key === 'email' ? 'Email' : key === 'push' ? 'Push' : key === 'sms' ? 'SMS' : 'WhatsApp'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Receber notificações via {key === 'email' ? 'email' : key === 'push' ? 'push' : key === 'sms' ? 'SMS' : 'WhatsApp'}
                          </p>
                        </div>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSetting(`notifications.${key}`, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacidade */}
          {activeTab === 'privacidade' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configurações de Privacidade
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visibilidade do Perfil
                    </label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => updateSetting('privacy.profileVisibility', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="public">Público</option>
                      <option value="team">Apenas Equipe</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Compartilhamento de Dados</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permitir que o sistema use dados anônimos para melhorias
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.dataSharing}
                          onChange={(e) => updateSetting('privacy.dataSharing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Analytics</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Coletar métricas de uso para otimização
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.analytics}
                          onChange={(e) => updateSetting('privacy.analytics', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aparência */}
          {activeTab === 'aparencia' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personalização da Interface
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tema
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Claro', icon: '☀️' },
                        { value: 'dark', label: 'Escuro', icon: '🌙' },
                        { value: 'auto', label: 'Automático', icon: '🔄' }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => updateSetting('appearance.theme', theme.value)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            settings.appearance.theme === theme.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="text-2xl mb-2">{theme.icon}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {theme.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tamanho da Fonte
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'small', label: 'Pequeno', size: 'text-sm' },
                        { value: 'medium', label: 'Médio', size: 'text-base' },
                        { value: 'large', label: 'Grande', size: 'text-lg' }
                      ].map((size) => (
                        <button
                          key={size.value}
                          onClick={() => updateSetting('appearance.fontSize', size.value)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            settings.appearance.fontSize === size.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className={`${size.size} font-medium text-gray-900 dark:text-white mb-1`}>
                            Aa
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {size.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Modo Compacto</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reduzir espaçamentos para mais conteúdo na tela
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.compactMode}
                        onChange={(e) => updateSetting('appearance.compactMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrações */}
          {activeTab === 'integracao' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Integrações Externas
                </h2>
                
                <div className="space-y-4">
                  {[
                    { name: 'WhatsApp Business API', status: 'connected', icon: MessageCircle, color: 'text-green-600' },
                    { name: 'Google Workspace', status: 'available', icon: Mail, color: 'text-blue-600' },
                    { name: 'Slack', status: 'available', icon: MessageCircle, color: 'text-purple-600' },
                    { name: 'Zapier', status: 'available', icon: Zap, color: 'text-orange-600' }
                  ].map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <integration.icon className={`w-5 h-5 ${integration.color}`} />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{integration.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {integration.status === 'connected' ? 'Conectado' : 'Disponível para conexão'}
                          </p>
                        </div>
                      </div>
                      
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        integration.status === 'connected'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      }`}>
                        {integration.status === 'connected' ? 'Conectado' : 'Conectar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sistema */}
          {activeTab === 'sistema' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações do Sistema
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Versão do Sistema</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2.0.0</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Última Atualização</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">19/12/2024</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Status do Servidor</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Online</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Armazenamento</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2.3 GB / 10 GB</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Backup Automático</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Ativo</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Monitoramento</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ações do Sistema
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">Backup Manual</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Criar backup agora</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="p-4 text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Verificar Atualizações</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Buscar novas versões</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="p-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <h3 className="font-medium text-red-900 dark:text-red-100">Limpar Cache</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">Remover dados temporários</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => console.log('Excluir conta')}
                    className="p-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <h3 className="font-medium text-red-900 dark:text-red-100">Excluir Conta</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">Remover permanentemente</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
