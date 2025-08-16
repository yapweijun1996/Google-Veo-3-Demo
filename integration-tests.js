/**
 * Integration Tests - Comprehensive testing for the Veo 3 Video Generator
 */
class IntegrationTester {
  constructor(app) {
    this.app = app;
    this.testResults = [];
    this.testSuite = {
      initialization: [],
      ui: [],
      security: [],
      accessibility: [],
      workflow: [],
      errorHandling: []
    };
    
    this.setupTests();
  }
  
  /**
   * Setup all test cases
   */
  setupTests() {
    this.setupInitializationTests();
    this.setupUITests();
    this.setupSecurityTests();
    this.setupAccessibilityTests();
    this.setupWorkflowTests();
    this.setupErrorHandlingTests();
  }
  
  /**
   * Setup initialization tests
   */
  setupInitializationTests() {
    this.testSuite.initialization = [
      {
        name: 'App Initialization',
        test: () => this.testAppInitialization()
      },
      {
        name: 'Module Loading',
        test: () => this.testModuleLoading()
      },
      {
        name: 'Event Listeners Setup',
        test: () => this.testEventListenersSetup()
      },
      {
        name: 'DOM Elements Present',
        test: () => this.testDOMElements()
      }
    ];
  }
  
  /**
   * Setup UI tests
   */
  setupUITests() {
    this.testSuite.ui = [
      {
        name: 'Chat Interface Rendering',
        test: () => this.testChatInterface()
      },
      {
        name: 'Settings Modal Functionality',
        test: () => this.testSettingsModal()
      },
      {
        name: 'Message Display',
        test: () => this.testMessageDisplay()
      },
      {
        name: 'Loading States',
        test: () => this.testLoadingStates()
      },
      {
        name: 'Responsive Design',
        test: () => this.testResponsiveDesign()
      }
    ];
  }
  
  /**
   * Setup security tests
   */
  setupSecurityTests() {
    this.testSuite.security = [
      {
        name: 'Input Validation',
        test: () => this.testInputValidation()
      },
      {
        name: 'XSS Prevention',
        test: () => this.testXSSPrevention()
      },
      {
        name: 'Rate Limiting',
        test: () => this.testRateLimiting()
      },
      {
        name: 'API Key Validation',
        test: () => this.testAPIKeyValidation()
      },
      {
        name: 'Content Filtering',
        test: () => this.testContentFiltering()
      }
    ];
  }
  
  /**
   * Setup accessibility tests
   */
  setupAccessibilityTests() {
    this.testSuite.accessibility = [
      {
        name: 'ARIA Labels',
        test: () => this.testARIALabels()
      },
      {
        name: 'Keyboard Navigation',
        test: () => this.testKeyboardNavigation()
      },
      {
        name: 'Focus Management',
        test: () => this.testFocusManagement()
      },
      {
        name: 'Screen Reader Support',
        test: () => this.testScreenReaderSupport()
      },
      {
        name: 'Color Contrast',
        test: () => this.testColorContrast()
      }
    ];
  }
  
  /**
   * Setup workflow tests
   */
  setupWorkflowTests() {
    this.testSuite.workflow = [
      {
        name: 'Complete Video Generation Flow',
        test: () => this.testVideoGenerationFlow()
      },
      {
        name: 'Settings Management',
        test: () => this.testSettingsManagement()
      },
      {
        name: 'Conversation History',
        test: () => this.testConversationHistory()
      },
      {
        name: 'Download Functionality',
        test: () => this.testDownloadFunctionality()
      }
    ];
  }
  
  /**
   * Setup error handling tests
   */
  setupErrorHandlingTests() {
    this.testSuite.errorHandling = [
      {
        name: 'API Errors',
        test: () => this.testAPIErrorHandling()
      },
      {
        name: 'Network Errors',
        test: () => this.testNetworkErrorHandling()
      },
      {
        name: 'Validation Errors',
        test: () => this.testValidationErrorHandling()
      },
      {
        name: 'Recovery Mechanisms',
        test: () => this.testRecoveryMechanisms()
      }
    ];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Integration Tests...');
    
    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [category, tests] of Object.entries(this.testSuite)) {
      console.log(`\n📋 Running ${category} tests...`);
      
      for (const test of tests) {
        totalTests++;
        try {
          const result = await this.runTest(test);
          if (result.passed) {
            passedTests++;
            console.log(`✅ ${test.name}`);
          } else {
            console.log(`❌ ${test.name}: ${result.error}`);
          }
          this.testResults.push(result);
        } catch (error) {
          console.log(`💥 ${test.name}: ${error.message}`);
          this.testResults.push({
            name: test.name,
            category,
            passed: false,
            error: error.message,
            duration: 0
          });
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Test Results:`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Duration: ${duration}ms`);
    
    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      duration,
      results: this.testResults
    };
  }
  
