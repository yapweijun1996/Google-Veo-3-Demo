/**
 * Error Handler - Comprehensive error handling for the application
 */
class ErrorHandler {
  constructor(uiManager) {
    this.uiManager = uiManager;
    
    // Error tracking
    this.errorHistory = [];
    this.maxErrorHistory = 100;
    
    // Error categories
    this.errorCategories = {
      API: 'api',
      NETWORK: 'network',
      VALIDATION: 'validation',
      AUTHENTICATION: 'authentication',
      GENERATION: 'generation',
      DOWNLOAD: 'download',
      UI: 'ui',
      SYSTEM: 'system'
    };
    
    // Error severity levels
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    this.setupGlobalErrorHandling();
  }
  
  /**
   * Set up global error handling
   */
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, {
        category: this.errorCategories.SYSTEM,
        severity: this.severityLevels.HIGH,
        context: 'unhandled_promise_rejection'
      });
      event.preventDefault();
    });
    
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleError(event.error, {
        category: this.errorCategories.SYSTEM,
        severity: this.severityLevels.MEDIUM,
        context: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Handle network errors
    window.addEventListener('offline', () => {
      this.handleNetworkError('offline');
    });
    
    window.addEventListener('online', () => {
      this.handleNetworkRecovery();
    });
  }
  
  /**
   * Main error handling method
   * @param {Error|string} error - Error object or message
   * @param {Object} options - Error handling options
   */
  handleError(error, options = {}) {
    const errorInfo = this.processError(error, options);
    
    // Log error
    this.logError(errorInfo);
    
    // Track error
    this.trackError(errorInfo);
    
    // Display user-friendly message
    this.displayErrorMessage(errorInfo);
    
    // Take recovery actions if needed
    this.attemptRecovery(errorInfo);
    
    return errorInfo;
  }
  
  /**
   * Process error into standardized format
   * @param {Error|string} error - Error object or message
   * @param {Object} options - Processing options
   */
  processError(error, options = {}) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: this.extractErrorMessage(error),
      originalError: error,
      category: options.category || this.categorizeError(error),
      severity: options.severity || this.determineSeverity(error),
      context: options.context || 'unknown',
      userMessage: null,
      recoverable: true,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...options
      }
    };
    
    // Generate user-friendly message
    errorInfo.userMessage = this.generateUserMessage(errorInfo);
    
    // Determine if error is recoverable
    errorInfo.recoverable = this.isRecoverable(errorInfo);
    
    return errorInfo;
  }
  
  /**
   * Extract error message from various error types
   * @param {Error|string} error - Error to extract message from
   */
  extractErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message || error.toString();
    }
    
    if (error && typeof error === 'object') {
      return error.message || error.error || JSON.stringify(error);
    }
    
    return 'Unknown error occurred';
  }
  
  /**
   * Categorize error based on its properties
   * @param {Error|string} error - Error to categorize
   */
  categorizeError(error) {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    // API errors
    if (message.includes('api') || message.includes('quota') || message.includes('rate limit')) {
      return this.errorCategories.API;
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.errorCategories.NETWORK;
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('key') || message.includes('permission')) {
      return this.errorCategories.AUTHENTICATION;
    }
    
    // Validation errors
    if (message.includes('invalid') || message.includes('validation') || message.includes('format')) {
      return this.errorCategories.VALIDATION;
    }
    
    // Generation errors
    if (message.includes('generation') || message.includes('video') || message.includes('timeout')) {
      return this.errorCategories.GENERATION;
    }
    
    // Download errors
    if (message.includes('download') || message.includes('file')) {
      return this.errorCategories.DOWNLOAD;
    }
    
    return this.errorCategories.SYSTEM;
  }
  
  /**
   * Determine error severity
   * @param {Error|string} error - Error to assess
   */
  determineSeverity(error) {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    // Critical errors
    if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
      return this.severityLevels.CRITICAL;
    }
    
    // High severity errors
    if (message.includes('failed') || message.includes('timeout') || message.includes('quota exceeded')) {
      return this.severityLevels.HIGH;
    }
    
    // Medium severity errors
    if (message.includes('invalid') || message.includes('not found') || message.includes('permission')) {
      return this.severityLevels.MEDIUM;
    }
    
    return this.severityLevels.LOW;
  }
  
  /**
   * Generate user-friendly error message
   * @param {Object} errorInfo - Processed error information
   */
  generateUserMessage(errorInfo) {
    const { category, message, severity } = errorInfo;
    
    switch (category) {
      case this.errorCategories.API:
        return this.generateAPIErrorMessage(message);
        
      case this.errorCategories.NETWORK:
        return this.generateNetworkErrorMessage(message);
        
      case this.errorCategories.AUTHENTICATION:
        return this.generateAuthErrorMessage(message);
        
      case this.errorCategories.VALIDATION:
        return this.generateValidationErrorMessage(message);
        
      case this.errorCategories.GENERATION:
        return this.generateGenerationErrorMessage(message);
        
      case this.errorCategories.DOWNLOAD:
        return this.generateDownloadErrorMessage(message);
        
      case this.errorCategories.UI:
        return 'Interface error occurred. Please refresh the page.';
        
      default:
        if (severity === this.severityLevels.CRITICAL) {
          return 'A critical error occurred. Please refresh the page and try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  /**
   * Generate API-specific error messages
   * @param {string} message - Original error message
   */
  generateAPIErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('unauthenticated') || lowerMessage.includes('401')) {
      return 'Invalid API key. Please check your API key in settings.';
    }
    
    if (lowerMessage.includes('quota') || lowerMessage.includes('429')) {
      return 'API quota exceeded. Please try again later or check your billing.';
    }
    
    if (lowerMessage.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('403')) {
      return 'Access denied. Please check your API key permissions.';
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'Service not available. Please try again later.';
    }
    
    if (lowerMessage.includes('internal') || lowerMessage.includes('500')) {
      return 'Server error. Please try again in a few minutes.';
    }
    
    return 'API error occurred. Please check your connection and try again.';
  }
  
  /**
   * Generate network-specific error messages
   * @param {string} message - Original error message
   */
  generateNetworkErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('offline')) {
      return 'You are offline. Please check your internet connection.';
    }
    
    if (lowerMessage.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (lowerMessage.includes('dns') || lowerMessage.includes('resolve')) {
      return 'Cannot connect to server. Please check your internet connection.';
    }
    
    return 'Network error. Please check your internet connection and try again.';
  }
  
  /**
   * Generate authentication-specific error messages
   * @param {string} message - Original error message
   */
  generateAuthErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('key')) {
      return 'API key is missing or invalid. Please configure your API key in settings.';
    }
    
    if (lowerMessage.includes('expired')) {
      return 'API key has expired. Please update your API key in settings.';
    }
    
    return 'Authentication failed. Please check your API key in settings.';
  }
  
  /**
   * Generate validation-specific error messages
   * @param {string} message - Original error message
   */
  generateValidationErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('prompt')) {
      return 'Invalid prompt. Please provide a clear video description.';
    }
    
    if (lowerMessage.includes('length') || lowerMessage.includes('long')) {
      return 'Prompt is too long. Please keep it under 500 characters.';
    }
    
    if (lowerMessage.includes('empty')) {
      return 'Please provide a video description.';
    }
    
    return 'Invalid input. Please check your input and try again.';
  }
  
  /**
   * Generate generation-specific error messages
   * @param {string} message - Original error message
   */
  generateGenerationErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('timeout')) {
      return 'Video generation timed out. Please try with a simpler prompt.';
    }
    
    if (lowerMessage.includes('failed')) {
      return 'Video generation failed. Please try again with a different prompt.';
    }
    
    if (lowerMessage.includes('content')) {
      return 'Content not suitable for video generation. Please try a different prompt.';
    }
    
    return 'Video generation error. Please try again.';
  }
  
  /**
   * Generate download-specific error messages
   * @param {string} message - Original error message
   */
  generateDownloadErrorMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('not found')) {
      return 'Video file not found. Please try generating the video again.';
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('large')) {
      return 'Video file is too large to download. Please try again.';
    }
    
    if (lowerMessage.includes('permission')) {
      return 'Download permission denied. Please check your browser settings.';
    }
    
    return 'Download failed. Please try again.';
  }
  
  /**
   * Check if error is recoverable
   * @param {Object} errorInfo - Error information
   */
  isRecoverable(errorInfo) {
    const { category, message, severity } = errorInfo;
    
    // Critical errors are generally not recoverable
    if (severity === this.severityLevels.CRITICAL) {
      return false;
    }
    
    // Some specific errors are not recoverable
    const nonRecoverablePatterns = [
      'invalid api key',
      'quota exceeded',
      'permission denied',
      'service unavailable'
    ];
    
    const lowerMessage = message.toLowerCase();
    return !nonRecoverablePatterns.some(pattern => lowerMessage.includes(pattern));
  }
  
  /**
   * Display error message to user
   * @param {Object} errorInfo - Error information
   */
  displayErrorMessage(errorInfo) {
    const { userMessage, severity, category, recoverable } = errorInfo;
    
    // Determine notification type
    let notificationType = 'error';
    if (severity === this.severityLevels.LOW) {
      notificationType = 'warning';
    } else if (severity === this.severityLevels.CRITICAL) {
      notificationType = 'error';
    }
    
    // Show notification
    this.uiManager.showNotification(userMessage, notificationType, 5000);
    
    // Add error message to chat for important errors
    if (severity === this.severityLevels.HIGH || severity === this.severityLevels.CRITICAL) {
      this.uiManager.addMessage(userMessage, 'ai', 'error');
    }
    
    // Show recovery suggestions if applicable
    if (recoverable) {
      this.showRecoverySuggestions(errorInfo);
    }
  }
  
  /**
   * Show recovery suggestions
   * @param {Object} errorInfo - Error information
   */
  showRecoverySuggestions(errorInfo) {
    const { category } = errorInfo;
    let suggestions = [];
    
    switch (category) {
      case this.errorCategories.API:
        suggestions = [
          'Check your API key in settings',
          'Verify your internet connection',
          'Try again in a few minutes'
        ];
        break;
        
      case this.errorCategories.NETWORK:
        suggestions = [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ];
        break;
        
      case this.errorCategories.AUTHENTICATION:
        suggestions = [
          'Update your API key in settings',
          'Verify your API key is correct',
          'Check your account status'
        ];
        break;
        
      case this.errorCategories.GENERATION:
        suggestions = [
          'Try a simpler prompt',
          'Make your description more specific',
          'Wait a moment and try again'
        ];
        break;
        
      default:
        suggestions = [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the problem persists'
        ];
    }
    
    if (suggestions.length > 0) {
      const suggestionText = `Suggestions: ${suggestions.join(', ')}`;
      setTimeout(() => {
        this.uiManager.showNotification(suggestionText, 'info', 7000);
      }, 1000);
    }
  }
  
  /**
   * Attempt automatic recovery
   * @param {Object} errorInfo - Error information
   */
  attemptRecovery(errorInfo) {
    const { category, recoverable } = errorInfo;
    
    if (!recoverable) {
      return false;
    }
    
    switch (category) {
      case this.errorCategories.NETWORK:
        return this.attemptNetworkRecovery();
        
      case this.errorCategories.API:
        return this.attemptAPIRecovery();
        
      default:
        return false;
    }
  }
  
  /**
   * Attempt network recovery
   */
  attemptNetworkRecovery() {
    // Check if we're back online
    if (navigator.onLine) {
      this.uiManager.showNotification('Connection restored', 'success');
      return true;
    }
    return false;
  }
  
  /**
   * Attempt API recovery
   */
  attemptAPIRecovery() {
    // Could implement retry logic here
    return false;
  }
  
  /**
   * Handle network-specific errors
   * @param {string} type - Network error type
   */
  handleNetworkError(type) {
    const errorInfo = {
      category: this.errorCategories.NETWORK,
      severity: this.severityLevels.HIGH,
      message: `Network ${type}`,
      userMessage: type === 'offline' ? 
        'You are offline. Please check your internet connection.' :
        'Network error occurred. Please check your connection.'
    };
    
    this.displayErrorMessage(errorInfo);
    this.trackError(errorInfo);
  }
  
  /**
   * Handle network recovery
   */
  handleNetworkRecovery() {
    this.uiManager.showNotification('Connection restored', 'success');
  }
  
  /**
   * Log error for debugging
   * @param {Object} errorInfo - Error information
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorInfo);
        break;
      case 'warn':
        console.warn(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }
  
  /**
   * Get appropriate log level for severity
   * @param {string} severity - Error severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case this.severityLevels.CRITICAL:
      case this.severityLevels.HIGH:
        return 'error';
      case this.severityLevels.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }
  
  /**
   * Track error for analytics
   * @param {Object} errorInfo - Error information
   */
  trackError(errorInfo) {
    // Add to error history
    this.errorHistory.unshift(errorInfo);
    
    // Limit history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }
    
    // Dispatch error event for external tracking
    this.dispatchErrorEvent(errorInfo);
  }
  
  /**
   * Dispatch error event
   * @param {Object} errorInfo - Error information
   */
  dispatchErrorEvent(errorInfo) {
    const event = new CustomEvent('applicationError', {
      detail: errorInfo
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byCategory: {},
      bySeverity: {},
      recent: this.errorHistory.slice(0, 10)
    };
    
    this.errorHistory.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }
}

// Export for use in other modules
export default ErrorHandler;