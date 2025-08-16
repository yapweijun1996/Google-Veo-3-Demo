/**
 * Conversation Manager - Handles chat history persistence and management
 */
class ConversationManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    
    // Storage configuration
    this.storageKey = 'veo3-conversation-history';
    this.maxMessages = 1000; // Maximum messages to store
    this.maxStorageSize = 50 * 1024 * 1024; // 50MB limit
    
    // Conversation data
    this.conversations = new Map();
    this.currentConversationId = null;
    this.messageCounter = 0;
    
    // Auto-save configuration
    this.autoSaveEnabled = true;
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
    
    this.init();
  }
  
  /**
   * Initialize conversation manager
   */
  init() {
    this.loadConversations();
    this.createNewConversation();
    this.setupAutoSave();
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for new messages
    document.addEventListener('messageSent', (event) => {
      this.addMessageToHistory(event.detail.message, 'user');
    });
    
    // Listen for video generation completion
    document.addEventListener('videoGenerationComplete', (event) => {
      const { success, error } = event.detail;
      if (success) {
        this.addMessageToHistory('Video generated successfully!', 'ai', 'video');
      } else if (error) {
        this.addMessageToHistory(`Generation failed: ${error}`, 'ai', 'error');
      }
    });
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.saveConversations();
    });
    
    // Handle visibility change for mobile
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveConversations();
      }
    });
  }
  
  /**
   * Create a new conversation
   * @param {string} title - Optional conversation title
   */
  createNewConversation(title = null) {
    const conversationId = this.generateConversationId();
    const conversation = {
      id: conversationId,
      title: title || this.generateConversationTitle(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      videoCount: 0
    };
    
    this.conversations.set(conversationId, conversation);
    this.currentConversationId = conversationId;
    
    // Add welcome message
    this.addWelcomeMessage();
    
    return conversationId;
  }
  
  /**
   * Add welcome message to new conversation
   */
  addWelcomeMessage() {
    const welcomeMessage = {
      id: this.generateMessageId(),
      text: 'Welcome to Veo 3 Video Generator! Describe the video you want to create and I\'ll generate it for you.',
      sender: 'ai',
      type: 'text',
      timestamp: new Date(),
      metadata: {
        isWelcome: true
      }
    };
    
    this.addMessageToConversation(this.currentConversationId, welcomeMessage);
    this.uiManager.addMessage(welcomeMessage.text, 'ai', 'text');
  }
  
  /**
   * Add message to conversation history
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'ai')
   * @param {string} type - Message type ('text', 'video', 'error')
   * @param {Object} metadata - Additional message metadata
   */
  addMessageToHistory(text, sender, type = 'text', metadata = {}) {
    if (!this.currentConversationId) {
      this.createNewConversation();
    }
    
    const message = {
      id: this.generateMessageId(),
      text,
      sender,
      type,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        conversationId: this.currentConversationId
      }
    };
    
    this.addMessageToConversation(this.currentConversationId, message);
    
    // Auto-save if enabled
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave();
    }
    
    return message;
  }
  
  /**
   * Add message to specific conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message object
   */
  addMessageToConversation(conversationId, message) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return false;
    }
    
    // Add message to conversation
    conversation.messages.push(message);
    conversation.messageCount++;
    conversation.updatedAt = new Date();
    
    // Update video count if it's a video message
    if (message.type === 'video') {
      conversation.videoCount++;
    }
    
    // Update conversation title if it's the first user message
    if (message.sender === 'user' && conversation.messageCount === 2) { // Welcome + first user message
      conversation.title = this.generateTitleFromMessage(message.text);
    }
    
    // Limit message history
    this.limitConversationSize(conversation);
    
    return true;
  }
  
  /**
   * Get current conversation
   */
  getCurrentConversation() {
    if (!this.currentConversationId) {
      return null;
    }
    return this.conversations.get(this.currentConversationId);
  }
  
  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }
  
  /**
   * Get all conversations
   */
  getAllConversations() {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Switch to different conversation
   * @param {string} conversationId - Conversation ID to switch to
   */
  switchConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return false;
    }
    
    // Save current conversation
    this.saveConversations();
    
    // Switch to new conversation
    this.currentConversationId = conversationId;
    
    // Load conversation messages into UI
    this.loadConversationIntoUI(conversation);
    
    return true;
  }
  
  /**
   * Load conversation messages into UI
   * @param {Object} conversation - Conversation object
   */
  loadConversationIntoUI(conversation) {
    // Clear current messages
    this.uiManager.clearMessages();
    
    // Add all messages from conversation
    conversation.messages.forEach(message => {
      this.uiManager.addMessage(
        message.text,
        message.sender,
        message.type,
        message.metadata
      );
    });
    
    // Scroll to bottom
    this.uiManager.scrollToBottom();
  }
  
  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID to delete
   */
  deleteConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      return false;
    }
    
    // Don't delete if it's the only conversation
    if (this.conversations.size === 1) {
      this.clearConversation(conversationId);
      return true;
    }
    
    // Delete conversation
    this.conversations.delete(conversationId);
    
    // If we deleted the current conversation, switch to another
    if (this.currentConversationId === conversationId) {
      const remainingConversations = this.getAllConversations();
      if (remainingConversations.length > 0) {
        this.switchConversation(remainingConversations[0].id);
      } else {
        this.createNewConversation();
      }
    }
    
    this.saveConversations();
    return true;
  }
  
  /**
   * Clear conversation messages
   * @param {string} conversationId - Conversation ID to clear
   */
  clearConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }
    
    // Clear messages but keep conversation
    conversation.messages = [];
    conversation.messageCount = 0;
    conversation.videoCount = 0;
    conversation.updatedAt = new Date();
    conversation.title = this.generateConversationTitle();
    
    // If it's the current conversation, clear UI and add welcome message
    if (conversationId === this.currentConversationId) {
      this.uiManager.clearMessages();
      this.addWelcomeMessage();
    }
    
    this.saveConversations();
    return true;
  }
  
  /**
   * Search conversations
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  searchConversations(query, options = {}) {
    const {
      includeMessages = true,
      caseSensitive = false,
      maxResults = 50
    } = options;
    
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    const results = [];
    
    for (const conversation of this.conversations.values()) {
      let matches = [];
      
      // Search conversation title
      const title = caseSensitive ? conversation.title : conversation.title.toLowerCase();
      if (title.includes(searchTerm)) {
        matches.push({
          type: 'title',
          text: conversation.title,
          conversation: conversation
        });
      }
      
      // Search messages if enabled
      if (includeMessages) {
        conversation.messages.forEach(message => {
          const messageText = caseSensitive ? message.text : message.text.toLowerCase();
          if (messageText.includes(searchTerm)) {
            matches.push({
              type: 'message',
              text: message.text,
              message: message,
              conversation: conversation
            });
          }
        });
      }
      
      if (matches.length > 0) {
        results.push({
          conversation,
          matches,
          matchCount: matches.length
        });
      }
      
      if (results.length >= maxResults) {
        break;
      }
    }
    
    return results.sort((a, b) => b.matchCount - a.matchCount);
  }
  
  /**
   * Export conversation
   * @param {string} conversationId - Conversation ID to export
   * @param {string} format - Export format ('json', 'txt', 'html')
   */
  exportConversation(conversationId, format = 'json') {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    switch (format.toLowerCase()) {
      case 'json':
        return this.exportAsJSON(conversation);
      case 'txt':
        return this.exportAsText(conversation);
      case 'html':
        return this.exportAsHTML(conversation);
      default:
        throw new Error('Unsupported export format');
    }
  }
  
  /**
   * Export conversation as JSON
   * @param {Object} conversation - Conversation to export
   */
  exportAsJSON(conversation) {
    return JSON.stringify(conversation, null, 2);
  }
  
  /**
   * Export conversation as text
   * @param {Object} conversation - Conversation to export
   */
  exportAsText(conversation) {
    let text = `Conversation: ${conversation.title}\n`;
    text += `Created: ${conversation.createdAt.toLocaleString()}\n`;
    text += `Messages: ${conversation.messageCount}\n\n`;
    
    conversation.messages.forEach(message => {
      const timestamp = message.timestamp.toLocaleTimeString();
      const sender = message.sender === 'user' ? 'You' : 'AI';
      text += `[${timestamp}] ${sender}: ${message.text}\n`;
    });
    
    return text;
  }
  
  /**
   * Export conversation as HTML
   * @param {Object} conversation - Conversation to export
   */
  exportAsHTML(conversation) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${conversation.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
    .user { background: #e3f2fd; text-align: right; }
    .ai { background: #f5f5f5; }
    .timestamp { font-size: 0.8em; color: #666; }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <p>Created: ${conversation.createdAt.toLocaleString()}</p>
  <div class="messages">`;
    
    conversation.messages.forEach(message => {
      const timestamp = message.timestamp.toLocaleTimeString();
      html += `
    <div class="message ${message.sender}">
      <div class="content">${message.text}</div>
      <div class="timestamp">${timestamp}</div>
    </div>`;
    });
    
    html += `
  </div>
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Import conversation
   * @param {string} data - Conversation data to import
   * @param {string} format - Import format
   */
  importConversation(data, format = 'json') {
    try {
      let conversation;
      
      switch (format.toLowerCase()) {
        case 'json':
          conversation = JSON.parse(data);
          break;
        default:
          throw new Error('Unsupported import format');
      }
      
      // Validate conversation structure
      if (!this.validateConversationStructure(conversation)) {
        throw new Error('Invalid conversation format');
      }
      
      // Generate new ID to avoid conflicts
      conversation.id = this.generateConversationId();
      conversation.createdAt = new Date(conversation.createdAt);
      conversation.updatedAt = new Date(conversation.updatedAt);
      
      // Convert message timestamps
      conversation.messages.forEach(message => {
        message.timestamp = new Date(message.timestamp);
      });
      
      // Add to conversations
      this.conversations.set(conversation.id, conversation);
      this.saveConversations();
      
      return conversation.id;
      
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }
  
  /**
   * Validate conversation structure
   * @param {Object} conversation - Conversation to validate
   */
  validateConversationStructure(conversation) {
    const required = ['title', 'messages', 'createdAt', 'messageCount'];
    return required.every(field => conversation.hasOwnProperty(field));
  }
  
  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave();
    }
  }
  
  /**
   * Schedule auto-save
   */
  scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.saveConversations();
    }, this.autoSaveInterval);
  }
  
  /**
   * Save conversations to localStorage
   */
  saveConversations() {
    try {
      const data = {
        conversations: Array.from(this.conversations.entries()),
        currentConversationId: this.currentConversationId,
        lastSaved: new Date().toISOString()
      };
      
      const serialized = JSON.stringify(data);
      
      // Check storage size
      if (serialized.length > this.maxStorageSize) {
        this.cleanupOldConversations();
        return this.saveConversations(); // Retry after cleanup
      }
      
      localStorage.setItem(this.storageKey, serialized);
      console.log('Conversations saved successfully');
      
    } catch (error) {
      console.error('Failed to save conversations:', error);
      
      // Try cleanup and retry once
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldConversations();
      }
    }
  }
  
  /**
   * Load conversations from localStorage
   */
  loadConversations() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }
      
      const data = JSON.parse(saved);
      
      // Restore conversations
      this.conversations = new Map(data.conversations.map(([id, conv]) => {
        // Convert date strings back to Date objects
        conv.createdAt = new Date(conv.createdAt);
        conv.updatedAt = new Date(conv.updatedAt);
        conv.messages.forEach(msg => {
          msg.timestamp = new Date(msg.timestamp);
        });
        return [id, conv];
      }));
      
      this.currentConversationId = data.currentConversationId;
      
      console.log(`Loaded ${this.conversations.size} conversations`);
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = new Map();
    }
  }
  
  /**
   * Cleanup old conversations to free space
   */
  cleanupOldConversations() {
    const conversations = this.getAllConversations();
    const toDelete = Math.ceil(conversations.length * 0.2); // Delete oldest 20%
    
    conversations
      .slice(-toDelete)
      .forEach(conv => {
        if (conv.id !== this.currentConversationId) {
          this.conversations.delete(conv.id);
        }
      });
    
    console.log(`Cleaned up ${toDelete} old conversations`);
  }
  
  /**
   * Limit conversation size
   * @param {Object} conversation - Conversation to limit
   */
  limitConversationSize(conversation) {
    if (conversation.messages.length > this.maxMessages) {
      const excess = conversation.messages.length - this.maxMessages;
      conversation.messages.splice(1, excess); // Keep welcome message
      conversation.messageCount = conversation.messages.length;
    }
  }
  
  /**
   * Generate conversation ID
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${++this.messageCounter}`;
  }
  
  /**
   * Generate conversation title
   */
  generateConversationTitle() {
    const now = new Date();
    return `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }
  
  /**
   * Generate title from message
   * @param {string} message - Message to generate title from
   */
  generateTitleFromMessage(message) {
    // Take first 50 characters and clean up
    let title = message.substring(0, 50).trim();
    if (message.length > 50) {
      title += '...';
    }
    return title;
  }
  
  /**
   * Get conversation statistics
   */
  getStats() {
    const conversations = this.getAllConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
    const totalVideos = conversations.reduce((sum, conv) => sum + conv.videoCount, 0);
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      totalVideos,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0,
      oldestConversation: conversations.length > 0 ? conversations[conversations.length - 1].createdAt : null,
      newestConversation: conversations.length > 0 ? conversations[0].createdAt : null
    };
  }
}

// Export for use in other modules
export default ConversationManager;