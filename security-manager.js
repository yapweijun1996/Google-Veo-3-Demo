/**
 * Security Manager - Handles input validation and security measures
 */
class SecurityManager {
  constructor() {
    // Rate limiting configuration
    this.rateLimits = {
      messages: { count: 10, window: 60000 }, // 10 messages per minute
      apiCalls: { count: 5, window: 60000 },  // 5 API calls per minute
      downloads: { count: 3, window: 300000 } // 3 downloads per 5 minutes
    };
    
    // Request tracking
    this.requestHistory = new Map();
    
    // Content filtering
    this.contentFilters = {
      profanity: this.loadProfanityFilter(),
      harmful: this.loadHarmfulContentFilter(),
      spam: this.loadSpamFilter()
    };
    
    // Security policies
    this.securityPolicies = {
      maxPromptLength: 500,
      maxApiKeyLength: 100,
      allowedFileTypes: ['mp4', 'webm', 'mov'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      requireHttps: true,
      sanitizeInputs: true
    };
    
    this.init();
  }
  
  /**
   * Initialize security manager
   */
  init() {
    try {
      this.setupCSP();
      this.setupInputSanitization();
      this.setupRateLimiting();
      this.monitorSecurityEvents();
      console.log('Security Manager initialized successfully');
    } catch (error) {
      console.warn('Security Manager initialization had issues:', error);
      // Continue with basic functionality even if some features fail
    }
  }
  
  /**
   * Setup Content Security Policy
   */
  setupCSP() {
    try {
      // Add CSP meta tag if not present
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = this.generateCSPPolicy();
        document.head.appendChild(cspMeta);
      }
    } catch (error) {
      console.warn('Could not setup CSP:', error);
    }
  }
  
  /**
   * Generate CSP policy
   */
  generateCSPPolicy() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://esm.sh",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://esm.sh",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
  
  /**
   * Setup input sanitization
   */
  setupInputSanitization() {
    // Override common input methods to add sanitization
    this.interceptFormInputs();
    // Skip DOM interception for now to avoid conflicts
    // this.interceptDOMManipulation();
  }
  
