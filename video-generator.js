/**
 * Video Generator - Handles video generation workflow with polling
 */
class VideoGenerator {
  constructor(apiService, uiManager) {
    this.apiService = apiService;
    this.uiManager = uiManager;
    
    // Polling configuration
    this.pollInterval = 10000; // 10 seconds
    this.maxPollAttempts = 60; // 10 minutes total
    this.retryDelay = 5000; // 5 seconds retry delay
    this.maxRetries = 3;
    
    // Active generation tracking
    this.activeGenerations = new Map();
    
    // Progress messages
    this.progressMessages = [
      'Initializing video generation...',
      'Processing your prompt...',
      'Generating video frames...',
      'Rendering video content...',
      'Applying effects and transitions...',
      'Finalizing video output...',
      'Almost ready...'
    ];
  }
  
  /**
   * Generate video from user prompt
   * @param {string} prompt - User's video description
   * @param {Object} options - Generation options
   */
  async generateVideo(prompt, options = {}) {
    const generationId = this.generateId();
    
    try {
      // Validate inputs
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Please provide a video description');
      }
      
      if (!this.apiService.isReady()) {
        throw new Error('API not configured. Please set your API key in settings.');
      }
      
      // Check rate limits
      const usage = this.apiService.getUsageStats();
      if (!usage.canMakeRequest) {
        throw new Error('Rate limit exceeded. Please wait before generating another video.');
      }
      
      // Add loading message to chat
      const loadingMessageId = this.uiManager.addMessage(
        'Starting video generation...',
        'ai',
        'loading'
      )?.id;
      
      // Show loading overlay
      this.uiManager.showLoading('Initializing video generation...');
      
      // Track generation
      const generationData = {
        id: generationId,
        prompt,
        startTime: Date.now(),
        loadingMessageId,
        status: 'initializing',
        attempts: 0,
        retries: 0,
        progressIndex: 0
      };
      
      this.activeGenerations.set(generationId, generationData);
      
      // Start video generation
      console.log(`Starting video generation: ${generationId}`);
      const result = await this.apiService.generateVideo(prompt, options);
      
      // Update generation data
      generationData.operationId = result.operationId;
      generationData.operation = result.operation;
      generationData.status = 'generating';
      
      // Start polling
      const finalResult = await this.pollVideoGeneration(generationId);
      
      return finalResult;
      
    } catch (error) {
      console.error('Video generation failed:', error);
      
      // Clean up
      this.cleanupGeneration(generationId);
      this.uiManager.hideLoading();
      
      // Show error message
      this.uiManager.addMessage(
        `Video generation failed: ${error.message}`,
        'ai',
        'error'
      );
      
      throw error;
    }
  }
  
  /**
   * Poll video generation status until completion
   * @param {string} generationId - Generation ID to poll
   */
  async pollVideoGeneration(generationId) {
    const generationData = this.activeGenerations.get(generationId);
    if (!generationData) {
      throw new Error('Generation not found');
    }
    
    try {
      let attempts = 0;
      let operation = generationData.operation;
      
      while (!operation.done && attempts < this.maxPollAttempts) {
        attempts++;
        generationData.attempts = attempts;
        
        // Update progress
        this.updateProgress(generationId, attempts);
        
        // Wait before next poll
        await this.sleep(this.pollInterval);
        
        try {
          // Poll operation status
          operation = await this.apiService.pollOperation(
            generationData.operationId,
            (progress) => this.handleProgressUpdate(generationId, progress)
          );
          
          generationData.operation = operation;
          
          console.log(`Poll attempt ${attempts}: done = ${operation.done}`);
          
        } catch (pollError) {
          console.warn(`Poll attempt ${attempts} failed:`, pollError);
          
          // Handle polling errors with retry logic
          if (this.shouldRetryPoll(pollError, generationData)) {
            generationData.retries++;
            console.log(`Retrying poll (${generationData.retries}/${this.maxRetries})`);
            
            // Update UI with retry message
            this.updateLoadingMessage(generationId, 'Connection issue, retrying...');
            
            // Wait before retry
            await this.sleep(this.retryDelay);
            continue;
          } else {
            throw pollError;
          }
        }
      }
      
      // Check if generation completed successfully
      if (!operation.done) {
        throw new Error('Video generation timed out. Please try again with a simpler prompt.');
      }
      
      // Check for operation errors
      if (operation.error) {
        throw new Error(`Generation failed: ${operation.error.message || 'Unknown error'}`);
      }
      
      // Verify we have video results
      if (!operation.response || !operation.response.generatedVideos || operation.response.generatedVideos.length === 0) {
        throw new Error('No video was generated. Please try again.');
      }
      
      const video = operation.response.generatedVideos[0];
      
      // Update final progress
      this.updateProgress(generationId, this.maxPollAttempts, true);
      
      // Process successful generation
      const result = await this.handleGenerationSuccess(generationId, video);
      
      return result;
      
    } catch (error) {
      console.error('Polling failed:', error);
      
      // Update UI with error
      this.handleGenerationError(generationId, error);
      
      throw error;
    } finally {
      // Clean up
      this.cleanupGeneration(generationId);
    }
  }
  
  /**
   * Handle successful video generation
   * @param {string} generationId - Generation ID
   * @param {Object} video - Generated video object
   */
  async handleGenerationSuccess(generationId, video) {
    const generationData = this.activeGenerations.get(generationId);
    if (!generationData) return null;
    
    try {
      // Update loading message
      this.updateLoadingMessage(generationId, 'Preparing video for download...');
      
      // Download video
      const downloadResult = await this.apiService.downloadVideo(
        video.video,
        `generated-video-${Date.now()}.mp4`
      );
      
      // Hide loading overlay
      this.uiManager.hideLoading();
      
      // Remove loading message
      if (generationData.loadingMessageId) {
        this.uiManager.removeMessage(generationData.loadingMessageId);
      }
      
      // Add success message with video
      const successMessage = this.uiManager.addMessage(
        'Video generated successfully!',
        'ai',
        'video',
        {
          videoUrl: downloadResult.url,
          videoFile: downloadResult.blob,
          filename: downloadResult.filename
        }
      );
      
      // Calculate generation time
      const duration = Date.now() - generationData.startTime;
      const durationText = this.formatDuration(duration);
      
      // Add generation info
      this.uiManager.addMessage(
        `Generation completed in ${durationText}`,
        'ai',
        'text'
      );
      
      // Dispatch success event
      this.dispatchGenerationComplete(generationId, {
        success: true,
        video: downloadResult,
        duration,
        prompt: generationData.prompt
      });
      
      return {
        success: true,
        video: downloadResult,
        duration,
        messageElement: successMessage
      };
      
    } catch (error) {
      console.error('Failed to process successful generation:', error);
      
      // Show error but don't throw - generation was successful
      this.uiManager.addMessage(
        'Video generated but download failed. Please try again.',
        'ai',
        'error'
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Handle generation error
   * @param {string} generationId - Generation ID
   * @param {Error} error - Error that occurred
   */
  handleGenerationError(generationId, error) {
    const generationData = this.activeGenerations.get(generationId);
    
    // Hide loading overlay
    this.uiManager.hideLoading();
    
    // Remove loading message
    if (generationData?.loadingMessageId) {
      this.uiManager.removeMessage(generationData.loadingMessageId);
    }
    
    // Dispatch error event
    this.dispatchGenerationComplete(generationId, {
      success: false,
      error: error.message,
      prompt: generationData?.prompt
    });
  }
  
  /**
   * Update progress during generation
   * @param {string} generationId - Generation ID
   * @param {number} attempts - Current attempt number
   * @param {boolean} completed - Whether generation is completed
   */
  updateProgress(generationId, attempts, completed = false) {
    const generationData = this.activeGenerations.get(generationId);
    if (!generationData) return;
    
    let message;
    
    if (completed) {
      message = 'Video generation completed!';
    } else {
      // Calculate progress percentage
      const progress = Math.min((attempts / this.maxPollAttempts) * 100, 95);
      
      // Get appropriate progress message
      const messageIndex = Math.floor((progress / 100) * (this.progressMessages.length - 1));
      const baseMessage = this.progressMessages[messageIndex] || this.progressMessages[0];
      
      message = `${baseMessage} (${Math.round(progress)}%)`;
    }
    
    // Update loading overlay
    this.uiManager.updateLoadingMessage(message);
    
    // Update loading message in chat if it exists
    if (generationData.loadingMessageId) {
      this.uiManager.updateMessage(
        generationData.loadingMessageId,
        message,
        'loading'
      );
    }
  }
  
  /**
   * Handle progress updates from API service
   * @param {string} generationId - Generation ID
   * @param {Object} progress - Progress information
   */
  handleProgressUpdate(generationId, progress) {
    const generationData = this.activeGenerations.get(generationId);
    if (!generationData) return;
    
    let message = 'Generating video...';
    
    if (progress.status === 'generating') {
      const elapsed = this.formatDuration(progress.elapsed);
      message = `Generating video... (${elapsed} elapsed)`;
    } else if (progress.status === 'completed') {
      message = 'Video generation completed!';
    }
    
    this.updateLoadingMessage(generationId, message);
  }
  
  /**
   * Update loading message
   * @param {string} generationId - Generation ID
   * @param {string} message - New message
   */
  updateLoadingMessage(generationId, message) {
    this.uiManager.updateLoadingMessage(message);
    
    const generationData = this.activeGenerations.get(generationId);
    if (generationData?.loadingMessageId) {
      this.uiManager.updateMessage(
        generationData.loadingMessageId,
        message,
        'loading'
      );
    }
  }
  
  /**
   * Check if polling should be retried after error
   * @param {Error} error - Polling error
   * @param {Object} generationData - Generation data
   */
  shouldRetryPoll(error, generationData) {
    // Don't retry if we've exceeded max retries
    if (generationData.retries >= this.maxRetries) {
      return false;
    }
    
    // Don't retry critical errors
    if (this.apiService.isCriticalError && this.apiService.isCriticalError(error)) {
      return false;
    }
    
    // Retry network errors and temporary failures
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'UNAVAILABLE',
      'INTERNAL'
    ];
    
    return retryableErrors.some(errorType => 
      error.name === errorType || 
      error.code === errorType ||
      error.message.includes(errorType.toLowerCase())
    );
  }
  
  /**
   * Cancel active video generation
   * @param {string} generationId - Generation ID to cancel
   */
  async cancelGeneration(generationId) {
    const generationData = this.activeGenerations.get(generationId);
    if (!generationData) {
      return false;
    }
    
    try {
      // Cancel API operation if possible
      if (generationData.operationId) {
        await this.apiService.cancelOperation(generationData.operationId);
      }
      
      // Clean up UI
      this.cleanupGeneration(generationId);
      this.uiManager.hideLoading();
      
      // Add cancellation message
      this.uiManager.addMessage(
        'Video generation cancelled',
        'ai',
        'text'
      );
      
      // Dispatch cancellation event
      this.dispatchGenerationComplete(generationId, {
        success: false,
        cancelled: true,
        prompt: generationData.prompt
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to cancel generation:', error);
      return false;
    }
  }
  
  /**
   * Clean up generation data
   * @param {string} generationId - Generation ID to clean up
   */
  cleanupGeneration(generationId) {
    this.activeGenerations.delete(generationId);
  }
  
  /**
   * Get active generations
   */
  getActiveGenerations() {
    return Array.from(this.activeGenerations.values()).map(data => ({
      id: data.id,
      prompt: data.prompt,
      status: data.status,
      startTime: data.startTime,
      elapsed: Date.now() - data.startTime,
      attempts: data.attempts
    }));
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Format duration in human-readable format
   * @param {number} ms - Duration in milliseconds
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Dispatch generation complete event
   * @param {string} generationId - Generation ID
   * @param {Object} result - Generation result
   */
  dispatchGenerationComplete(generationId, result) {
    const event = new CustomEvent('videoGenerationComplete', {
      detail: {
        generationId,
        ...result
      }
    });
    document.dispatchEvent(event);
  }
}

// Export for use in other modules
export default VideoGenerator;