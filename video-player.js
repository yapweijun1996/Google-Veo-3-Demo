/**
 * Video Player - Enhanced video display and playback functionality
 */
class VideoPlayer {
  constructor() {
    this.fullscreenModal = null;
    this.currentVideo = null;
    this.setupFullscreenModal();
  }
  
  /**
   * Create enhanced video content with playback controls
   * @param {string} text - Message text
   * @param {Object} options - Video options
   */
  createVideoContent(text, options = {}) {
    const container = document.createElement('div');
    container.className = 'video-message';
    
    // Add text if provided
    if (text) {
      const textElement = document.createElement('p');
      textElement.innerHTML = this.sanitizeHTML(text);
      textElement.style.marginBottom = 'var(--spacing-md)';
      container.appendChild(textElement);
    }
    
    // Create video container
    if (options.videoUrl) {
      const videoContainer = this.createVideoPlayer(options);
      container.appendChild(videoContainer);
      
      // Add video controls
      const controlsContainer = this.createVideoControls(options);
      container.appendChild(controlsContainer);
    } else if (options.loading) {
      // Show loading state
      const loadingContainer = this.createVideoLoading();
      container.appendChild(loadingContainer);
    } else if (options.error) {
      // Show error state
      const errorContainer = this.createVideoError(options.error);
      container.appendChild(errorContainer);
    }
    
    return container;
  }
  
  /**
   * Create video player element
   * @param {Object} options - Video options
   */
  createVideoPlayer(options) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    // Create video element
    const video = document.createElement('video');
    video.className = 'video-player';
    video.src = options.videoUrl;
    video.preload = 'metadata';
    video.setAttribute('aria-label', 'Generated video');
    video.controls = true;
    video.controlsList = 'nodownload'; // Hide default download button
    
    // Add video event listeners
    this.setupVideoEventListeners(video, options);
    
    videoContainer.appendChild(video);
    
    // Add video overlay with play button (for custom styling)
    if (!options.autoplay) {
      const overlay = this.createVideoOverlay(video);
      videoContainer.appendChild(overlay);
    }
    
    // Add video info overlay
    const infoOverlay = this.createVideoInfo(options);
    videoContainer.appendChild(infoOverlay);
    
