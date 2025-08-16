/**
 * Download Manager - Handles video download functionality with progress tracking
 */
class DownloadManager {
  constructor(apiService, uiManager) {
    this.apiService = apiService;
    this.uiManager = uiManager;
    
    // Download tracking
    this.activeDownloads = new Map();
    this.downloadHistory = [];
    
    // Download configuration
    this.maxConcurrentDownloads = 3;
    this.downloadTimeout = 300000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }
  
  /**
   * Download video using Google GenAI file download API
   * @param {Object} videoFile - Video file object from API response
   * @param {string} filename - Desired filename
   * @param {Object} options - Download options
   */
  async downloadVideo(videoFile, filename = null, options = {}) {
    const downloadId = this.generateDownloadId();
    
    try {
      // Validate inputs
      if (!videoFile) {
        throw new Error('No video file provided for download');
      }
      
      if (!this.apiService.isReady()) {
        throw new Error('API service not available for download');
      }
      
      // Check concurrent download limit
      if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
        throw new Error('Too many active downloads. Please wait for current downloads to complete.');
      }
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename();
      
      // Track download
      const downloadData = {
        id: downloadId,
        filename: finalFilename,
        startTime: Date.now(),
        status: 'starting',
        progress: 0,
        attempts: 0,
        videoFile
      };
      
      this.activeDownloads.set(downloadId, downloadData);
      
      // Show download progress
      this.showDownloadProgress(downloadId, 'Starting download...');
      
      // Perform download with retry logic
      const result = await this.performDownloadWithRetry(downloadId, videoFile, finalFilename, options);
      
      // Handle successful download
      await this.handleDownloadSuccess(downloadId, result);
      
      return result;
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Handle download error
      this.handleDownloadError(downloadId, error);
      
      throw error;
    } finally {
      // Clean up
      this.cleanupDownload(downloadId);
    }
  }
  
  /**
   * Perform download with retry logic
   * @param {string} downloadId - Download ID
   * @param {Object} videoFile - Video file object
   * @param {string} filename - Filename
   * @param {Object} options - Download options
   */
  async performDownloadWithRetry(downloadId, videoFile, filename, options) {
    const downloadData = this.activeDownloads.get(downloadId);
    if (!downloadData) {
      throw new Error('Download data not found');
    }
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        downloadData.attempts = attempt;
        downloadData.status = 'downloading';
        
        if (attempt > 1) {
          this.showDownloadProgress(downloadId, `Retrying download (${attempt}/${this.retryAttempts})...`);
          await this.sleep(this.retryDelay);
        } else {
          this.showDownloadProgress(downloadId, 'Downloading video...');
        }
        
        // Perform the actual download
        const result = await this.performDownload(downloadId, videoFile, filename, options);
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`Download attempt ${attempt} failed:`, error);
        
        // Don't retry for certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
      }
    }
    
    throw lastError || new Error('Download failed after all retry attempts');
  }
  
  /**
   * Perform the actual download
   * @param {string} downloadId - Download ID
   * @param {Object} videoFile - Video file object
   * @param {string} filename - Filename
   * @param {Object} options - Download options
   */
  async performDownload(downloadId, videoFile, filename, options) {
    const downloadData = this.activeDownloads.get(downloadId);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Download timeout')), this.downloadTimeout);
    });
    
    // Create download promise
    const downloadPromise = this.executeDownload(downloadId, videoFile, filename, options);
    
    // Race between download and timeout
    const result = await Promise.race([downloadPromise, timeoutPromise]);
    
    return result;
  }
  
  /**
   * Execute the download using API service
   * @param {string} downloadId - Download ID
   * @param {Object} videoFile - Video file object
   * @param {string} filename - Filename
   * @param {Object} options - Download options
   */
  async executeDownload(downloadId, videoFile, filename, options) {
    try {
      // Update progress
      this.updateDownloadProgress(downloadId, 25, 'Requesting video file...');
      
      // Use API service to download
      const downloadResult = await this.apiService.downloadVideo(videoFile, filename);
      
      this.updateDownloadProgress(downloadId, 75, 'Processing video file...');
      
      // Validate download result
      if (!downloadResult || !downloadResult.blob) {
        throw new Error('Invalid download result received');
      }
      
      // Verify file integrity
      if (downloadResult.blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      this.updateDownloadProgress(downloadId, 90, 'Preparing download...');
      
      // Create download link and trigger download
      const downloadUrl = downloadResult.url || URL.createObjectURL(downloadResult.blob);
      
      // Trigger browser download
      this.triggerBrowserDownload(downloadUrl, filename);
      
      this.updateDownloadProgress(downloadId, 100, 'Download completed!');
      
      // Clean up URL if we created it
      if (!downloadResult.url) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
      
      return {
        ...downloadResult,
        downloadUrl,
        filename,
        downloadId
      };
      
    } catch (error) {
      console.error('Download execution failed:', error);
      throw this.enhanceDownloadError(error);
    }
  }
  
  /**
   * Trigger browser download
   * @param {string} url - Download URL
   * @param {string} filename - Filename
   */
  triggerBrowserDownload(url, filename) {
    try {
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Browser download triggered for: ${filename}`);
      
    } catch (error) {
      console.error('Failed to trigger browser download:', error);
      throw new Error('Failed to start download in browser');
    }
  }
  
  /**
   * Show download progress notification
   * @param {string} downloadId - Download ID
   * @param {string} message - Progress message
   */
  showDownloadProgress(downloadId, message) {
    const downloadData = this.activeDownloads.get(downloadId);
    if (!downloadData) return;
    
    // Show notification with progress
    this.uiManager.showNotification(
      `${downloadData.filename}: ${message}`,
      'info',
      3000
    );
    
    console.log(`Download ${downloadId}: ${message}`);
  }
  
  /**
   * Update download progress
   * @param {string} downloadId - Download ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  updateDownloadProgress(downloadId, progress, message) {
    const downloadData = this.activeDownloads.get(downloadId);
    if (!downloadData) return;
    
    downloadData.progress = progress;
    downloadData.status = message;
    
    // Dispatch progress event
    this.dispatchDownloadProgress(downloadId, progress, message);
    
    // Update UI if progress is significant
    if (progress % 25 === 0 || progress === 100) {
      this.showDownloadProgress(downloadId, message);
    }
  }
  
  /**
   * Handle successful download
   * @param {string} downloadId - Download ID
   * @param {Object} result - Download result
   */
  async handleDownloadSuccess(downloadId, result) {
    const downloadData = this.activeDownloads.get(downloadId);
    if (!downloadData) return;
    
    // Update download data
    downloadData.status = 'completed';
    downloadData.endTime = Date.now();
    downloadData.duration = downloadData.endTime - downloadData.startTime;
    downloadData.result = result;
    
    // Add to download history
    this.downloadHistory.push({
      ...downloadData,
      success: true
    });
    
    // Show success notification
    this.uiManager.showNotification(
      `Video downloaded successfully: ${result.filename}`,
      'success',
      5000
    );
    
    // Dispatch success event
    this.dispatchDownloadComplete(downloadId, {
      success: true,
      result,
      duration: downloadData.duration
    });
    
    console.log(`Download completed successfully: ${downloadId}`);
  }
  
  /**
   * Handle download error
   * @param {string} downloadId - Download ID
   * @param {Error} error - Error that occurred
   */
  handleDownloadError(downloadId, error) {
    const downloadData = this.activeDownloads.get(downloadId);
    
    // Update download data if it exists
    if (downloadData) {
      downloadData.status = 'failed';
      downloadData.error = error.message;
      downloadData.endTime = Date.now();
      
      // Add to download history
      this.downloadHistory.push({
        ...downloadData,
        success: false,
        error: error.message
      });
    }
    
    // Show error notification
    this.uiManager.showNotification(
      `Download failed: ${error.message}`,
      'error',
      5000
    );
    
    // Dispatch error event
    this.dispatchDownloadComplete(downloadId, {
      success: false,
      error: error.message
    });
    
    console.error(`Download failed: ${downloadId}`, error);
  }
  
  /**
   * Clean up download data
   * @param {string} downloadId - Download ID
   */
  cleanupDownload(downloadId) {
    this.activeDownloads.delete(downloadId);
  }
  
  /**
   * Cancel active download
   * @param {string} downloadId - Download ID to cancel
   */
  cancelDownload(downloadId) {
    const downloadData = this.activeDownloads.get(downloadId);
    if (!downloadData) {
      return false;
    }
    
    try {
      downloadData.status = 'cancelled';
      this.cleanupDownload(downloadId);
      
      this.uiManager.showNotification(
        `Download cancelled: ${downloadData.filename}`,
        'warning'
      );
      
      this.dispatchDownloadComplete(downloadId, {
        success: false,
        cancelled: true
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cancel download:', error);
      return false;
    }
  }
  
  /**
   * Check if error is non-retryable
   * @param {Error} error - Error to check
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'Invalid video file',
      'File not found',
      'Access denied',
      'Invalid API key',
      'Quota exceeded'
    ];
    
    return nonRetryableErrors.some(errorText => 
      error.message.toLowerCase().includes(errorText.toLowerCase())
    );
  }
  
  /**
   * Enhance download error with user-friendly message
   * @param {Error} error - Original error
   */
  enhanceDownloadError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network')) {
      return new Error('Network error during download. Please check your connection.');
    } else if (message.includes('timeout')) {
      return new Error('Download timed out. Please try again.');
    } else if (message.includes('quota')) {
      return new Error('Download quota exceeded. Please try again later.');
    } else if (message.includes('permission')) {
      return new Error('Permission denied. Please check your API key.');
    } else {
      return error;
    }
  }
  
  /**
   * Generate unique download ID
   */
  generateDownloadId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate filename with timestamp
   * @param {string} prefix - Filename prefix
   */
  generateFilename(prefix = 'generated-video') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.mp4`;
  }
  
  /**
   * Get active downloads
   */
  getActiveDownloads() {
    return Array.from(this.activeDownloads.values()).map(data => ({
      id: data.id,
      filename: data.filename,
      status: data.status,
      progress: data.progress,
      startTime: data.startTime,
      attempts: data.attempts
    }));
  }
  
  /**
   * Get download history
   */
  getDownloadHistory() {
    return [...this.downloadHistory];
  }
  
  /**
   * Clear download history
   */
  clearDownloadHistory() {
    this.downloadHistory = [];
  }
  
  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Dispatch download progress event
   * @param {string} downloadId - Download ID
   * @param {number} progress - Progress percentage
   * @param {string} message - Progress message
   */
  dispatchDownloadProgress(downloadId, progress, message) {
    const event = new CustomEvent('downloadProgress', {
      detail: {
        downloadId,
        progress,
        message,
        timestamp: new Date()
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Dispatch download complete event
   * @param {string} downloadId - Download ID
   * @param {Object} result - Download result
   */
  dispatchDownloadComplete(downloadId, result) {
    const event = new CustomEvent('downloadComplete', {
      detail: {
        downloadId,
        ...result,
        timestamp: new Date()
      }
    });
    document.dispatchEvent(event);
  }
}

// Export for use in other modules
export default DownloadManager;