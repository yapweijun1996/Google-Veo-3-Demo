/**
 * Main Application Controller - Coordinates all modules and handles the complete workflow
 */
import SettingsManager from './settings-manager.js';
import UIManager from './ui-manager.js';
import ChatController from './chat-controller.js';
import APIService from './api-service.js';
import VideoGenerator from './video-generator.js';
import VideoPlayer from './video-player.js';
import DownloadManager from './download-manager.js';
import ErrorHandler from './error-handler.js';
import ConversationManager from './conversation-manager.js';
import LoadingManager from './loading-manager.js';
import SecurityManager from './security-manager.js';
import AccessibilityManager from './accessibility-manager.js';

class VideoGeneratorApp {
  constructor() {
    // Core modules
    this.uiManager = null;
    this.settingsManager = null;
    this.chatController = null;
    this.apiService = null;
    this.videoGenerator = null;
    this.videoPlayer = null;
    this.downloadManager = null;
    this.errorHandler = null;
    this.conversationManager = null;
    this.loadingManager = null;
    this.securityManager = null;
    this.accessibilityManager = null;
    
    // Application state
    this.isInitialized = false;
    this.isGenerating = false;
    this.currentSettings = null;
    
    // Event listeners storage
    this.eventListeners = new Map();
    
    this.init();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Veo 3 Video Generator...');
      
      // Initialize core modules in order
      await this.initializeModules();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup application workflow
      this.setupWorkflow();
      
      // Load initial state
      await this.loadInitialState();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('Application initialized successfully');
      
      // Dispatch ready event
      this.dispatchEvent('appReady', { timestamp: new Date() });
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.handleInitializationError(error);
    }
  }
  
  /**
   * Initialize all modules
   */
  async initializeModules() {
    // Initialize UI Manager first
    this.uiManager = new UIManager();
    
    // Initialize Error Handler early for error tracking
    this.errorHandler = new ErrorHandler(this.uiManager);
    
    // Initialize Settings Manager
    this.settingsManager = new SettingsManager();
    
    // Initialize Loading Manager
    this.loadingManager = new LoadingManager(this.uiManager);
    
    // Initialize Chat Controller
    this.chatController = new ChatController(this.uiManager);
    
    // Initialize Conversation Manager
    this.conversationManager = new ConversationManager(this.uiManager);
    
    // Initialize Video Player
    this.videoPlayer = new VideoPlayer();
    
    // Initialize API Service without an API key
    this.apiService = new APIService();
    
    // Initialize Video Generator
    this.videoGenerator = new VideoGenerator(this.apiService, this.uiManager);
    
    // Initialize Download Manager
    this.downloadManager = new DownloadManager(this.apiService, this.uiManager);
    
    // Initialize Security Manager
    this.securityManager = new SecurityManager();
    
    // Initialize Accessibility Manager
    this.accessibilityManager = new AccessibilityManager();
    
    console.log('All modules initialized');
  }
  
  /**
   * Setup event listeners for inter-module communication
   */
  setupEventListeners() {
    // Settings events
    this.addEventListener('settingsUpdated', (event) => {
      this.handleSettingsUpdated(event.detail);
    });
    
    this.addEventListener('settingsLoaded', (event) => {
      this.handleSettingsLoaded(event.detail);
    });
    
    // Message events
    this.addEventListener('messageSent', (event) => {
      this.handleMessageSent(event.detail);
    });
    
    // Video generation events
    this.addEventListener('videoGenerationComplete', (event) => {
      this.handleVideoGenerationComplete(event.detail);
    });
    
    // Download events
    this.addEventListener('downloadComplete', (event) => {
      this.handleDownloadComplete(event.detail);
    });
    
    // Error events
    this.addEventListener('applicationError', (event) => {
      this.handleApplicationError(event.detail);
    });
    
    // Loading events
    this.addEventListener('loadingProgress', (event) => {
      this.handleLoadingProgress(event.detail);
    });
    
    // Video player events
    this.addEventListener('videoPlayerEvent', (event) => {
      this.handleVideoPlayerEvent(event.detail);
    });
    
    console.log('Event listeners setup complete');
  }
  
  /**
   * Setup main application workflow
   */
  setupWorkflow() {
    // Override UI Manager's video content creation to use VideoPlayer
    if (this.uiManager.createVideoContent) {
      const originalCreateVideoContent = this.uiManager.createVideoContent;
      this.uiManager.createVideoContent = (text, options) => {
        return this.videoPlayer.createVideoContent(text, options);
      };
    } else {
      // Add the method if it doesn't exist
      this.uiManager.createVideoContent = (text, options) => {
        return this.videoPlayer.createVideoContent(text, options);
      };
    }
    
    // Enhance chat controller with video generation
    this.chatController.generateVideo = (prompt) => {
      return this.generateVideo(prompt);
    };
    
    console.log('Application workflow configured');
  }
  
  /**
   * Load initial application state
   */
  async loadInitialState() {
    try {
      // Settings are automatically loaded by SettingsManager
      // Conversations are automatically loaded by ConversationManager
      
      // Check if API is configured
      if (!this.settingsManager.hasApiKey()) {
        this.showWelcomeMessage();
      }
      
    } catch (error) {
      console.error('Failed to load initial state:', error);
      this.errorHandler.handleError(error, {
        context: 'initial_state_loading'
      });
    }
  }
  
  /**
   * Handle settings updated
   * @param {Object} settings - Updated settings
   */
  handleSettingsUpdated(settings) {
    const oldApiKey = this.currentSettings?.apiKey;
    this.currentSettings = settings;

    // Only update the API service if the key has changed to a new, valid key
    if (settings.apiKey && settings.apiKey !== oldApiKey) {
      this._initializeApiService(settings.apiKey);
    }
  }
  
  /**
   * Handle settings loaded
   * @param {Object} settings - Loaded settings
   */
  handleSettingsLoaded(settings) {
    this.currentSettings = settings;
    
    // Initialize API service if a key is available on load
    if (settings.apiKey) {
      this._initializeApiService(settings.apiKey);
    }
  }

  /**
   * Centralized method to initialize the API service with a key.
   * @param {string} apiKey
   * @private
   */
  _initializeApiService(apiKey) {
    if (this.securityManager.validateApiKey(apiKey).isValid) {
      try {
        this.apiService.initialize(apiKey);
        this.uiManager.showNotification('API key is valid and service is ready.', 'success');
      } catch (error) {
        this.errorHandler.handleError(error, {
          context: 'api_initialization'
        });
      }
    } else {
      this.uiManager.showNotification('Invalid API key format.', 'error');
    }
  }
  
  /**
   * Handle message sent
   * @param {Object} messageData - Message data
   */
  async handleMessageSent(messageData) {
    const { message } = messageData;
    
    try {
      // Security validation
      const validation = this.securityManager.validatePrompt(message);
      if (!validation.isValid) {
        this.uiManager.addMessage(
          `Invalid prompt: ${validation.errors.join(', ')}`,
          'ai',
          'error'
        );
        return;
      }
      
      // Rate limiting check
      const rateLimitCheck = this.securityManager.checkRateLimit('messages');
      if (!rateLimitCheck.allowed) {
        this.uiManager.addMessage(
          rateLimitCheck.message,
          'ai',
          'error'
        );
        return;
      }
      
      // Check if API is configured
      if (!this.settingsManager.hasApiKey()) {
        this.uiManager.addMessage(
          'Please configure your API key in settings before generating videos.',
          'ai',
          'error'
        );
        return;
      }
      
      // Generate video from user message (use sanitized prompt)
      await this.generateVideo(validation.sanitizedPrompt);
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'message_handling'
      });
    }
  }
  
  /**
   * Main video generation workflow
   * @param {string} prompt - User prompt for video generation
   */
  async generateVideo(prompt) {
    if (this.isGenerating) {
      this.uiManager.showNotification('Video generation already in progress', 'warning');
      return;
    }
    
    try {
      this.isGenerating = true;
      this.chatController.setProcessing(true);
      
      // Show loading state
      const loadingId = this.loadingManager.showLoading(
        this.loadingManager.loadingTypes.GENERATION,
        'Starting video generation...',
        {
          showProgress: true,
          cancellable: true,
          onCancel: () => this.cancelVideoGeneration()
        }
      );
      
      // Generate video
      const result = await this.videoGenerator.generateVideo(prompt, {
        model: this.currentSettings?.model || 'veo-3.0-generate-preview'
      });
      
      // Hide loading
      this.loadingManager.hideLoading(loadingId);
      
      return result;
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'video_generation',
        prompt
      });
    } finally {
      this.isGenerating = false;
      this.chatController.setProcessing(false);
    }
  }
  
  /**
   * Cancel video generation
   */
  async cancelVideoGeneration() {
    try {
      const activeGenerations = this.videoGenerator.getActiveGenerations();
      
      for (const generation of activeGenerations) {
        await this.videoGenerator.cancelGeneration(generation.id);
      }
      
      this.uiManager.showNotification('Video generation cancelled', 'info');
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'generation_cancellation'
      });
    }
  }
  
  /**
   * Handle video generation complete
   * @param {Object} result - Generation result
   */
  handleVideoGenerationComplete(result) {
    const { success, error, video, duration } = result;
    
    if (success && video) {
      // Video generation successful
      console.log(`Video generated successfully in ${duration}ms`);
      
      // Track success metrics
      this.trackEvent('video_generation_success', {
        duration,
        fileSize: video.blob?.size
      });
      
    } else if (error) {
      // Video generation failed
      console.error('Video generation failed:', error);
      
      // Track failure metrics
      this.trackEvent('video_generation_failure', {
        error: error
      });
    }
  }
  
  /**
   * Handle download complete
   * @param {Object} result - Download result
   */
  handleDownloadComplete(result) {
    const { success, error, downloadId } = result;
    
    if (success) {
      console.log(`Download completed: ${downloadId}`);
      this.trackEvent('video_download_success', { downloadId });
    } else {
      console.error(`Download failed: ${downloadId}`, error);
      this.trackEvent('video_download_failure', { downloadId, error });
    }
  }
  
  /**
   * Handle application errors
   * @param {Object} errorInfo - Error information
   */
  handleApplicationError(errorInfo) {
    // Log error for debugging
    console.error('Application error:', errorInfo);
    
    // Track error for analytics
    this.trackEvent('application_error', {
      category: errorInfo.category,
      severity: errorInfo.severity,
      message: errorInfo.message
    });
    
    // Take recovery actions if needed
    if (errorInfo.severity === 'critical') {
      this.handleCriticalError(errorInfo);
    }
  }
  
  /**
   * Handle critical errors
   * @param {Object} errorInfo - Error information
   */
  handleCriticalError(errorInfo) {
    // Show critical error message
    this.uiManager.addMessage(
      'A critical error occurred. The application may need to be refreshed.',
      'ai',
      'error'
    );
    
    // Offer recovery options
    setTimeout(() => {
      if (confirm('A critical error occurred. Would you like to refresh the application?')) {
        window.location.reload();
      }
    }, 2000);
  }
  
  /**
   * Handle loading progress
   * @param {Object} progressData - Progress data
   */
  handleLoadingProgress(progressData) {
    // Update any UI elements that need progress feedback
    console.log(`Loading progress: ${progressData.progress}% - ${progressData.message}`);
  }
  
  /**
   * Handle video player events
   * @param {Object} eventData - Video player event data
   */
  handleVideoPlayerEvent(eventData) {
    // Track video interactions
    this.trackEvent('video_player_interaction', eventData);
  }
  
  /**
   * Show welcome message for new users
   */
  showWelcomeMessage() {
    this.uiManager.addMessage(
      'Welcome! To get started, please configure your Google AI API key in the settings.',
      'ai',
      'text'
    );
    
    // Show settings hint
    setTimeout(() => {
      this.uiManager.showNotification(
        'Click the settings button (⚙️) to configure your API key',
        'info',
        5000
      );
    }, 1000);
  }
  
  /**
   * Handle initialization error
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    console.error('Initialization failed:', error);
    
    // Show basic error message
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #ef4444; margin-bottom: 20px;">
            Application Failed to Load
          </h1>
          <p style="color: #666; margin-bottom: 20px;">
            ${error.message || 'An unexpected error occurred during initialization.'}
          </p>
          <button onclick="window.location.reload()" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Add event listener
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   */
  addEventListener(eventType, handler) {
    document.addEventListener(eventType, handler);
    
    // Store for cleanup
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(handler);
  }
  
  /**
   * Dispatch custom event
   * @param {string} eventType - Event type
   * @param {Object} detail - Event detail
   */
  dispatchEvent(eventType, detail) {
    const event = new CustomEvent(eventType, { detail });
    document.dispatchEvent(event);
  }
  
  /**
   * Track analytics event
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event data
   */
  trackEvent(eventName, eventData = {}) {
    // Dispatch analytics event
    this.dispatchEvent('analyticsEvent', {
      name: eventName,
      data: eventData,
      timestamp: new Date(),
      sessionId: this.getSessionId()
    });
    
    console.log(`Analytics: ${eventName}`, eventData);
  }
  
  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('veo3-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('veo3-session-id', sessionId);
    }
    return sessionId;
  }
  
  /**
   * Get application status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      generating: this.isGenerating,
      apiConfigured: this.settingsManager?.hasApiKey() || false,
      activeGenerations: this.videoGenerator?.getActiveGenerations() || [],
      activeDownloads: this.downloadManager?.getActiveDownloads() || [],
      conversationStats: this.conversationManager?.getStats() || {},
      errorStats: this.errorHandler?.getErrorStats() || {}
    };
  }
  
  /**
   * Cleanup application
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach((handlers, eventType) => {
      handlers.forEach(handler => {
        document.removeEventListener(eventType, handler);
      });
    });
    
    // Clear timers and intervals
    if (this.conversationManager) {
      this.conversationManager.saveConversations();
    }
    
    console.log('Application cleanup completed');
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.videoGeneratorApp = new VideoGeneratorApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.videoGeneratorApp) {
    window.videoGeneratorApp.cleanup();
  }
});

// Export for module use
export default VideoGeneratorApp;