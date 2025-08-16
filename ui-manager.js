/**
 * UI Manager - Handles all UI interactions and DOM manipulation
 */
class UIManager {
  constructor() {
    this.messageContainer = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendButton = null;
    this.loadingOverlay = null;
    this.loadingText = null;
    
    // Message counter for unique IDs
    this.messageCounter = 0;
    
    // Auto-scroll behavior
    this.autoScroll = true;
    
    this.init();
  }
  
  /**
   * Initialize the UI manager
   */
  init() {
    this.bindElements();
    this.setupScrollBehavior();
  }
  
  /**
   * Bind DOM elements
   */
  bindElements() {
    this.messageContainer = document.querySelector('.chat-messages');
    this.messagesContainer = document.getElementById('messages-container');
    this.inputField = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.loadingText = document.getElementById('loading-text');
    
    if (!this.messagesContainer || !this.inputField || !this.sendButton) {
      console.error('Required UI elements not found');
    }
  }
  
  /**
   * Set up scroll behavior for messages container
   */
  setupScrollBehavior() {
    if (!this.messagesContainer) return;
    
    // Detect when user scrolls up to disable auto-scroll
    this.messagesContainer.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      this.autoScroll = isAtBottom;
    });
  }
  
  /**
   * Add a message to the chat interface
   * @param {string} text - Message content
   * @param {string} sender - 'user' or 'ai'
   * @param {string} type - 'text', 'video', 'error', 'loading'
   * @param {Object} options - Additional options (videoUrl, videoFile, etc.)
   */
  addMessage(text, sender = 'ai', type = 'text', options = {}) {
    if (!this.messagesContainer) return null;
    
    const messageId = `message-${++this.messageCounter}`;
    const timestamp = new Date();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.id = messageId;
    messageElement.setAttribute('data-type', type);
    messageElement.setAttribute('data-timestamp', timestamp.toISOString());
    
    // Create message bubble
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble';
    
    // Add message content based on type
    switch (type) {
      case 'text':
        bubbleElement.innerHTML = this.sanitizeHTML(text);
        break;
      case 'video':
        bubbleElement.appendChild(this.createVideoContent(text, options));
        break;
      case 'error':
        bubbleElement.innerHTML = `<span class="error-message">${this.sanitizeHTML(text)}</span>`;
        bubbleElement.style.backgroundColor = 'var(--error-color)';
        bubbleElement.style.color = 'white';
        break;
      case 'loading':
        bubbleElement.appendChild(this.createLoadingContent(text));
        break;
      default:
        bubbleElement.innerHTML = this.sanitizeHTML(text);
    }
    
    // Add timestamp
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = this.formatTime(timestamp);
    
    // Assemble message
    messageElement.appendChild(bubbleElement);
    messageElement.appendChild(timeElement);
    
    // Add to container
    this.messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom if auto-scroll is enabled
    if (this.autoScroll) {
      this.scrollToBottom();
    }
    
    return messageElement;
  }
  
  /**
   * Create video content for video messages
   * @param {string} text - Message text
   * @param {Object} options - Video options (videoUrl, videoFile, etc.)
   */
  createVideoContent(text, options = {}) {
    const container = document.createElement('div');
    container.className = 'video-message';
    
    // Add text if provided
    if (text) {
      const textElement = document.createElement('p');
      textElement.innerHTML = this.sanitizeHTML(text);
      textElement.style.marginBottom = 'var(--spacing-md)';
      container.appendChild(textElement);
    }
    
    // Add video player if video URL is provided
    if (options.videoUrl) {
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-container';
      
      const video = document.createElement('video');
      video.className = 'video-player';
      video.src = options.videoUrl;
      video.controls = true;
      video.preload = 'metadata';
      video.setAttribute('aria-label', 'Generated video');
      
      videoContainer.appendChild(video);
      container.appendChild(videoContainer);
      
      // Add video controls
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'video-controls';
      
      // Download button
      const downloadButton = document.createElement('button');
      downloadButton.className = 'download-button';
      downloadButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download Video
      `;
      downloadButton.addEventListener('click', () => {
        this.downloadVideo(options.videoUrl, options.filename || 'generated-video.mp4');
      });
      
      controlsContainer.appendChild(downloadButton);
      container.appendChild(controlsContainer);
    }
    
    return container;
  }
  
  /**
   * Create loading content for loading messages
   * @param {string} text - Loading message text
   */
  createLoadingContent(text) {
    const container = document.createElement('div');
    container.className = 'loading-message';
    
    const spinner = document.createElement('div');
    spinner.className = 'message-spinner';
    spinner.style.cssText = `
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-top: 2px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: var(--spacing-sm);
      vertical-align: middle;
    `;
    
    const textElement = document.createElement('span');
    textElement.textContent = text;
    textElement.style.verticalAlign = 'middle';
    
    container.appendChild(spinner);
    container.appendChild(textElement);
    
    return container;
  }
  
  /**
   * Update an existing message
   * @param {string} messageId - ID of message to update
   * @param {string} text - New message content
   * @param {string} type - New message type
   * @param {Object} options - Additional options
   */
  updateMessage(messageId, text, type = 'text', options = {}) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return null;
    
    const bubbleElement = messageElement.querySelector('.message-bubble');
    if (!bubbleElement) return null;
    
    // Clear existing content
    bubbleElement.innerHTML = '';
    
    // Add new content based on type
    switch (type) {
      case 'text':
        bubbleElement.innerHTML = this.sanitizeHTML(text);
        break;
      case 'video':
        bubbleElement.appendChild(this.createVideoContent(text, options));
        break;
      case 'error':
        bubbleElement.innerHTML = `<span class="error-message">${this.sanitizeHTML(text)}</span>`;
        bubbleElement.style.backgroundColor = 'var(--error-color)';
        bubbleElement.style.color = 'white';
        break;
      default:
        bubbleElement.innerHTML = this.sanitizeHTML(text);
    }
    
    // Update message type attribute
    messageElement.setAttribute('data-type', type);
    
    return messageElement;
  }
  
  /**
   * Remove a message from the chat
   * @param {string} messageId - ID of message to remove
   */
  removeMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      messageElement.remove();
      return true;
    }
    return false;
  }
  
  /**
   * Show loading overlay with message
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    if (!this.loadingOverlay || !this.loadingText) return;
    
    this.loadingText.textContent = message;
    this.loadingOverlay.classList.add('show');
    this.loadingOverlay.setAttribute('aria-hidden', 'false');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    if (!this.loadingOverlay) return;
    
    this.loadingOverlay.classList.remove('show');
    this.loadingOverlay.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
  
  /**
   * Update loading message
   * @param {string} message - New loading message
   */
  updateLoadingMessage(message) {
    if (this.loadingText) {
      this.loadingText.textContent = message;
    }
  }
  
  /**
   * Scroll to bottom of messages container
   */
  scrollToBottom() {
    if (!this.messagesContainer) return;
    
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }
  
  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
      this.messageCounter = 0;
    }
  }
  
  /**
   * Get input field value
   */
  getInputValue() {
    return this.inputField?.value.trim() || '';
  }
  
  /**
   * Set input field value
   * @param {string} value - Value to set
   */
  setInputValue(value = '') {
    if (this.inputField) {
      this.inputField.value = value;
    }
  }
  
  /**
   * Clear input field
   */
  clearInput() {
    this.setInputValue('');
  }
  
  /**
   * Focus on input field
   */
  focusInput() {
    if (this.inputField) {
      this.inputField.focus();
    }
  }
  
  /**
   * Enable/disable send button
   * @param {boolean} enabled - Whether button should be enabled
   */
  setSendButtonEnabled(enabled = true) {
    if (this.sendButton) {
      this.sendButton.disabled = !enabled;
    }
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      color: white;
      font-weight: 500;
      z-index: 3000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
      success: 'var(--success-color)',
      error: 'var(--error-color)',
      warning: 'var(--warning-color)',
      info: 'var(--primary-color)'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
  
  /**
   * Download video file
   * @param {string} url - Video URL
   * @param {string} filename - Filename for download
   */
  downloadVideo(url, filename = 'video.mp4') {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification('Video download started', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      this.showNotification('Failed to download video', 'error');
    }
  }
  
  /**
   * Sanitize HTML to prevent XSS attacks
   * @param {string} html - HTML string to sanitize
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Format timestamp for display
   * @param {Date} date - Date to format
   */
  formatTime(date) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  /**
   * Get all messages
   */
  getAllMessages() {
    if (!this.messagesContainer) return [];
    
    const messageElements = this.messagesContainer.querySelectorAll('.message');
    return Array.from(messageElements).map(element => ({
      id: element.id,
      text: element.querySelector('.message-bubble')?.textContent || '',
      sender: element.classList.contains('user') ? 'user' : 'ai',
      type: element.getAttribute('data-type') || 'text',
      timestamp: element.getAttribute('data-timestamp')
    }));
  }
  
  /**
   * Add welcome message
   */
  addWelcomeMessage() {
    this.addMessage(
      'Welcome to Veo 3 Video Generator! Describe the video you want to create and I\'ll generate it for you.',
      'ai',
      'text'
    );
  }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);

// Export for use in other modules
export default UIManager;