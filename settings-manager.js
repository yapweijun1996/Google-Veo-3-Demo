/**
 * Settings Manager - Handles settings modal and API key management
 */
class SettingsManager {
  constructor() {
    this.modal = null;
    this.apiKeyInput = null;
    this.modelSelect = null;
    this.saveButton = null;
    this.cancelButton = null;
    this.closeButton = null;
    this.settingsButton = null;
    this.modalBackdrop = null;
    
    // Default settings
    this.defaultSettings = {
      apiKey: '',
      model: 'veo-3.0-generate-preview',
      maxRetries: 30,
      pollInterval: 10000
    };
    
    this.currentSettings = { ...this.defaultSettings };
    
    this.init();
  }
  
  /**
   * Initialize the settings manager
   */
  init() {
    this.bindElements();
    this.setupEventListeners();
    // Note: loadSettings is now async and should be called externally
  }
  
  /**
   * Bind DOM elements
   */
  bindElements() {
    this.modal = document.getElementById('settings-modal');
    this.apiKeyInput = document.getElementById('api-key-input');
    this.modelSelect = document.getElementById('model-select');
    this.saveButton = document.getElementById('save-button');
    this.cancelButton = document.getElementById('cancel-button');
    this.closeButton = document.getElementById('modal-close');
    this.settingsButton = document.querySelector('.settings-button');
    this.modalBackdrop = this.modal?.querySelector('.modal-backdrop');
    
    if (!this.modal || !this.apiKeyInput || !this.modelSelect) {
      console.error('Settings modal elements not found');
      return;
    }
  }
  
  /**
   * Set up event listeners for modal interactions
   */
  setupEventListeners() {
    // Open settings modal
    this.settingsButton?.addEventListener('click', () => {
      this.showModal();
    });
    
    // Close modal events
    this.closeButton?.addEventListener('click', () => {
      this.hideModal();
    });
    
    this.cancelButton?.addEventListener('click', () => {
      this.hideModal();
    });
    
    // Close modal when clicking backdrop
    this.modalBackdrop?.addEventListener('click', () => {
      this.hideModal();
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.hideModal();
      }
    });
    
