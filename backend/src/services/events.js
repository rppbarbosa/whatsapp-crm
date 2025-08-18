const EventEmitter = require('events');

class ConversationEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0); // ilimitado por segurança
  }

  getConversationKey(instanceName, contactId) {
    if (!instanceName || !contactId) return null;
    const plain = contactId.includes('@c.us') ? contactId.replace('@c.us', '') : contactId;
    return `conv:${instanceName}:${plain}`;
  }

  publish(instanceName, contactId, payload) {
    const key = this.getConversationKey(instanceName, contactId);
    if (!key) return;
    this.emit(key, payload);
  }

  subscribe(instanceName, contactId, listener) {
    const key = this.getConversationKey(instanceName, contactId);
    if (!key) return () => {};
    this.on(key, listener);
    return () => this.off(key, listener);
  }
}

module.exports = new ConversationEvents();