    return videoContainer;
  }
  
  /**
   * Create video overlay with custom play button
   * @param {HTMLVideoElement} video - Video element
   */
  createVideoOverlay(video) {
    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    
    const playButton = document.createElement('button');
    playButton.className = 'video-play-button';
    playButton.setAttribute('aria-label', 'Play video');
    playButton.innerHTML = `
      <svg class="video-play-icon" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21"></polygon>
      </svg>
    `;
    
    playButton.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        overlay.style.display = 'none';
      }
    });
    
    // Hide overlay when video starts playing
    video.addEventListener('play', () => {
      overlay.style.display = 'none';
    });
    
    // Show overlay when video is paused
    video.addEventListener('pause', () => {
      if (!video.ended) {
        overlay.style.display = 'flex';
      }
    });
    
    overlay.appendChild(playButton);
    return overlay;
  }
  
  /**
   * Create video info overlay
   * @param {Object} options - Video options
   */
  createVideoInfo(options) {
    const infoOverlay = document.createElement('div');
    infoOverlay.className = 'video-info';
    
    const duration = document.createElement('div');
    duration.className = 'video-duration';
    duration.textContent = 'Loading...';
    
    const size = document.createElement('div');
    size.className = 'video-size';
    
    if (options.videoFile && options.videoFile.size) {
      size.textContent = this.formatFileSize(options.videoFile.size);
    }
    
    infoOverlay.appendChild(duration);
    if (size.textContent) {
      infoOverlay.appendChild(size);
    }
    
    return infoOverlay;
  }
  
  /**
   * Create video controls
   * @param {Object} options - Video options
   */
  createVideoControls(options) {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'video-controls';
    
    // Download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'video-control-button download-button';
    downloadButton.innerHTML = `
      <svg class="video-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7,10 12,15 17,10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Download
    `;
    downloadButton.addEventListener('click', () => {
      this.downloadVideo(options.videoUrl, options.filename || 'generated-video.mp4');
    });
    
    // Fullscreen button
    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'video-control-button fullscreen-button';
    fullscreenButton.innerHTML = `
      <svg class="video-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
      Fullscreen
    `;
    fullscreenButton.addEventListener('click', () => {
      this.openFullscreen(options.videoUrl);
    });
    
    // Share button (if Web Share API is supported)
    if (navigator.share) {
      const shareButton = document.createElement('button');
      shareButton.className = 'video-control-button share-button';
      shareButton.innerHTML = `
        <svg class="video-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        Share
      `;
      shareButton.addEventListener('click', () => {
        this.shareVideo(options);
      });
      controlsContainer.appendChild(shareButton);
    }
    
    controlsContainer.appendChild(downloadButton);
    controlsContainer.appendChild(fullscreenButton);
    
    return controlsContainer;
  }
  
  /**
   * Create video loading state
   */
  createVideoLoading() {
    const container = document.createElement('div');
    container.className = 'video-loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'video-loading-spinner';
    
    const text = document.createElement('div');
    text.className = 'video-loading-text';
    text.textContent = 'Preparing video...';
    
    container.appendChild(spinner);
    container.appendChild(text);
    
    return container;
  }
  
  /**
   * Create video error state
   * @param {string} errorMessage - Error message to display
   */
  createVideoError(errorMessage) {
    const container = document.createElement('div');
    container.className = 'video-error';
    
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg class="video-error-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    `;
    
    const text = document.createElement('div');
    text.className = 'video-error-text';
    text.textContent = 'Video Error';
    
    const details = document.createElement('div');
    details.className = 'video-error-details';
    details.textContent = errorMessage || 'Failed to load video';
    
    container.appendChild(icon);
    container.appendChild(text);
    container.appendChild(details);
    
    return container;
  }
  
  /**
   * Setup video event listeners
   * @param {HTMLVideoElement} video - Video element
   * @param {Object} options - Video options
   */
  setupVideoEventListeners(video, options) {
    // Update duration when metadata loads
    video.addEventListener('loadedmetadata', () => {
      const infoOverlay = video.parentElement.querySelector('.video-info');
      const durationElement = infoOverlay?.querySelector('.video-duration');
      
      if (durationElement && video.duration) {
        durationElement.textContent = this.formatDuration(video.duration);
      }
    });
    
    // Handle video errors
    video.addEventListener('error', (e) => {
      console.error('Video playback error:', e);
      const container = video.parentElement;
      const errorContainer = this.createVideoError('Failed to play video');
      container.replaceChild(errorContainer, video);
    });
    
    // Handle video loading
    video.addEventListener('loadstart', () => {
      console.log('Video loading started');
    });
    
    video.addEventListener('canplay', () => {
      console.log('Video can start playing');
    });
    
    // Track video interactions
    video.addEventListener('play', () => {
      this.trackVideoEvent('play', options);
    });
    
    video.addEventListener('pause', () => {
      this.trackVideoEvent('pause', options);
    });
    
    video.addEventListener('ended', () => {
      this.trackVideoEvent('ended', options);
    });
  }
  
  /**
   * Setup fullscreen modal
   */
  setupFullscreenModal() {
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.className = 'video-fullscreen-modal';
    modal.id = 'video-fullscreen-modal';
    
    const container = document.createElement('div');
    container.className = 'video-fullscreen-container';
    
    const video = document.createElement('video');
    video.className = 'video-fullscreen-player';
    video.controls = true;
    video.autoplay = true;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'video-fullscreen-close';
    closeButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    closeButton.addEventListener('click', () => {
      this.closeFullscreen();
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        this.closeFullscreen();
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeFullscreen();
      }
    });
    
    container.appendChild(video);
    container.appendChild(closeButton);
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    this.fullscreenModal = modal;
    this.fullscreenVideo = video;
  }
  
  /**
   * Open video in fullscreen
   * @param {string} videoUrl - Video URL
   */
  openFullscreen(videoUrl) {
    if (!this.fullscreenModal || !this.fullscreenVideo) return;
    
    this.fullscreenVideo.src = videoUrl;
    this.fullscreenModal.classList.add('open');
    this.currentVideo = videoUrl;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Close fullscreen video
   */
  closeFullscreen() {
    if (!this.fullscreenModal || !this.fullscreenVideo) return;
    
    this.fullscreenModal.classList.remove('open');
    this.fullscreenVideo.pause();
    this.fullscreenVideo.src = '';
    this.currentVideo = null;
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
  
  /**
   * Download video file
   * @param {string} url - Video URL
   * @param {string} filename - Filename for download
   */
  downloadVideo(url, filename = 'video.mp4') {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification('Video download started', 'success');
      this.trackVideoEvent('download', { filename });
    } catch (error) {
      console.error('Download failed:', error);
      this.showNotification('Failed to download video', 'error');
    }
  }
  
  /**
   * Share video using Web Share API
   * @param {Object} options - Video options
   */
  async shareVideo(options) {
    if (!navigator.share) {
      this.showNotification('Sharing not supported on this device', 'warning');
      return;
    }
    
    try {
      await navigator.share({
        title: 'Generated Video',
        text: 'Check out this AI-generated video!',
        url: options.videoUrl
      });
      
      this.trackVideoEvent('share', options);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        this.showNotification('Failed to share video', 'error');
      }
    }
  }
  
  /**
   * Format video duration
   * @param {number} seconds - Duration in seconds
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   */
  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${size} ${sizes[i]}`;
  }
  
  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    // This would typically use the UIManager's notification system
    console.log(`${type.toUpperCase()}: ${message}`);
  }
  
  /**
   * Track video events for analytics
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  trackVideoEvent(event, data = {}) {
    // Dispatch custom event for analytics tracking
    const customEvent = new CustomEvent('videoPlayerEvent', {
      detail: {
        event,
        data,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(customEvent);
  }
}

// Export for use in other modules
export default VideoPlayer;