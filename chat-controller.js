/**
 * Chat Controller - Handles message input and basic chat functionality
 */
class ChatController {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.inputField = null;
    this.sendButton = null;
    
    // Input validation settings
    this.maxMessageLength = 500;
    this.minMessageLength = 3;
    
    // Rate limiting
    this.lastMessageTime = 0;
    this.messageRateLimit = 1000; // 1 second between messages
    
    // Input state
    this.isProcessing = false;
    
    this.init();
  }
  
  /**
   * Initialize the chat controller
   */
  init() {
    this.bindElements();
    this.setupEventListeners();
    this.setupInputValidation();
  }
  
  /**
   * Bind DOM elements
   */
  bindElements() {
    this.inputField = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
    
    if (!this.inputField || !this.sendButton) {
      console.error('Chat input elements not found');
    }
  }
  
  /**
   * Set up event listeners for chat functionality
   */
  setupEventListeners() {
    // Send button click
    this.sendButton?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSendMessage();
    });
    
    // Enter key to send message
    this.inputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
    
    // Input validation on typing
    this.inputField?.addEventListener('input', () => {
      this.validateInput();
      this.updateSendButtonState();
    });
    
    // Paste event handling
    this.inputField?.addEventListener('paste', (e) => {
      // Allow paste but validate after
      setTimeout(() => {
        this.validateInput();
        this.updateSendButtonState();
      }, 0);
    });
    
    // Focus management
    this.inputField?.addEventListener('focus', () => {
      this.inputField.parentElement?.classList.add('focused');
    });
    
    this.inputField?.addEventListener('blur', () => {
      this.inputField.parentElement?.classList.remove('focused');
    });
  }
  
  /**
   * Set up input validation styling
   */
  setupInputValidation() {
    if (!this.inputField) return;
    
    // Add character counter
    this.createCharacterCounter();
    
    // Set initial state
    this.updateSendButtonState();
  }
  
  /**
   * Create character counter element
   */
  createCharacterCounter() {
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.style.cssText = `
      position: absolute;
      bottom: -20px;
      right: 0;
      font-size: 0.75rem;
      color: var(--text-light);
      transition: color var(--transition-fast);
    `;
    
    // Position the input container relatively
    const inputContainer = this.inputField.parentElement;
    if (inputContainer) {
      inputContainer.style.position = 'relative';
      inputContainer.appendChild(counter);
    }
    
    this.characterCounter = counter;
    this.updateCharacterCounter();
  }
  
  /**
   * Handle sending a message
   */
  async handleSendMessage() {
    if (this.isProcessing) return;
    
    const message = this.getInputValue();
    
    // Validate message
    if (!this.isValidMessage(message)) {
      return;
    }
    
    // Check rate limiting
    if (!this.checkRateLimit()) {
      this.uiManager.showNotification('Please wait before sending another message', 'warning');
      return;
    }
    
    try {
      this.isProcessing = true;
      this.updateSendButtonState();
      
      // Add user message to chat
      const userMessageElement = this.uiManager.addMessage(message, 'user', 'text');
      
      // Clear input
      this.uiManager.clearInput();
      this.updateCharacterCounter();
      
      // Update last message time
      this.lastMessageTime = Date.now();
      
      // Dispatch message sent event
      this.dispatchMessageSent(message, userMessageElement);
      
      // Focus back on input
      setTimeout(() => {
        this.uiManager.focusInput();
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.uiManager.showNotification('Failed to send message', 'error');
    } finally {
      this.isProcessing = false;
      this.updateSendButtonState();
    }
  }
  
  /**
   * Get current input value
   */
  getInputValue() {
    return this.inputField?.value.trim() || '';
  }
  
  /**
   * Validate message content
   * @param {string} message - Message to validate
   */
  isValidMessage(message) {
    // Check if empty
    if (!message || message.length === 0) {
      this.showInputError('Please enter a message');
      return false;
    }
    
    // Check minimum length
    if (message.length < this.minMessageLength) {
      this.showInputError(`Message must be at least ${this.minMessageLength} characters`);
      return false;
    }
    
    // Check maximum length
    if (message.length > this.maxMessageLength) {
      this.showInputError(`Message must be less than ${this.maxMessageLength} characters`);
      return false;
    }
    
    // Check for potentially harmful content
    if (this.containsHarmfulContent(message)) {
      this.showInputError('Message contains inappropriate content');
      return false;
    }
    
    return true;
  }
  
  /**
   * Check for potentially harmful content
   * @param {string} message - Message to check
   */
  containsHarmfulContent(message) {
    // Basic content filtering - can be expanded
    const harmfulPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    return harmfulPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    return (now - this.lastMessageTime) >= this.messageRateLimit;
  }
  
  /**
   * Validate input and update UI
   */
  validateInput() {
    const message = this.getInputValue();
    const length = message.length;
    
    // Update character counter
    this.updateCharacterCounter();
    
    // Update input styling based on validation
    if (this.inputField) {
      if (length === 0) {
        // Empty state
        this.inputField.style.borderColor = '';
        this.clearInputError();
      } else if (length > this.maxMessageLength) {
        // Too long
        this.inputField.style.borderColor = 'var(--error-color)';
      } else if (length < this.minMessageLength) {
        // Too short (but not empty)
        this.inputField.style.borderColor = 'var(--warning-color)';
      } else {
        // Valid length
        this.inputField.style.borderColor = 'var(--success-color)';
        this.clearInputError();
      }
    }
  }
  
  /**
   * Update character counter display
   */
  updateCharacterCounter() {
    if (!this.characterCounter) return;
    
    const length = this.getInputValue().length;
    this.characterCounter.textContent = `${length}/${this.maxMessageLength}`;
    
    // Update color based on length
    if (length > this.maxMessageLength * 0.9) {
      this.characterCounter.style.color = 'var(--error-color)';
    } else if (length > this.maxMessageLength * 0.7) {
      this.characterCounter.style.color = 'var(--warning-color)';
    } else {
      this.characterCounter.style.color = 'var(--text-light)';
    }
  }
  
  /**
   * Update send button state based on input validation
   */
  updateSendButtonState() {
    if (!this.sendButton) return;
    
    const message = this.getInputValue();
    const isValid = message.length >= this.minMessageLength && 
                   message.length <= this.maxMessageLength &&
                   !this.containsHarmfulContent(message);
    
    const canSend = isValid && !this.isProcessing && this.checkRateLimit();
    
    this.sendButton.disabled = !canSend;
    
    // Update button appearance
    if (this.isProcessing) {
      this.sendButton.innerHTML = `
        <div class="button-spinner" style="
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      `;
    } else {
      this.sendButton.innerHTML = `
        <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22,2 15,22 11,13 2,9"></polygon>
        </svg>
      `;
    }
  }
  
  /**
   * Show input validation error
   * @param {string} message - Error message
   */
  showInputError(message) {
    this.clearInputError();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      position: absolute;
      bottom: -40px;
      left: 0;
      color: var(--error-color);
      font-size: 0.875rem;
      animation: fadeIn 0.3s ease-out;
    `;
    
    const inputContainer = this.inputField?.parentElement;
    if (inputContainer) {
      inputContainer.appendChild(errorElement);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.remove();
        }
      }, 3000);
    }
  }
  
  /**
   * Clear input validation error
   */
  clearInputError() {
    const inputContainer = this.inputField?.parentElement;
    const existingError = inputContainer?.querySelector('.input-error');
    if (existingError) {
      existingError.remove();
    }
  }
  
  /**
   * Set processing state
   * @param {boolean} processing - Whether currently processing
   */
  setProcessing(processing) {
    this.isProcessing = processing;
    this.updateSendButtonState();
    
    // Disable/enable input field
    if (this.inputField) {
      this.inputField.disabled = processing;
    }
  }
  
  /**
   * Add system message to chat
   * @param {string} message - System message
   * @param {string} type - Message type ('info', 'warning', 'error')
   */
  addSystemMessage(message, type = 'info') {
    let messageType = 'text';
    if (type === 'error') {
      messageType = 'error';
    }
    
    return this.uiManager.addMessage(message, 'ai', messageType);
  }
  
  /**
   * Clear chat history
   */
  clearChat() {
    this.uiManager.clearMessages();
    this.uiManager.addWelcomeMessage();
  }
  
  /**
   * Dispatch message sent event
   * @param {string} message - Sent message
   * @param {HTMLElement} messageElement - Message DOM element
   */
  dispatchMessageSent(message, messageElement) {
    const event = new CustomEvent('messageSent', {
      detail: {
        message,
        messageElement,
        timestamp: new Date()
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Get chat history
   */
  getChatHistory() {
    return this.uiManager.getAllMessages();
  }
  
  /**
   * Focus on input field
   */
  focusInput() {
    this.uiManager.focusInput();
  }
}

// Add CSS for input animations
const inputStyles = document.createElement('style');
inputStyles.textContent = `
  .input-container.focused .message-input {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .message-input:disabled {
    background-color: var(--border-light);
    cursor: not-allowed;
  }
`;
document.head.appendChild(inputStyles);

// Export for use in other modules
export default ChatController;