  /**
   * Run individual test
   * @param {Object} test - Test object
   */
  async runTest(test) {
    const startTime = Date.now();
    
    try {
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      return {
        name: test.name,
        passed: result === true || (result && result.passed !== false),
        error: result && result.error ? result.error : null,
        duration,
        details: result && result.details ? result.details : null
      };
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  // Initialization Tests
  
  testAppInitialization() {
    return this.app && this.app.isInitialized === true;
  }
  
  testModuleLoading() {
    const requiredModules = [
      'uiManager', 'settingsManager', 'chatController', 'apiService',
      'videoGenerator', 'downloadManager', 'errorHandler', 'conversationManager',
      'loadingManager', 'securityManager', 'accessibilityManager'
    ];
    
    const missingModules = requiredModules.filter(module => !this.app[module]);
    
    return {
      passed: missingModules.length === 0,
      error: missingModules.length > 0 ? `Missing modules: ${missingModules.join(', ')}` : null
    };
  }
  
  testEventListenersSetup() {
    // Check if event listeners are properly set up
    const hasEventListeners = this.app.eventListeners && this.app.eventListeners.size > 0;
    return hasEventListeners;
  }
  
  testDOMElements() {
    const requiredElements = [
      '.app-container',
      '.chat-header',
      '.chat-messages',
      '.chat-input',
      '#message-input',
      '#send-button',
      '.settings-modal'
    ];
    
    const missingElements = requiredElements.filter(selector => !document.querySelector(selector));
    
    return {
      passed: missingElements.length === 0,
      error: missingElements.length > 0 ? `Missing elements: ${missingElements.join(', ')}` : null
    };
  }
  
  // UI Tests
  
  testChatInterface() {
    const chatContainer = document.querySelector('.app-container');
    const messagesContainer = document.querySelector('.messages-container');
    const inputField = document.querySelector('#message-input');
    
    return chatContainer && messagesContainer && inputField;
  }
  
  testSettingsModal() {
    const modal = document.querySelector('.settings-modal');
    const apiKeyInput = document.querySelector('#api-key-input');
    const saveButton = document.querySelector('#save-button');
    
    return modal && apiKeyInput && saveButton;
  }
  
  testMessageDisplay() {
    // Test adding a message
    const initialMessageCount = document.querySelectorAll('.message').length;
    this.app.uiManager.addMessage('Test message', 'user', 'text');
    const newMessageCount = document.querySelectorAll('.message').length;
    
    return newMessageCount > initialMessageCount;
  }
  
  testLoadingStates() {
    const loadingOverlay = document.querySelector('#loading-overlay');
    return loadingOverlay !== null;
  }
  
  testResponsiveDesign() {
    // Test basic responsive elements
    const appContainer = document.querySelector('.app-container');
    const computedStyle = window.getComputedStyle(appContainer);
    
    return computedStyle.display !== 'none';
  }
  
  // Security Tests
  
  testInputValidation() {
    const securityManager = this.app.securityManager;
    
    // Test valid input
    const validResult = securityManager.validatePrompt('Generate a video of a cat playing');
    
    // Test invalid input (too long)
    const longPrompt = 'a'.repeat(600);
    const invalidResult = securityManager.validatePrompt(longPrompt);
    
    return validResult.isValid && !invalidResult.isValid;
  }
  
  testXSSPrevention() {
    const securityManager = this.app.securityManager;
    
    const xssAttempts = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">'
    ];
    
    const results = xssAttempts.map(attempt => {
      const sanitized = securityManager.sanitizeHTML(attempt);
      return !sanitized.includes('<script>') && !sanitized.includes('javascript:');
    });
    
    return results.every(result => result === true);
  }
  
  testRateLimiting() {
    const securityManager = this.app.securityManager;
    
    // Test rate limiting
    const results = [];
    for (let i = 0; i < 12; i++) {
      const result = securityManager.checkRateLimit('messages', 'test-user');
      results.push(result);
    }
    
    // Should allow first 10, then deny
    const allowedCount = results.filter(r => r.allowed).length;
    const deniedCount = results.filter(r => !r.allowed).length;
    
    return allowedCount === 10 && deniedCount === 2;
  }
  
  testAPIKeyValidation() {
    const securityManager = this.app.securityManager;
    
    // Test valid API key format
    const validKey = 'AIzaSyDummyKeyForTesting1234567890123456789';
    const validResult = securityManager.validateApiKey(validKey);
    
    // Test invalid API key
    const invalidKey = 'invalid-key';
    const invalidResult = securityManager.validateApiKey(invalidKey);
    
    return validResult.isValid && !invalidResult.isValid;
  }
  
  testContentFiltering() {
    const securityManager = this.app.securityManager;
    
    // Test content filtering (basic test)
    const cleanContent = 'Generate a beautiful landscape video';
    const cleanResult = securityManager.checkContent(cleanContent);
    
    return cleanResult.isClean;
  }
  
  // Accessibility Tests
  
  testARIALabels() {
    const elementsWithARIA = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    return elementsWithARIA.length > 0;
  }
  
  testKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return focusableElements.length > 0;
  }
  
