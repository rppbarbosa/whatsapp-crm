import {
  processContactForDisplay,
  processContactsForDisplay,
  filterContactsByType,
  sortContactsByRelevance,
  generateInitials,
  isContactOnline,
  formatTimestamp,
  getCleanPhoneNumber
} from './utils/whatsappUtils';

describe('WhatsApp Utils', () => {
  describe('processContactForDisplay', () => {
    it('should process contact with display name', () => {
      const contact = {
        id: '123456789@c.us',
        name: 'John Doe',
        phone: '123456789',
        display_name: 'John',
        push_name: 'Johnny',
        is_group: false,
        is_wa_contact: true,
        is_business: false,
        is_verified: false
      };

      const result = processContactForDisplay(contact);
      expect(result.displayName).toBe('John');
      expect(result.displayPhone).toBe('123456789');
      expect(result.isGroup).toBe(false);
    });

    it('should fallback to name when display_name is not available', () => {
      const contact = {
        id: '123456789@c.us',
        name: 'John Doe',
        phone: '123456789',
        display_name: undefined,
        is_group: false,
        is_wa_contact: true,
        is_business: false,
        is_verified: false
      };

      const result = processContactForDisplay(contact);
      expect(result.displayName).toBe('John Doe');
    });
  });

  describe('generateInitials', () => {
    it('should generate initials from name', () => {
      expect(generateInitials('John Doe')).toBe('JD');
      expect(generateInitials('Maria Silva Santos')).toBe('MS');
      expect(generateInitials('A')).toBe('A');
      expect(generateInitials('')).toBe('?');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatTimestamp(now.getTime())).toMatch(/^\d{1,2}:\d{2}$/);
      expect(formatTimestamp(oneHourAgo.getTime())).toMatch(/^\d{1,2}:\d{2}$/);
      expect(formatTimestamp(oneDayAgo.getTime())).toMatch(/^\d{1,2}\/\d{1,2}$/);
    });
  });

  describe('getCleanPhoneNumber', () => {
    it('should clean phone number correctly', () => {
      const contact1 = { id: '123456789@c.us', phone: '123456789@c.us' } as any;
      const contact2 = { id: '123456789@g.us', phone: '123456789@g.us' } as any;
      const contact3 = { id: '123456789', phone: '123456789' } as any;
      const contact4 = { id: '', phone: '' } as any;
      
      expect(getCleanPhoneNumber(contact1)).toBe('123456789');
      expect(getCleanPhoneNumber(contact2)).toBe('123456789');
      expect(getCleanPhoneNumber(contact3)).toBe('123456789');
      expect(getCleanPhoneNumber(contact4)).toBe('');
    });
  });

  describe('filterContactsByType', () => {
    it('should filter contacts by type', () => {
      const contacts = [
        { id: '1@c.us', is_group: false, name: 'Contact 1', displayName: 'Contact 1', displayPhone: '123', isGroup: false, isBusiness: false, isVerified: false, hasMessages: true, originalData: {} as any },
        { id: '2@g.us', is_group: true, name: 'Group 1', displayName: 'Group 1', displayPhone: 'Group', isGroup: true, isBusiness: false, isVerified: false, hasMessages: true, originalData: {} as any },
        { id: '3@c.us', is_group: false, name: 'Contact 2', displayName: 'Contact 2', displayPhone: '456', isGroup: false, isBusiness: false, isVerified: false, hasMessages: true, originalData: {} as any }
      ];

      const individualContacts = filterContactsByType(contacts, 'contacts');
      expect(individualContacts).toHaveLength(2);

      const groupContacts = filterContactsByType(contacts, 'groups');
      expect(groupContacts).toHaveLength(1);
    });
  });

  describe('sortContactsByRelevance', () => {
    it('should sort contacts by relevance', () => {
      const contacts = [
        { id: '1', displayName: 'Contact 1', displayPhone: '123', isGroup: false, isBusiness: false, isVerified: false, hasMessages: true, originalData: { last_message_timestamp: 1000 } as any },
        { id: '2', displayName: 'Contact 2', displayPhone: '456', isGroup: false, isBusiness: false, isVerified: false, hasMessages: true, originalData: { last_message_timestamp: 3000 } as any },
        { id: '3', displayName: 'Contact 3', displayPhone: '789', isGroup: false, isBusiness: false, isVerified: false, hasMessages: true, originalData: { last_message_timestamp: 2000 } as any }
      ];

      const sorted = sortContactsByRelevance(contacts);
      expect(sorted[0].id).toBe('2'); // Most recent first
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });
}); 