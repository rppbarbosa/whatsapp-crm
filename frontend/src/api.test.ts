import { whatsappApi } from './services/api';

// Mock do axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

describe('WhatsApp API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstances', () => {
    it('should call the correct endpoint', () => {
      const mockAxios = require('axios').create();
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

      whatsappApi.getInstances();
      expect(mockAxios.get).toHaveBeenCalledWith('/api/whatsapp/instances');
    });
  });

  describe('createInstance', () => {
    it('should call the correct endpoint with data', () => {
      const mockAxios = require('axios').create();
      const instanceData = { instanceName: 'test-instance' };
      mockAxios.post.mockResolvedValue({ data: { success: true } });

      whatsappApi.createInstance(instanceData);
      expect(mockAxios.post).toHaveBeenCalledWith('/api/whatsapp/instances', instanceData);
    });
  });

  describe('deleteInstance', () => {
    it('should call the correct endpoint with instance name', () => {
      const mockAxios = require('axios').create();
      const instanceName = 'test-instance';
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      whatsappApi.deleteInstance(instanceName);
      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/whatsapp/instances/${instanceName}`);
    });
  });

  describe('connectInstance', () => {
    it('should call the correct endpoint', () => {
      const mockAxios = require('axios').create();
      const instanceName = 'test-instance';
      mockAxios.get.mockResolvedValue({ data: { success: true } });

      whatsappApi.connectInstance(instanceName);
      expect(mockAxios.get).toHaveBeenCalledWith(`/api/whatsapp/instances/${instanceName}/connect`);
    });
  });

  describe('getQRCode', () => {
    it('should call the correct endpoint', () => {
      const mockAxios = require('axios').create();
      const instanceName = 'test-instance';
      mockAxios.get.mockResolvedValue({ data: { success: true, data: { qrcode: 'data:image/png;base64,...' } } });

      whatsappApi.getQRCode(instanceName);
      expect(mockAxios.get).toHaveBeenCalledWith(`/api/whatsapp/instances/${instanceName}/qr-code`);
    });
  });
}); 