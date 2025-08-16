/**
 * Accessibility Manager - Implements comprehensive accessibility features
 */
class AccessibilityManager {
  constructor() {
    // Accessibility preferences
    this.preferences = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true
    };
    
    // Focus management
    this.focusHistory = [];
    this.currentFocusIndex = -1;
    this.focusableElements = [];
    
    // Announcement queue for screen readers
    this.announcementQueue = [];
    this.isAnnouncing = false;
    
    // Keyboard shortcuts
    this.shortcuts = new Map();
    
    this.init();
  }
  
  /**
   * Initialize accessibility manager
   */
  init() {
    this.detectAccessibilityPreferences();
    this.setupARIALiveRegions();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.setupAccessibilityShortcuts();
    this.enhanceExistingElements();
    this.monitorAccessibilityChanges();
  }
  
  /**
   * Detect user accessibility preferences
   */
  detectAccessibilityPreferences() {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.preferences.reducedMotion = true;
      document.body.classList.add('reduced-motion');
    }
    
    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.preferences.highContrast = true;
      document.body.classList.add('high-contrast');
    }
    
    // Detect color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    }
    
    // Detect screen reader usage
    this.detectScreenReader();
    
    console.log('Accessibility preferences detected:', this.preferences);
  }
  
  /**
   * Detect screen reader usage
   */
  detectScreenReader() {
    // Check for common screen reader indicators
    const indicators = [
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0
    ];
    
    this.preferences.screenReader = indicators.some(indicator => indicator);
    
    if (this.preferences.screenReader) {
      document.body.classList.add('screen-reader-active');
    }
  }
  
  /**
   * Setup ARIA live regions for announcements
   */
  setupARIALiveRegions() {
    // Create polite live region for non-urgent announcements
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    this.politeRegion.id = 'polite-announcements';
    
    // Create assertive live region for urgent announcements
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.id = 'assertive-announcements';
    
    // Create status region for status updates
    this.statusRegion = document.createElement('div');
    this.statusRegion.setAttribute('role', 'status');
    this.statusRegion.setAttribute('aria-live', 'polite');
    this.statusRegion.className = 'sr-only';
    this.statusRegion.id = 'status-announcements';
    
    // Add to document
    document.body.appendChild(this.politeRegion);
    document.body.appendChild(this.assertiveRegion);
    document.body.appendChild(this.statusRegion);
    
    // Add screen reader only styles
    this.addScreenReaderStyles();
  }
  
  /**
   * Add screen reader only styles
   */
  addScreenReaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .sr-only-focusable:focus {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: inherit !important;
        margin: inherit !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: inherit !important;
      }
      
      /* High contrast mode styles */
      .high-contrast {
        --primary-color: #0000ff;
        --background-color: #ffffff;
        --text-primary: #000000;
        --border-color: #000000;
      }
      
      /* Reduced motion styles */
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      /* Focus indicators */
      .enhanced-focus:focus {
        outline: 3px solid #005fcc !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px #ffffff !important;
      }
      
      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Add skip links
    this.addSkipLinks();
    
    // Setup tab navigation
    this.setupTabNavigation();
    
    // Setup arrow key navigation for lists
    this.setupArrowKeyNavigation();
    
    // Setup escape key handling
    this.setupEscapeKeyHandling();
  }
  
  /**
   * Add skip links for keyboard navigation
   */
  addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#message-input" class="skip-link">Skip to message input</a>
      <a href="#settings-button" class="skip-link">Skip to settings</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
    
    // Add main content landmark
    const mainContent = document.querySelector('.chat-messages');
    if (mainContent) {
      mainContent.id = 'main-content';
      mainContent.setAttribute('role', 'main');
    }
  }
  
  /**
   * Setup tab navigation
   */
  setupTabNavigation() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
    });
    
    // Update focusable elements list
    this.updateFocusableElements();
    
    // Monitor DOM changes to update focusable elements
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
    });
  }
  
  /**
   * Update list of focusable elements
   */
  updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.focusableElements = Array.from(document.querySelectorAll(focusableSelectors))
      .filter(el => {
        return el.offsetWidth > 0 && 
               el.offsetHeight > 0 && 
               !el.hasAttribute('aria-hidden') &&
               window.getComputedStyle(el).visibility !== 'hidden';
      });
  }
  
  /**
   * Handle tab navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleTabNavigation(event) {
    const activeElement = document.activeElement;
    const currentIndex = this.focusableElements.indexOf(activeElement);
    
    // Handle modal focus trapping
    if (this.isModalOpen()) {
      this.trapFocusInModal(event);
      return;
    }
    
    // Store focus history
    if (currentIndex !== -1) {
      this.focusHistory.push(currentIndex);
      if (this.focusHistory.length > 10) {
        this.focusHistory.shift();
      }
    }
  }
  
  /**
   * Check if modal is open
   */
  isModalOpen() {
    return document.querySelector('.settings-modal.open') !== null;
  }
  
  /**
   * Trap focus within modal
   * @param {KeyboardEvent} event - Keyboard event
   */
  trapFocusInModal(event) {
    const modal = document.querySelector('.settings-modal.open');
    if (!modal) return;
    
    const focusableInModal = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableInModal[0];
    const lastFocusable = focusableInModal[focusableInModal.length - 1];
    
    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }
  
  /**
   * Setup arrow key navigation
   */
  setupArrowKeyNavigation() {
    document.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowKeyNavigation(event);
      }
    });
  }
  
  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleArrowKeyNavigation(event) {
    const activeElement = document.activeElement;
    
    // Handle message navigation
    if (activeElement.closest('.messages-container')) {
      this.navigateMessages(event);
    }
    
    // Handle button group navigation
    if (activeElement.closest('.video-controls')) {
      this.navigateButtonGroup(event);
    }
  }
  
  /**
   * Navigate through messages with arrow keys
   * @param {KeyboardEvent} event - Keyboard event
   */
  navigateMessages(event) {
    const messages = document.querySelectorAll('.message');
    const currentMessage = event.target.closest('.message');
    
    if (!currentMessage) return;
    
    const currentIndex = Array.from(messages).indexOf(currentMessage);
    let targetIndex = currentIndex;
    
    if (event.key === 'ArrowUp' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (event.key === 'ArrowDown' && currentIndex < messages.length - 1) {
      targetIndex = currentIndex + 1;
    }
    
    if (targetIndex !== currentIndex) {
      event.preventDefault();
      messages[targetIndex].focus();
      this.announceMessage(messages[targetIndex]);
    }
  }
  
  /**
   * Navigate through button groups
   * @param {KeyboardEvent} event - Keyboard event
   */
  navigateButtonGroup(event) {
    const buttonGroup = event.target.closest('.video-controls');
    const buttons = buttonGroup.querySelectorAll('button:not([disabled])');
    const currentIndex = Array.from(buttons).indexOf(event.target);
    
    let targetIndex = currentIndex;
    
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (event.key === 'ArrowRight' && currentIndex < buttons.length - 1) {
      targetIndex = currentIndex + 1;
    }
    
    if (targetIndex !== currentIndex) {
      event.preventDefault();
      buttons[targetIndex].focus();
    }
  }
  
  /**
   * Setup escape key handling
   */
  setupEscapeKeyHandling() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
    });
  }
  
  /**
   * Handle escape key
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleEscapeKey(event) {
    // Close modal if open
    const modal = document.querySelector('.settings-modal.open');
    if (modal) {
      const closeButton = modal.querySelector('.modal-close');
      if (closeButton) {
        closeButton.click();
      }
      return;
    }
    
    // Close fullscreen video if open
    const fullscreenModal = document.querySelector('.video-fullscreen-modal.open');
    if (fullscreenModal) {
      const closeButton = fullscreenModal.querySelector('.video-fullscreen-close');
      if (closeButton) {
        closeButton.click();
      }
      return;
    }
    
    // Clear focus if on input
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      document.activeElement.blur();
    }
  }
  
  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Enhance focus indicators
    this.enhanceFocusIndicators();
    
    // Setup focus restoration
    this.setupFocusRestoration();
    
    // Monitor focus changes
    this.monitorFocusChanges();
  }
  
  /**
   * Enhance focus indicators
   */
  enhanceFocusIndicators() {
    const focusableElements = document.querySelectorAll(
      'button, input, select, textarea, a, [tabindex]'
    );
    
    focusableElements.forEach(element => {
      element.classList.add('enhanced-focus');
    });
  }
  
  /**
   * Setup focus restoration
   */
  setupFocusRestoration() {
    // Store focus before modal opens
    document.addEventListener('modalOpen', (event) => {
      this.previousFocus = document.activeElement;
    });
    
    // Restore focus when modal closes
    document.addEventListener('modalClose', (event) => {
      if (this.previousFocus && this.previousFocus.focus) {
        setTimeout(() => {
          this.previousFocus.focus();
        }, 100);
      }
    });
  }
  
  /**
   * Monitor focus changes
   */
  monitorFocusChanges() {
    document.addEventListener('focusin', (event) => {
      this.announceFocusChange(event.target);
    });
  }
  
  /**
   * Setup screen reader support
   */
  setupScreenReaderSupport() {
    // Add role descriptions
    this.addRoleDescriptions();
    
    // Setup live region announcements
    this.setupLiveRegionAnnouncements();
    
    // Add context information
    this.addContextInformation();
  }
  
  /**
   * Add role descriptions to elements
   */
  addRoleDescriptions() {
    // Add role descriptions to custom elements
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.setAttribute('role', 'log');
      chatMessages.setAttribute('aria-label', 'Chat conversation');
    }
    
    const messageInput = document.querySelector('#message-input');
    if (messageInput) {
      messageInput.setAttribute('aria-describedby', 'input-help');
      
      // Add help text
      const helpText = document.createElement('div');
      helpText.id = 'input-help';
      helpText.className = 'sr-only';
      helpText.textContent = 'Enter your video description and press Enter to generate';
      messageInput.parentNode.appendChild(helpText);
    }
    
    // Add labels to buttons without text
    const settingsButton = document.querySelector('.settings-button');
    if (settingsButton && !settingsButton.getAttribute('aria-label')) {
      settingsButton.setAttribute('aria-label', 'Open settings');
    }
  }
  
  /**
   * Setup live region announcements
   */
  setupLiveRegionAnnouncements() {
    // Listen for UI updates that need announcements
    document.addEventListener('messageAdded', (event) => {
      this.announceMessage(event.detail.messageElement);
    });
    
    document.addEventListener('videoGenerationStart', () => {
      this.announce('Video generation started', 'polite');
    });
    
    document.addEventListener('videoGenerationComplete', (event) => {
      if (event.detail.success) {
        this.announce('Video generation completed successfully', 'polite');
      } else {
        this.announce('Video generation failed', 'assertive');
      }
    });
    
    document.addEventListener('downloadComplete', (event) => {
      if (event.detail.success) {
        this.announce('Video download completed', 'polite');
      } else {
        this.announce('Video download failed', 'assertive');
      }
    });
  }
  
  /**
   * Add context information
   */
  addContextInformation() {
    // Add landmark roles
    const header = document.querySelector('.chat-header');
    if (header) {
      header.setAttribute('role', 'banner');
    }
    
    const footer = document.querySelector('.chat-input');
    if (footer) {
      footer.setAttribute('role', 'contentinfo');
    }
    
    // Add navigation landmarks
    const settingsModal = document.querySelector('.settings-modal');
    if (settingsModal) {
      settingsModal.setAttribute('role', 'dialog');
      settingsModal.setAttribute('aria-modal', 'true');
    }
  }
  
  /**
   * Setup accessibility shortcuts
   */
  setupAccessibilityShortcuts() {
    // Register common shortcuts
    this.registerShortcut('Alt+1', () => {
      document.querySelector('#message-input')?.focus();
    }, 'Focus message input');
    
    this.registerShortcut('Alt+2', () => {
      document.querySelector('.settings-button')?.click();
    }, 'Open settings');
    
    this.registerShortcut('Alt+3', () => {
      this.scrollToLatestMessage();
    }, 'Go to latest message');
    
    this.registerShortcut('Alt+H', () => {
      this.showKeyboardShortcuts();
    }, 'Show keyboard shortcuts');
    
    // Listen for shortcut keys
    document.addEventListener('keydown', (event) => {
      this.handleShortcut(event);
    });
  }
  
  /**
   * Register keyboard shortcut
   * @param {string} combination - Key combination
   * @param {Function} handler - Shortcut handler
   * @param {string} description - Shortcut description
   */
  registerShortcut(combination, handler, description) {
    this.shortcuts.set(combination, { handler, description });
  }
  
  /**
   * Handle keyboard shortcut
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleShortcut(event) {
    const combination = this.getKeyCombination(event);
    const shortcut = this.shortcuts.get(combination);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.handler();
      this.announce(`Activated: ${shortcut.description}`, 'polite');
    }
  }
  
  /**
   * Get key combination string
   * @param {KeyboardEvent} event - Keyboard event
   */
  getKeyCombination(event) {
    const parts = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    
    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key);
    }
    
    return parts.join('+');
  }
  
  /**
   * Show keyboard shortcuts help
   */
  showKeyboardShortcuts() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .map(([combo, info]) => `${combo}: ${info.description}`)
      .join('\n');
    
    this.announce(`Keyboard shortcuts: ${shortcuts}`, 'polite');
  }
  
  /**
   * Enhance existing elements with accessibility features
   */
  enhanceExistingElements() {
    // Add ARIA labels to unlabeled elements
    this.addMissingLabels();
    
    // Enhance form elements
    this.enhanceFormElements();
    
    // Add loading states
    this.enhanceLoadingStates();
    
    // Make messages focusable for screen readers
    this.makeMessagesFocusable();
  }
  
  /**
   * Add missing ARIA labels
   */
  addMissingLabels() {
    // Find buttons without labels
    const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    unlabeledButtons.forEach(button => {
      const text = button.textContent.trim();
      if (!text) {
        // Try to infer label from context
        const icon = button.querySelector('svg');
        if (icon) {
          button.setAttribute('aria-label', 'Button');
        }
      }
    });
  }
  
  /**
   * Enhance form elements
   */
  enhanceFormElements() {
    // Add required field indicators
    const requiredFields = document.querySelectorAll('input[required], textarea[required]');
    requiredFields.forEach(field => {
      field.setAttribute('aria-required', 'true');
    });
    
    // Add error states
    const invalidFields = document.querySelectorAll('input:invalid, textarea:invalid');
    invalidFields.forEach(field => {
      field.setAttribute('aria-invalid', 'true');
    });
  }
  
  /**
   * Enhance loading states
   */
  enhanceLoadingStates() {
    // Add ARIA attributes to loading elements
    const loadingElements = document.querySelectorAll('.loading, .spinner');
    loadingElements.forEach(element => {
      element.setAttribute('role', 'status');
      element.setAttribute('aria-label', 'Loading');
    });
  }
  
  /**
   * Make messages focusable for screen readers
   */
  makeMessagesFocusable() {
    const messages = document.querySelectorAll('.message');
    messages.forEach((message, index) => {
      message.setAttribute('tabindex', '0');
      message.setAttribute('role', 'article');
      message.setAttribute('aria-label', `Message ${index + 1}`);
    });
  }
  
  /**
   * Monitor accessibility changes
   */
  monitorAccessibilityChanges() {
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.preferences.reducedMotion = e.matches;
      document.body.classList.toggle('reduced-motion', e.matches);
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.preferences.highContrast = e.matches;
      document.body.classList.toggle('high-contrast', e.matches);
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.body.classList.toggle('dark-mode', e.matches);
    });
  }
  
  /**
   * Announce message to screen readers
   * @param {string|HTMLElement} message - Message to announce
   * @param {string} priority - Announcement priority ('polite' or 'assertive')
   */
  announce(message, priority = 'polite') {
    const text = typeof message === 'string' ? message : message.textContent;
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    // Clear previous announcement
    region.textContent = '';
    
    // Add to queue
    this.announcementQueue.push({ text, priority, region });
    
    // Process queue
    this.processAnnouncementQueue();
  }
  
  /**
   * Process announcement queue
   */
  processAnnouncementQueue() {
    if (this.isAnnouncing || this.announcementQueue.length === 0) {
      return;
    }
    
    this.isAnnouncing = true;
    const announcement = this.announcementQueue.shift();
    
    // Set announcement text
    setTimeout(() => {
      announcement.region.textContent = announcement.text;
      
      // Clear after announcement
      setTimeout(() => {
        announcement.region.textContent = '';
        this.isAnnouncing = false;
        
        // Process next announcement
        this.processAnnouncementQueue();
      }, 1000);
    }, 100);
  }
  
  /**
   * Announce message content
   * @param {HTMLElement} messageElement - Message element
   */
  announceMessage(messageElement) {
    const sender = messageElement.classList.contains('user') ? 'You' : 'AI';
    const content = messageElement.querySelector('.message-bubble').textContent;
    const announcement = `${sender} said: ${content}`;
    
    this.announce(announcement, 'polite');
  }
  
  /**
   * Announce focus change
   * @param {HTMLElement} element - Focused element
   */
  announceFocusChange(element) {
    if (!this.preferences.screenReader) return;
    
    let announcement = '';
    
    if (element.tagName === 'BUTTON') {
      announcement = `Button: ${element.textContent || element.getAttribute('aria-label') || 'Unlabeled button'}`;
    } else if (element.tagName === 'INPUT') {
      const label = element.getAttribute('aria-label') || 
                   document.querySelector(`label[for="${element.id}"]`)?.textContent ||
                   'Input field';
      announcement = `${label}, ${element.type} input`;
    }
    
    if (announcement) {
      this.announce(announcement, 'polite');
    }
  }
  
  /**
   * Scroll to latest message
   */
  scrollToLatestMessage() {
    const messagesContainer = document.querySelector('.messages-container');
    const lastMessage = messagesContainer?.querySelector('.message:last-child');
    
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth' });
      lastMessage.focus();
      this.announce('Scrolled to latest message', 'polite');
    }
  }
  
  /**
   * Get accessibility status
   */
  getAccessibilityStatus() {
    return {
      preferences: this.preferences,
      focusableElementsCount: this.focusableElements.length,
      shortcutsRegistered: this.shortcuts.size,
      announcementQueueLength: this.announcementQueue.length
    };
  }
}

// Export for use in other modules
export default AccessibilityManager;