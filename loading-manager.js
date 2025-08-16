/**
 * Loading Manager - Handles loading states and progress indicators
 */
class LoadingManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    
    // Loading state tracking
    this.activeLoadingStates = new Map();
    this.loadingCounter = 0;
    
    // Loading types
    this.loadingTypes = {
      GENERATION: 'generation',
      DOWNLOAD: 'download',
      UPLOAD: 'upload',
      API: 'api',
      UI: 'ui',
      SYSTEM: 'system'
    };
    
    // Progress tracking
    this.progressCallbacks = new Map();
    
    this.init();
  }
  
  /**
   * Initialize loading manager
   */
  init() {
    this.createLoadingElements();
    this.setupProgressAnimations();
  }
  
  /**
   * Create loading UI elements
   */
  createLoadingElements() {
    // Enhanced loading overlay
    this.createEnhancedLoadingOverlay();
    
    // Progress bars for different contexts
    this.createProgressBars();
    
    // Loading indicators for buttons
    this.createButtonLoadingStates();
  }
  
  /**
   * Create enhanced loading overlay
   */
  createEnhancedLoadingOverlay() {
    const existingOverlay = document.getElementById('loading-overlay');
    if (existingOverlay) {
      // Enhance existing overlay
      this.enhanceLoadingOverlay(existingOverlay);
    }
  }
  
  /**
   * Enhance existing loading overlay
   * @param {HTMLElement} overlay - Existing overlay element
   */
  enhanceLoadingOverlay(overlay) {
    const content = overlay.querySelector('.loading-content');
    if (!content) return;
    
    // Add progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'loading-progress-container';
    progressContainer.style.cssText = `
      width: 100%;
      margin-top: var(--spacing-lg);
      display: none;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: 4px;
      background-color: var(--border-color);
      border-radius: 2px;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'loading-progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
      border-radius: 2px;
      width: 0%;
      transition: width 0.3s ease-out;
    `;
    
    const progressText = document.createElement('div');
    progressText.className = 'loading-progress-text';
    progressText.style.cssText = `
      text-align: center;
      margin-top: var(--spacing-sm);
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: none;
    `;
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    content.appendChild(progressContainer);
    
    // Add cancel button for long operations
    const cancelContainer = document.createElement('div');
    cancelContainer.className = 'loading-cancel-container';
    cancelContainer.style.cssText = `
      margin-top: var(--spacing-lg);
      display: none;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'loading-cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background-color: var(--error-color);
      color: white;
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color var(--transition-fast);
    `;
    
    cancelButton.addEventListener('mouseover', () => {
      cancelButton.style.backgroundColor = '#dc2626';
    });
    
    cancelButton.addEventListener('mouseout', () => {
      cancelButton.style.backgroundColor = 'var(--error-color)';
    });
    
    cancelContainer.appendChild(cancelButton);
    content.appendChild(cancelContainer);
    
    // Store references
    this.loadingOverlay = overlay;
    this.loadingText = overlay.querySelector('#loading-text');
    this.loadingSpinner = overlay.querySelector('.spinner');
    this.progressContainer = progressContainer;
    this.progressFill = progressFill;
    this.progressText = progressText;
    this.cancelContainer = cancelContainer;
    this.cancelButton = cancelButton;
  }
  
  /**
   * Create progress bars for different contexts
   */
  createProgressBars() {
    // Inline progress bar component
    this.createInlineProgressBar();
    
    // Message progress indicators
    this.createMessageProgressIndicators();
  }
  
  /**
   * Create inline progress bar
   */
  createInlineProgressBar() {
    const style = document.createElement('style');
    style.textContent = `
      .inline-progress {
        width: 100%;
        height: 6px;
        background-color: var(--border-light);
        border-radius: 3px;
        overflow: hidden;
        margin: var(--spacing-sm) 0;
      }
      
      .inline-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
        border-radius: 3px;
        width: 0%;
        transition: width 0.3s ease-out;
        position: relative;
      }
      
      .inline-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: progressShimmer 2s infinite;
      }
      
      @keyframes progressShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .progress-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }
      
      .progress-percentage {
        font-weight: 500;
        color: var(--primary-color);
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Create message progress indicators
   */
  createMessageProgressIndicators() {
    const style = document.createElement('style');
    style.textContent = `
      .message-loading {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background-color: var(--border-light);
        border-radius: var(--radius-lg);
        margin: var(--spacing-sm) 0;
      }
      
      .message-loading-dots {
        display: flex;
        gap: 4px;
      }
      
      .message-loading-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--primary-color);
        animation: loadingDots 1.4s infinite ease-in-out;
      }
      
      .message-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .message-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      .message-loading-dot:nth-child(3) { animation-delay: 0s; }
      
      @keyframes loadingDots {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .message-loading-text {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Create button loading states
   */
  createButtonLoadingStates() {
    const style = document.createElement('style');
    style.textContent = `
      .button-loading {
        position: relative;
        pointer-events: none;
      }
      
      .button-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: buttonSpin 1s linear infinite;
      }
      
      .button-loading .button-text {
        opacity: 0;
      }
      
      @keyframes buttonSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .skeleton-loading {
        background: linear-gradient(90deg, var(--border-light) 25%, var(--border-color) 50%, var(--border-light) 75%);
        background-size: 200% 100%;
        animation: skeletonLoading 1.5s infinite;
      }
      
      @keyframes skeletonLoading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Setup progress animations
   */
  setupProgressAnimations() {
    // Pulse animation for loading elements
    const style = document.createElement('style');
    style.textContent = `
      .loading-pulse {
        animation: loadingPulse 2s infinite;
      }
      
      @keyframes loadingPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .loading-bounce {
        animation: loadingBounce 1s infinite;
      }
      
      @keyframes loadingBounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Show loading state
   * @param {string} type - Loading type
   * @param {string} message - Loading message
   * @param {Object} options - Loading options
   */
  showLoading(type, message, options = {}) {
    const loadingId = this.generateLoadingId();
    
    const loadingState = {
      id: loadingId,
      type,
      message,
      startTime: Date.now(),
      progress: 0,
      cancellable: options.cancellable || false,
      onCancel: options.onCancel || null,
      showProgress: options.showProgress || false,
      estimatedDuration: options.estimatedDuration || null,
      ...options
    };
    
    this.activeLoadingStates.set(loadingId, loadingState);
    
    // Show appropriate loading UI
    this.displayLoadingState(loadingState);
    
    return loadingId;
  }
  
  /**
   * Display loading state
   * @param {Object} loadingState - Loading state object
   */
  displayLoadingState(loadingState) {
    const { type, message, showProgress, cancellable } = loadingState;
    
    switch (type) {
      case this.loadingTypes.GENERATION:
        this.showGenerationLoading(loadingState);
        break;
        
      case this.loadingTypes.DOWNLOAD:
        this.showDownloadLoading(loadingState);
        break;
        
      case this.loadingTypes.API:
        this.showAPILoading(loadingState);
        break;
        
      default:
        this.showGenericLoading(loadingState);
    }
  }
  
  /**
   * Show generation loading
   * @param {Object} loadingState - Loading state
   */
  showGenerationLoading(loadingState) {
    // Show overlay with progress
    this.uiManager.showLoading(loadingState.message);
    
    if (loadingState.showProgress && this.progressContainer) {
      this.progressContainer.style.display = 'block';
    }
    
    if (loadingState.cancellable && this.cancelContainer) {
      this.cancelContainer.style.display = 'block';
      this.cancelButton.onclick = () => {
        if (loadingState.onCancel) {
          loadingState.onCancel();
        }
        this.hideLoading(loadingState.id);
      };
    }
  }
  
  /**
   * Show download loading
   * @param {Object} loadingState - Loading state
   */
  showDownloadLoading(loadingState) {
    // Show inline progress for downloads
    const progressElement = this.createInlineProgress(loadingState.message);
    
    // Add to UI (this would typically be in a download area)
    this.uiManager.showNotification(loadingState.message, 'info', 0); // Persistent notification
    
    loadingState.progressElement = progressElement;
  }
  
  /**
   * Show API loading
   * @param {Object} loadingState - Loading state
   */
  showAPILoading(loadingState) {
    // Show subtle loading indicator
    this.showButtonLoading(loadingState.targetButton);
  }
  
  /**
   * Show generic loading
   * @param {Object} loadingState - Loading state
   */
  showGenericLoading(loadingState) {
    this.uiManager.showLoading(loadingState.message);
  }
  
  /**
   * Update loading progress
   * @param {string} loadingId - Loading ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Optional progress message
   */
  updateProgress(loadingId, progress, message = null) {
    const loadingState = this.activeLoadingStates.get(loadingId);
    if (!loadingState) return false;
    
    loadingState.progress = Math.max(0, Math.min(100, progress));
    
    if (message) {
      loadingState.message = message;
    }
    
    // Update UI
    this.updateProgressUI(loadingState);
    
    // Dispatch progress event
    this.dispatchProgressEvent(loadingState);
    
    return true;
  }
  
  /**
   * Update progress UI
   * @param {Object} loadingState - Loading state
   */
  updateProgressUI(loadingState) {
    const { progress, message, type } = loadingState;
    
    // Update overlay progress
    if (this.progressFill) {
      this.progressFill.style.width = `${progress}%`;
    }
    
    if (this.progressText) {
      this.progressText.textContent = `${Math.round(progress)}%`;
      this.progressText.style.display = 'block';
    }
    
    // Update loading message
    if (this.loadingText && message) {
      this.loadingText.textContent = message;
    }
    
    // Update inline progress if exists
    if (loadingState.progressElement) {
      const fill = loadingState.progressElement.querySelector('.inline-progress-fill');
      const percentage = loadingState.progressElement.querySelector('.progress-percentage');
      
      if (fill) fill.style.width = `${progress}%`;
      if (percentage) percentage.textContent = `${Math.round(progress)}%`;
    }
    
    // Call progress callback if registered
    const callback = this.progressCallbacks.get(loadingState.id);
    if (callback) {
      callback(progress, message);
    }
  }
  
  /**
   * Hide loading state
   * @param {string} loadingId - Loading ID
   */
  hideLoading(loadingId) {
    const loadingState = this.activeLoadingStates.get(loadingId);
    if (!loadingState) return false;
    
    // Hide UI elements
    this.hideLoadingUI(loadingState);
    
    // Clean up
    this.activeLoadingStates.delete(loadingId);
    this.progressCallbacks.delete(loadingId);
    
    // If no more loading states, hide overlay
    if (this.activeLoadingStates.size === 0) {
      this.uiManager.hideLoading();
      
      if (this.progressContainer) {
        this.progressContainer.style.display = 'none';
      }
      
      if (this.cancelContainer) {
        this.cancelContainer.style.display = 'none';
      }
    }
    
    return true;
  }
  
  /**
   * Hide loading UI
   * @param {Object} loadingState - Loading state
   */
  hideLoadingUI(loadingState) {
    // Remove inline progress elements
    if (loadingState.progressElement) {
      loadingState.progressElement.remove();
    }
    
    // Remove button loading states
    if (loadingState.targetButton) {
      this.hideButtonLoading(loadingState.targetButton);
    }
  }
  
  /**
   * Create inline progress element
   * @param {string} label - Progress label
   */
  createInlineProgress(label) {
    const container = document.createElement('div');
    container.className = 'inline-progress-container';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'progress-label';
    labelElement.innerHTML = `
      <span>${label}</span>
      <span class="progress-percentage">0%</span>
    `;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'inline-progress';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'inline-progress-fill';
    
    progressBar.appendChild(progressFill);
    container.appendChild(labelElement);
    container.appendChild(progressBar);
    
    return container;
  }
  
  /**
   * Show button loading state
   * @param {HTMLElement} button - Button element
   */
  showButtonLoading(button) {
    if (!button) return;
    
    button.classList.add('button-loading');
    button.disabled = true;
    
    // Store original content
    if (!button.dataset.originalContent) {
      button.dataset.originalContent = button.innerHTML;
    }
    
    // Wrap text in span for animation
    const textSpan = document.createElement('span');
    textSpan.className = 'button-text';
    textSpan.innerHTML = button.dataset.originalContent;
    button.innerHTML = '';
    button.appendChild(textSpan);
  }
  
  /**
   * Hide button loading state
   * @param {HTMLElement} button - Button element
   */
  hideButtonLoading(button) {
    if (!button) return;
    
    button.classList.remove('button-loading');
    button.disabled = false;
    
    if (button.dataset.originalContent) {
      button.innerHTML = button.dataset.originalContent;
      delete button.dataset.originalContent;
    }
  }
  
  /**
   * Create message loading indicator
   * @param {string} message - Loading message
   */
  createMessageLoading(message) {
    const container = document.createElement('div');
    container.className = 'message-loading';
    
    const dots = document.createElement('div');
    dots.className = 'message-loading-dots';
    dots.innerHTML = `
      <div class="message-loading-dot"></div>
      <div class="message-loading-dot"></div>
      <div class="message-loading-dot"></div>
    `;
    
    const text = document.createElement('div');
    text.className = 'message-loading-text';
    text.textContent = message;
    
    container.appendChild(dots);
    container.appendChild(text);
    
    return container;
  }
  
  /**
   * Register progress callback
   * @param {string} loadingId - Loading ID
   * @param {Function} callback - Progress callback function
   */
  onProgress(loadingId, callback) {
    this.progressCallbacks.set(loadingId, callback);
  }
  
  /**
   * Get active loading states
   */
  getActiveLoadingStates() {
    return Array.from(this.activeLoadingStates.values());
  }
  
  /**
   * Check if any loading is active
   */
  isLoading() {
    return this.activeLoadingStates.size > 0;
  }
  
  /**
   * Generate loading ID
   */
  generateLoadingId() {
    return `loading_${Date.now()}_${++this.loadingCounter}`;
  }
  
  /**
   * Dispatch progress event
   * @param {Object} loadingState - Loading state
   */
  dispatchProgressEvent(loadingState) {
    const event = new CustomEvent('loadingProgress', {
      detail: {
        id: loadingState.id,
        type: loadingState.type,
        progress: loadingState.progress,
        message: loadingState.message,
        elapsed: Date.now() - loadingState.startTime
      }
    });
    document.dispatchEvent(event);
  }
}

// Export for use in other modules
export default LoadingManager;