  /**
   * Intercept form inputs for sanitization
   */
  interceptFormInputs() {
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        this.sanitizeInputField(event.target);
      }
    });
    
    document.addEventListener('paste', (event) => {
      setTimeout(() => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          this.sanitizeInputField(event.target);
        }
      }, 0);
    });
  }
  
  /**
   * Intercept DOM manipulation for XSS prevention
   */
  interceptDOMManipulation() {
    // Store reference to security manager for use in closure
    const securityManager = this;
    
    // Monitor for potentially dangerous DOM operations
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') || 
                             Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
    
    if (originalInnerHTML && originalInnerHTML.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          if (typeof value === 'string') {
            value = securityManager.sanitizeHTML(value);
          }
          return originalInnerHTML.set.call(this, value);
        },
        get: originalInnerHTML.get,
        configurable: true,
        enumerable: true
      });
    }
  }
  
  /**
   * Setup rate limiting
   */
  setupRateLimiting() {
    // Clean up old requests periodically
    setInterval(() => {
      this.cleanupOldRequests();
    }, 60000); // Every minute
  }
  
  /**
   * Monitor security events
   */
  monitorSecurityEvents() {
    // Monitor for suspicious activity
    document.addEventListener('securityViolation', (event) => {
      this.handleSecurityViolation(event.detail);
    });
    
    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });
  }
  
  /**
   * Validate user prompt
   * @param {string} prompt - User prompt to validate
   * @param {Object} options - Validation options
   */
  validatePrompt(prompt, options = {}) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedPrompt: prompt
    };
    
    // Basic validation
    if (!prompt || typeof prompt !== 'string') {
      validation.isValid = false;
      validation.errors.push('Prompt must be a non-empty string');
      return validation;
    }
    
    // Length validation
    if (prompt.length > this.securityPolicies.maxPromptLength) {
      validation.isValid = false;
      validation.errors.push(`Prompt must be less than ${this.securityPolicies.maxPromptLength} characters`);
    }
    
    if (prompt.trim().length < 3) {
      validation.isValid = false;
      validation.errors.push('Prompt must be at least 3 characters long');
    }
    
    // Content filtering
    const contentCheck = this.checkContent(prompt);
    if (!contentCheck.isClean) {
      validation.isValid = false;
      validation.errors.push(...contentCheck.violations);
    }
    
    // HTML/Script injection check
    if (this.containsHTMLOrScript(prompt)) {
      validation.isValid = false;
      validation.errors.push('Prompt contains potentially harmful content');
    }
    
    // Sanitize prompt
    validation.sanitizedPrompt = this.sanitizePrompt(prompt);
    
    // Check for suspicious patterns
    const suspiciousCheck = this.checkSuspiciousPatterns(prompt);
    if (suspiciousCheck.length > 0) {
      validation.warnings.push(...suspiciousCheck);
    }
    
    return validation;
  }
  
  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   */
  validateApiKey(apiKey) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    if (!apiKey || typeof apiKey !== 'string') {
      validation.isValid = false;
      validation.errors.push('API key is required');
      return validation;
    }
    
    // Length check
    if (apiKey.length > this.securityPolicies.maxApiKeyLength) {
      validation.isValid = false;
      validation.errors.push('API key is too long');
    }
    
    // Corrected format validation for Google AI API keys
    if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
      validation.isValid = false;
      validation.errors.push('Invalid API key format. It should start with "AIza" and be 39 characters long.');
    }
    
    // Check for suspicious patterns
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
      validation.isValid = false;
      validation.errors.push('API key contains invalid characters');
    }
    
    return validation;
  }
  
  /**
   * Check rate limiting
   * @param {string} type - Request type
   * @param {string} identifier - User/session identifier
   */
  checkRateLimit(type, identifier = 'default') {
    const limit = this.rateLimits[type];
    if (!limit) return { allowed: true };
    
    const key = `${type}_${identifier}`;
    const now = Date.now();
    
    if (!this.requestHistory.has(key)) {
      this.requestHistory.set(key, []);
    }
    
    const requests = this.requestHistory.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.window);
    this.requestHistory.set(key, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= limit.count) {
      return {
        allowed: false,
        retryAfter: Math.ceil((validRequests[0] + limit.window - now) / 1000),
        message: `Rate limit exceeded. Try again in ${Math.ceil((validRequests[0] + limit.window - now) / 1000)} seconds.`
      };
    }
    
    // Record this request
    validRequests.push(now);
    
    return { allowed: true };
  }
  
  /**
   * Sanitize HTML content
   * @param {string} html - HTML content to sanitize
   */
  sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This automatically escapes HTML
    
    // Additional sanitization for specific patterns
    let sanitized = temp.innerHTML;
    
    // Remove script tags and event handlers
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
  }
  
  /**
   * Sanitize user prompt
   * @param {string} prompt - Prompt to sanitize
   */
  sanitizePrompt(prompt) {
    if (typeof prompt !== 'string') return '';
    
    // Remove HTML tags
    let sanitized = prompt.replace(/<[^>]*>/g, '');
    
    // Remove script-like content
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    return sanitized;
  }
  
  /**
   * Sanitize input field
   * @param {HTMLElement} field - Input field to sanitize
   */
  sanitizeInputField(field) {
    if (!field || !field.value) return;
    
    const originalValue = field.value;
    const sanitizedValue = this.sanitizeHTML(originalValue);
    
    if (originalValue !== sanitizedValue) {
      field.value = sanitizedValue;
      
      // Dispatch security event
      this.dispatchSecurityEvent('input_sanitized', {
        field: field.id || field.name || 'unknown',
        originalLength: originalValue.length,
        sanitizedLength: sanitizedValue.length
      });
    }
  }
  
  /**
   * Check content for violations
   * @param {string} content - Content to check
   */
  checkContent(content) {
    const result = {
      isClean: true,
      violations: []
    };
    
    // Check profanity
    if (this.contentFilters.profanity.test(content)) {
      result.isClean = false;
      result.violations.push('Content contains inappropriate language');
    }
    
    // Check harmful content
    if (this.contentFilters.harmful.test(content)) {
      result.isClean = false;
      result.violations.push('Content may contain harmful instructions');
    }
    
    // Check spam patterns
    if (this.contentFilters.spam.test(content)) {
      result.isClean = false;
      result.violations.push('Content appears to be spam');
    }
    
    return result;
  }
  
  /**
   * Check for HTML or script content
   * @param {string} content - Content to check
   */
  containsHTMLOrScript(content) {
    const patterns = [
      /<[^>]+>/,                    // HTML tags
      /javascript:/i,               // JavaScript protocol
      /on\w+\s*=/i,                // Event handlers
      /<script/i,                   // Script tags
      /eval\s*\(/i,                // Eval function
      /document\./i,                // Document object
      /window\./i                   // Window object
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }
  
  /**
   * Check for suspicious patterns
   * @param {string} content - Content to check
   */
  checkSuspiciousPatterns(content) {
    const warnings = [];
    
    // Check for repeated characters (potential spam)
    if (/(.)\1{10,}/.test(content)) {
      warnings.push('Content contains excessive repeated characters');
    }
    
    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.7 && content.length > 20) {
      warnings.push('Content contains excessive capitalization');
    }
    
    // Check for URL-like patterns
    if (/https?:\/\/|www\./i.test(content)) {
      warnings.push('Content contains URLs');
    }
    
    // Check for email-like patterns
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
      warnings.push('Content contains email addresses');
    }
    
    return warnings;
  }
  
  /**
   * Load profanity filter
   */
  loadProfanityFilter() {
    // Basic profanity filter - in production, use a comprehensive list
    const profanityWords = [
      'badword1', 'badword2' // Placeholder - add actual words
    ];
    
    const pattern = profanityWords.join('|');
    return new RegExp(`\\b(${pattern})\\b`, 'gi');
  }
  
  /**
   * Load harmful content filter
   */
  loadHarmfulContentFilter() {
    const harmfulPatterns = [
      'how to hack',
      'create virus',
      'make bomb',
      'illegal activities',
      'harmful instructions'
    ];
    
    const pattern = harmfulPatterns.join('|');
    return new RegExp(`(${pattern})`, 'gi');
  }
  
  /**
   * Load spam filter
   */
  loadSpamFilter() {
    const spamPatterns = [
      'click here now',
      'free money',
      'urgent action required',
      'limited time offer'
    ];
    
    const pattern = spamPatterns.join('|');
    return new RegExp(`(${pattern})`, 'gi');
  }
  
  /**
   * Validate file upload
   * @param {File} file - File to validate
   */
  validateFile(file) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    if (!file) {
      validation.isValid = false;
      validation.errors.push('No file provided');
      return validation;
    }
    
    // Check file size
    if (file.size > this.securityPolicies.maxFileSize) {
      validation.isValid = false;
      validation.errors.push(`File size exceeds ${this.securityPolicies.maxFileSize / (1024 * 1024)}MB limit`);
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!this.securityPolicies.allowedFileTypes.includes(fileExtension)) {
      validation.isValid = false;
      validation.errors.push(`File type .${fileExtension} is not allowed`);
    }
    
    // Check MIME type
    if (!file.type.startsWith('video/')) {
      validation.isValid = false;
      validation.errors.push('File must be a video file');
    }
    
    return validation;
  }
  
  /**
   * Clean up old requests for rate limiting
   */
  cleanupOldRequests() {
    const now = Date.now();
    
    for (const [key, requests] of this.requestHistory.entries()) {
      const type = key.split('_')[0];
      const limit = this.rateLimits[type];
      
      if (limit) {
        const validRequests = requests.filter(time => now - time < limit.window);
        
        if (validRequests.length === 0) {
          this.requestHistory.delete(key);
        } else {
          this.requestHistory.set(key, validRequests);
        }
      }
    }
  }
  
  /**
   * Handle security violation
   * @param {Object} violation - Security violation details
   */
  handleSecurityViolation(violation) {
    console.warn('Security violation detected:', violation);
    
    // Log violation
    this.logSecurityEvent('violation', violation);
    
    // Take appropriate action based on severity
    if (violation.severity === 'high') {
      this.handleHighSeverityViolation(violation);
    }
  }
  
  /**
   * Handle CSP violation
   * @param {SecurityPolicyViolationEvent} event - CSP violation event
   */
  handleCSPViolation(event) {
    console.warn('CSP violation:', {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber
    });
    
    this.logSecurityEvent('csp_violation', {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI
    });
  }
  
  /**
   * Handle high severity violations
   * @param {Object} violation - Violation details
   */
  handleHighSeverityViolation(violation) {
    // Implement additional security measures
    // Could include temporary blocking, additional validation, etc.
    
    this.dispatchSecurityEvent('high_severity_violation', violation);
  }
  
  /**
   * Log security event
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  logSecurityEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, send to security monitoring service
    console.log('Security event:', event);
  }
  
  /**
   * Dispatch security event
   * @param {string} type - Event type
   * @param {Object} detail - Event detail
   */
  dispatchSecurityEvent(type, detail) {
    const event = new CustomEvent('securityEvent', {
      detail: { type, ...detail }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      rateLimitViolations: this.getRateLimitViolations(),
      contentViolations: this.getContentViolations(),
      activeRateLimits: this.requestHistory.size,
      securityPolicies: this.securityPolicies
    };
  }
  
  /**
   * Get rate limit violations
   */
  getRateLimitViolations() {
    // This would track violations in a real implementation
    return 0;
  }
  
  /**
   * Get content violations
   */
  getContentViolations() {
    // This would track violations in a real implementation
    return 0;
  }
}

// Export for use in other modules
export default SecurityManager;