/**
 * API Service - Handles Google GenAI integration for video generation
 */
import { GoogleGenAI } from '@google/genai';

class APIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.genAI = null;
    this.defaultModel = 'veo-3.0-generate-preview';
    
    // Operation tracking
    this.activeOperations = new Map();
    
    // Rate limiting
    this.requestCount = 0;
    this.requestWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 10;
    this.requestTimes = [];
    
    if (apiKey) {
      this.initialize(apiKey);
    }
  }
  
  /**
   * Initialize the Google GenAI client
   * @param {string} apiKey - Google GenAI API key
   */
  initialize(apiKey) {
    try {
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new Error('API key is required and must be a non-empty string');
      }
      
      this.apiKey = apiKey;
      this.genAI = new GoogleGenAI(apiKey);
      console.log('Google GenAI client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google GenAI client:', error);
      
      // Provide more specific error messages
      if (error.message.includes('API Key must be set')) {
        throw new Error('Invalid API key. Please check your Google AI API key.');
      } else if (error.message.includes('API key is required')) {
        throw new Error('API key is required. Please configure your API key in settings.');
      } else {
        throw new Error('Failed to initialize API client. Please check your API key.');
      }
    }
  }
  
  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   */
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Google AI API keys typically start with 'AIza' and are 39 characters long
    return /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey);
  }
  
  /**
   * Check if API is ready for requests
   */
  isReady() {
    return Boolean(this.genAI && this.apiKey);
  }
  
  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.requestWindow);
    
    // Check if we're within limits
    return this.requestTimes.length < this.maxRequestsPerWindow;
  }
  
  /**
   * Record a new request for rate limiting
   */
  recordRequest() {
    this.requestTimes.push(Date.now());
  }
  
  /**
   * Generate video from text prompt
   * @param {string} prompt - Text description for video generation
   * @param {Object} options - Generation options
   */
  async generateVideo(prompt, options = {}) {
    if (!this.isReady()) {
      throw new Error('API service not initialized. Please configure your API key.');
    }
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt. Please provide a valid text description.');
    }
    
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }
    
    // Validate prompt length
    if (prompt.length > 500) {
      throw new Error('Prompt is too long. Please keep it under 500 characters.');
    }
    
    try {
      this.recordRequest();
      
      const model = options.model || this.defaultModel;
      const cleanPrompt = this.sanitizePrompt(prompt);
      
      console.log(`Starting video generation with model: ${model}`);
      console.log(`Prompt: ${cleanPrompt}`);
      
      // Call Google GenAI API
      const operation = await this.genAI.models.generateVideos({
        model: model,
        prompt: cleanPrompt,
        ...options
      });
      
      // Store operation for tracking
      const operationId = this.generateOperationId();
      this.activeOperations.set(operationId, {
        operation,
        startTime: Date.now(),
        prompt: cleanPrompt,
        model
      });
      
      console.log(`Video generation started. Operation ID: ${operationId}`);
      
      return {
        operationId,
        operation,
        prompt: cleanPrompt,
        model
      };
      
    } catch (error) {
      console.error('Video generation failed:', error);
      throw this.handleAPIError(error);
    }
  }
  
  /**
   * Poll operation status until completion
   * @param {string} operationId - Operation ID to poll
   * @param {Function} progressCallback - Callback for progress updates
   */
  async pollOperation(operationId, progressCallback = null) {
    const operationData = this.activeOperations.get(operationId);
    if (!operationData) {
      throw new Error('Operation not found');
    }
    
    let { operation } = operationData;
    const maxAttempts = 60; // 10 minutes with 10-second intervals
    let attempts = 0;
    
    try {
      while (!operation.done && attempts < maxAttempts) {
        attempts++;
        
        // Update progress
        if (progressCallback) {
          const elapsed = Date.now() - operationData.startTime;
          const progress = Math.min((attempts / maxAttempts) * 100, 95);
          progressCallback({
            progress,
            elapsed,
            attempts,
            status: 'generating'
          });
        }
        
        // Wait before next poll
        await this.sleep(10000); // 10 seconds
        
        try {
          // Get updated operation status
          operation = await this.genAI.operations.getVideosOperation({
            operation: operation
          });
          
          // Update stored operation
          operationData.operation = operation;
          
          console.log(`Polling attempt ${attempts}: Operation done = ${operation.done}`);
          
        } catch (pollError) {
          console.warn(`Polling attempt ${attempts} failed:`, pollError);
          
          // Continue polling unless it's a critical error
          if (attempts >= 3 && this.isCriticalError(pollError)) {
            throw pollError;
          }
        }
      }
      
      if (!operation.done) {
        throw new Error('Video generation timed out. Please try again with a shorter or simpler prompt.');
      }
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          progress: 100,
          elapsed: Date.now() - operationData.startTime,
          attempts,
          status: 'completed'
        });
      }
      
      console.log('Video generation completed successfully');
      
      // Clean up operation tracking
      this.activeOperations.delete(operationId);
      
      return operation;
      
    } catch (error) {
      console.error('Operation polling failed:', error);
      
      // Clean up operation tracking
      this.activeOperations.delete(operationId);
      
      throw this.handleAPIError(error);
    }
  }
  
  /**
   * Download generated video
   * @param {Object} videoFile - Video file object from operation response
   * @param {string} filename - Desired filename
   */
  async downloadVideo(videoFile, filename = 'generated-video.mp4') {
    if (!this.isReady()) {
      throw new Error('API service not initialized');
    }
    
    if (!videoFile) {
      throw new Error('No video file provided');
    }
    
    try {
      console.log('Starting video download...');
      
      // Download file using Google GenAI client
      const response = await this.genAI.files.download({
        file: videoFile
      });
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      console.log('Video download completed successfully');
      
      return {
        url,
        blob,
        filename,
        size: blob.size,
        type: blob.type
      };
      
    } catch (error) {
      console.error('Video download failed:', error);
      throw this.handleAPIError(error);
    }
  }
  
  /**
   * Cancel an active operation
   * @param {string} operationId - Operation ID to cancel
   */
  async cancelOperation(operationId) {
    const operationData = this.activeOperations.get(operationId);
    if (!operationData) {
      return false;
    }
    
    try {
      // Note: Google GenAI may not support operation cancellation
      // This method provides a way to stop local polling
      this.activeOperations.delete(operationId);
      console.log(`Operation ${operationId} cancelled locally`);
      return true;
    } catch (error) {
      console.error('Failed to cancel operation:', error);
      return false;
    }
  }
  
  /**
   * Get list of active operations
   */
  getActiveOperations() {
    return Array.from(this.activeOperations.entries()).map(([id, data]) => ({
      id,
      prompt: data.prompt,
      model: data.model,
      startTime: data.startTime,
      elapsed: Date.now() - data.startTime
    }));
  }
  
  /**
   * Sanitize prompt to remove potentially harmful content
   * @param {string} prompt - Raw prompt text
   */
  sanitizePrompt(prompt) {
    // Remove HTML tags and scripts
    let cleaned = prompt.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\\s+/g, ' ').trim();
    
    // Remove potentially harmful keywords (basic filtering)
    const harmfulPatterns = [
      /\\b(hack|exploit|virus|malware)\\b/gi,
      /\\b(nude|naked|sexual|explicit)\\b/gi
    ];
    
    harmfulPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '[filtered]');
    });
    
    return cleaned;
  }
  
  /**
   * Handle API errors and convert to user-friendly messages
   * @param {Error} error - Original error
   */
  handleAPIError(error) {
    console.error('API Error:', error);
    
    // Extract error details
    const errorCode = error.code || error.status;
    const errorMessage = error.message || 'Unknown error occurred';
    
    // Map common errors to user-friendly messages
    switch (errorCode) {
      case 'UNAUTHENTICATED':
      case 401:
        return new Error('Invalid API key. Please check your API key in settings.');
        
      case 'PERMISSION_DENIED':
      case 403:
        return new Error('Access denied. Please check your API key permissions.');
        
      case 'QUOTA_EXCEEDED':
      case 429:
        return new Error('API quota exceeded. Please try again later or check your billing.');
        
      case 'INVALID_ARGUMENT':
      case 400:
        return new Error('Invalid request. Please try a different prompt or check your input.');
        
      case 'NOT_FOUND':
      case 404:
        return new Error('Service not found. The video generation service may be unavailable.');
        
      case 'INTERNAL':
      case 500:
        return new Error('Internal server error. Please try again later.');
        
      case 'UNAVAILABLE':
      case 503:
        return new Error('Service temporarily unavailable. Please try again later.');
        
      default:
        // Check for network errors
        if (error.name === 'NetworkError' || errorMessage.includes('network')) {
          return new Error('Network error. Please check your internet connection.');
        }
        
        // Check for timeout errors
        if (errorMessage.includes('timeout')) {
          return new Error('Request timed out. Please try again.');
        }
        
        // Generic error
        return new Error(`Video generation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Check if error is critical and should stop polling
   * @param {Error} error - Error to check
   */
  isCriticalError(error) {
    const criticalCodes = [
      'UNAUTHENTICATED',
      'PERMISSION_DENIED',
      'INVALID_ARGUMENT',
      401, 403, 400
    ];
    
    return criticalCodes.includes(error.code) || criticalCodes.includes(error.status);
  }
  
  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Sleep utility for polling delays
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get API usage statistics
   */
  getUsageStats() {
    const now = Date.now();
    const recentRequests = this.requestTimes.filter(time => now - time < this.requestWindow);
    
    return {
      requestsInWindow: recentRequests.length,
      maxRequestsPerWindow: this.maxRequestsPerWindow,
      windowDuration: this.requestWindow,
      activeOperations: this.activeOperations.size,
      canMakeRequest: this.checkRateLimit()
    };
  }
  
  /**
   * Update API key
   * @param {string} newApiKey - New API key
   */
  updateApiKey(newApiKey) {
    if (!this.validateApiKey(newApiKey)) {
      throw new Error('Invalid API key format');
    }
    
    this.initialize(newApiKey);
  }
}

// Export for use in other modules
export default APIService;