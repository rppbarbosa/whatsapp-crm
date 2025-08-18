import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WhatsAppManager from './components/WhatsAppManager';

// Mock das dependências
jest.mock('./services/api', () => ({
  whatsappApi: {
    getInstances: jest.fn().mockResolvedValue({ data: { data: [] } }),
    createInstance: jest.fn(),
    deleteInstance: jest.fn(),
    connectInstance: jest.fn(),
    getQRCode: jest.fn()
  }
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('WhatsAppManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<WhatsAppManager />);
    expect(screen.getByText('WhatsApp CRM Manager')).toBeInTheDocument();
  });

  it('should display the main sections', () => {
    render(<WhatsAppManager />);
    
    expect(screen.getByText('WhatsApp CRM Manager')).toBeInTheDocument();
    expect(screen.getByText('Instâncias')).toBeInTheDocument();
    expect(screen.getByText('Total Instâncias')).toBeInTheDocument();
  });

  it('should show create instance form', () => {
    render(<WhatsAppManager />);
    
    const input = screen.getByPlaceholderText('Digite o nome da instância (ex: whatsapp-crm)');
    const button = screen.getByRole('button', { name: /criar instância/i });
    
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it('should show empty state when no instances', () => {
    render(<WhatsAppManager />);
    
    expect(screen.getByText('Nenhuma instância encontrada. Crie uma para começar!')).toBeInTheDocument();
  });
}); 