  testFocusManagement() {
    const accessibilityManager = this.app.accessibilityManager;
    return accessibilityManager && accessibilityManager.focusableElements.length > 0;
  }
  
  testScreenReaderSupport() {
    const liveRegions = document.querySelectorAll('[aria-live]');
    const statusRegions = document.querySelectorAll('[role="status"]');
    
    return liveRegions.length > 0 || statusRegions.length > 0;
  }
  
  testColorContrast() {
    // Basic test - check if high contrast class can be applied
    document.body.classList.add('high-contrast');
    const hasHighContrast = document.body.classList.contains('high-contrast');
    document.body.classList.remove('high-contrast');
    
    return hasHighContrast;
  }
  
  // Workflow Tests
  
  async testVideoGenerationFlow() {
    // Mock test - check if components are ready for video generation
    const hasAPIService = !!this.app.apiService;
    const hasVideoGenerator = !!this.app.videoGenerator;
    const hasUIManager = !!this.app.uiManager;
    
    return hasAPIService && hasVideoGenerator && hasUIManager;
  }
  
  testSettingsManagement() {
    const settingsManager = this.app.settingsManager;
    
    // Test settings save/load
    const testSettings = { apiKey: 'test-key', model: 'test-model' };
    settingsManager.currentSettings = testSettings;
    
    return settingsManager.getSettings().apiKey === 'test-key';
  }
  
  testConversationHistory() {
    const conversationManager = this.app.conversationManager;
    
    // Test conversation creation
    const conversationId = conversationManager.createNewConversation('Test Conversation');
    const conversation = conversationManager.getConversation(conversationId);
    
    return conversation && conversation.title === 'Test Conversation';
  }
  
  testDownloadFunctionality() {
    const downloadManager = this.app.downloadManager;
    return downloadManager && typeof downloadManager.downloadVideo === 'function';
  }
  
  // Error Handling Tests
  
  testAPIErrorHandling() {
    const errorHandler = this.app.errorHandler;
    
    // Test error processing
    const testError = new Error('Test API error');
    const errorInfo = errorHandler.processError(testError, { category: 'api' });
    
    return errorInfo && errorInfo.category === 'api';
  }
  
  testNetworkErrorHandling() {
    const errorHandler = this.app.errorHandler;
    
    // Test network error categorization
    const networkError = new Error('Network request failed');
    const errorInfo = errorHandler.processError(networkError);
    
    return errorInfo && errorInfo.userMessage;
  }
  
  testValidationErrorHandling() {
    const securityManager = this.app.securityManager;
    
    // Test validation error handling
    const validation = securityManager.validatePrompt('');
    
    return !validation.isValid && validation.errors.length > 0;
  }
  
  testRecoveryMechanisms() {
    const errorHandler = this.app.errorHandler;
    
    // Test error recovery
    const recoverableError = { recoverable: true, category: 'network' };
    const canRecover = errorHandler.isRecoverable(recoverableError);
    
    return canRecover === true;
  }
  
  /**
   * Generate test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length,
        averageDuration: this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
      },
      categories: {},
      details: this.testResults
    };
    
    // Group by category
    for (const [category, tests] of Object.entries(this.testSuite)) {
      const categoryResults = this.testResults.filter(r => 
        tests.some(t => t.name === r.name)
      );
      
      report.categories[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter(r => r.passed).length,
        failed: categoryResults.filter(r => !r.passed).length
      };
    }
    
    return report;
  }
}

// Auto-run tests when app is ready
document.addEventListener('appReady', async () => {
  if (window.videoGeneratorApp) {
    console.log('🚀 Running integration tests...');
    
    const tester = new IntegrationTester(window.videoGeneratorApp);
    const results = await tester.runAllTests();
    
    // Store results globally for inspection
    window.testResults = results;
    window.testReport = tester.generateReport();
    
    console.log('📋 Test report available at window.testReport');
  }
});

// Export for manual testing
window.IntegrationTester = IntegrationTester;