    // Save settings
    this.saveButton?.addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Save on Enter key in API key input
    this.apiKeyInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveSettings();
      }
    });
    
    // Validate API key input
    this.apiKeyInput?.addEventListener('input', () => {
      this.validateApiKey();
    });
  }
  
  /**
   * Show the settings modal
   */
  showModal() {
    if (!this.modal) return;
    
    // Load current settings into form
    this.populateForm();
    
    // Show modal
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Focus on API key input
    setTimeout(() => {
      this.apiKeyInput?.focus();
    }, 100);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Hide the settings modal
   */
  hideModal() {
    if (!this.modal) return;
    
    // Remove focus from any focused elements inside modal before hiding
    const focusedElement = this.modal.querySelector(':focus');
    if (focusedElement) {
      focusedElement.blur();
    }
    
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clear validation states
    this.clearValidation();
  }
  
  /**
   * Check if modal is currently open
   */
  isModalOpen() {
    return this.modal?.classList.contains('open') || false;
  }
  
  /**
   * Populate form with current settings
   */
  populateForm() {
    if (this.apiKeyInput) {
      this.apiKeyInput.value = this.currentSettings.apiKey || '';
    }
    
    if (this.modelSelect) {
      this.modelSelect.value = this.currentSettings.model || this.defaultSettings.model;
    }
  }
  
  /**
   * Validate API key format
   */
  validateApiKey() {
    const apiKey = this.apiKeyInput?.value.trim() || '';
    const isValid = this.isValidApiKey(apiKey);
    
    // Update input styling based on validation
    if (this.apiKeyInput) {
      if (apiKey === '') {
        // Empty state - neutral
        this.apiKeyInput.style.borderColor = '';
        this.removeValidationMessage();
      } else if (isValid) {
        // Valid state
        this.apiKeyInput.style.borderColor = 'var(--success-color)';
        this.removeValidationMessage();
      } else {
        // Invalid state
        this.apiKeyInput.style.borderColor = 'var(--error-color)';
        this.showValidationMessage('Please enter a valid Google AI API key');
      }
    }
    
    // Enable/disable save button
    if (this.saveButton) {
      this.saveButton.disabled = apiKey !== '' && !isValid;
    }
    
    return isValid || apiKey === '';
  }
  
  /**
   * Check if API key format is valid
   */
  isValidApiKey(apiKey) {
    // Basic validation for Google AI API key format
    // Google AI API keys typically start with 'AIza' and are 39 characters long
    return /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey);
  }
  
  /**
   * Show validation message
   */
  showValidationMessage(message) {
    this.removeValidationMessage();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: var(--error-color);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
    `;
    
    this.apiKeyInput?.parentNode.appendChild(errorElement);
  }
  
  /**
   * Remove validation message
   */
  removeValidationMessage() {
    const existingError = this.apiKeyInput?.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
  }
  
  /**
   * Clear all validation states
   */
  clearValidation() {
    if (this.apiKeyInput) {
      this.apiKeyInput.style.borderColor = '';
    }
    this.removeValidationMessage();
  }
  
  /**
   * Save settings to localStorage and update current settings
   */
  saveSettings() {
    const apiKey = this.apiKeyInput?.value.trim() || '';
    const model = this.modelSelect?.value || this.defaultSettings.model;
    
    // Validate before saving
    if (apiKey && !this.isValidApiKey(apiKey)) {
      this.showValidationMessage('Please enter a valid Google AI API key');
      return false;
    }
    
    // Update current settings
    this.currentSettings = {
      ...this.currentSettings,
      apiKey,
      model
    };
    
    // Save to localStorage
    try {
      localStorage.setItem('veo3-settings', JSON.stringify(this.currentSettings));
      
      // Show success feedback
      this.showSaveSuccess();
      
      // Hide modal after short delay
      setTimeout(() => {
        this.hideModal();
      }, 1000);
      
      // Dispatch settings updated event
      this.dispatchSettingsUpdated();
      
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showSaveError('Failed to save settings. Please try again.');
      return false;
    }
  }
  
  /**
   * Load settings from localStorage
   */
  async loadSettings() {
    return new Promise((resolve) => {
      try {
        const saved = localStorage.getItem('veo3-settings');
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          this.currentSettings = {
            ...this.defaultSettings,
            ...parsedSettings
          };
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        this.currentSettings = { ...this.defaultSettings };
      }
      
      // Dispatch settings loaded event
      this.dispatchSettingsLoaded();
      resolve();
    });
  }
  
  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.currentSettings };
  }
  
  /**
   * Get API key
   */
  getApiKey() {
    return this.currentSettings.apiKey || '';
  }
  
  /**
   * Check if API key is configured
   */
  hasApiKey() {
    return Boolean(this.currentSettings.apiKey);
  }
  
  /**
   * Get selected model
   */
  getModel() {
    return this.currentSettings.model || this.defaultSettings.model;
  }
  
  /**
   * Show save success message
   */
  showSaveSuccess() {
    const button = this.saveButton;
    if (!button) return;
    
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 1000);
  }
  
  /**
   * Show save error message
   */
  showSaveError(message) {
    // Create temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: var(--error-color);
      font-size: 0.875rem;
      margin-top: var(--spacing-sm);
      text-align: center;
    `;
    
    const footer = this.modal?.querySelector('.modal-footer');
    if (footer) {
      footer.insertBefore(errorDiv, footer.firstChild);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }
  }
  
  /**
   * Dispatch settings updated event
   */
  dispatchSettingsUpdated() {
    const event = new CustomEvent('settingsUpdated', {
      detail: this.getSettings()
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Dispatch settings loaded event
   */
  dispatchSettingsLoaded() {
    const event = new CustomEvent('settingsLoaded', {
      detail: this.getSettings()
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Clear all settings
   */
  clearSettings() {
    try {
      localStorage.removeItem('veo3-settings');
      this.currentSettings = { ...this.defaultSettings };
      this.populateForm();
      this.dispatchSettingsUpdated();
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  }
}

// Export for use in other modules
export default SettingsManager;