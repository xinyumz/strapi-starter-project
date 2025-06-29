// src/plugins/collection-article-relation/admin/src/utils/floatingButtonSystem.ts

/**
 * Notification system with CSP compliance
 */
interface NotificationOptions {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  redirectUrl?: string;
  duration?: number;
  persistent?: boolean;
}

/**
 * Show notification with CSP compliance
 */
function showNotification(options: NotificationOptions) {
  const { message, type, redirectUrl, duration = 5000, persistent = false } = options;

  const notification = document.createElement('div');
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');

  const bgColors = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };

  // Create content without inline event handlers
  const content = redirectUrl ? `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${icons[type]}</span>
        <span>${message}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button 
          id="notification-link"
          style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
          "
        >
          📂 Open Collection
        </button>
        ${persistent ? '' : `
          <button 
            id="notification-close"
            style="
              background: transparent;
              border: none;
              color: rgba(255,255,255,0.7);
              font-size: 16px;
              cursor: pointer;
              padding: 2px;
              line-height: 1;
            "
            aria-label="Close notification"
          >
            ✕
          </button>
        `}
      </div>
    </div>
  ` : `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${icons[type]}</span>
        <span>${message}</span>
      </div>
      ${persistent ? '' : `
        <button 
          id="notification-close"
          style="
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.7);
            font-size: 16px;
            cursor: pointer;
            padding: 2px;
            line-height: 1;
          "
          aria-label="Close notification"
        >
          ✕
        </button>
      `}
    </div>
  `;

  notification.innerHTML = content;
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: ${bgColors[type]};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 380px;
    border: 1px solid rgba(255,255,255,0.1);
  `;

  document.body.appendChild(notification);

  // Add event listeners AFTER adding to DOM (CSP compliant)
  if (redirectUrl) {
    const linkButton = notification.querySelector('#notification-link') as HTMLButtonElement;
    if (linkButton) {
      // Add hover effects via event listeners (CSP compliant)
      linkButton.addEventListener('mouseenter', () => {
        linkButton.style.background = 'rgba(255,255,255,0.3)';
        linkButton.style.transform = 'scale(1.05)';
      });

      linkButton.addEventListener('mouseleave', () => {
        linkButton.style.background = 'rgba(255,255,255,0.2)';
        linkButton.style.transform = 'scale(1)';
      });

      linkButton.addEventListener('click', () => {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        if (!persistent) {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => notification.remove(), 300);
        }
      });
    }
  }

  if (!persistent) {
    const closeButton = notification.querySelector('#notification-close') as HTMLButtonElement;
    if (closeButton) {
      // Add hover effects via event listeners (CSP compliant)
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.color = 'white';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.color = 'rgba(255,255,255,0.7)';
      });

      closeButton.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      });
    }
  }

  // Slide in animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Auto-hide for non-persistent notifications
  if (!persistent) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }

  return notification;
}

/**
 * Loading state manager for button
 */
class ButtonStateManager {
  private button: HTMLButtonElement;
  private originalContent: string;
  private originalStyles: string;

  constructor(button: HTMLButtonElement) {
    this.button = button;
    this.originalContent = button.innerHTML;
    this.originalStyles = button.style.cssText;
  }

  setLoading(message: string = '⏳ Creating...') {
    this.button.disabled = true;
    this.button.style.opacity = '0.8';
    this.button.style.cursor = 'not-allowed';
    this.button.innerHTML = message;
  }

  setSuccess(message: string = '✅ Created!') {
    this.button.innerHTML = message;
    this.button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    this.button.style.cursor = 'default';
  }

  setWarning(message: string = '⚠️ Exists') {
    this.button.innerHTML = message;
    this.button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    this.button.style.cursor = 'default';
  }

  setError(message: string = '❌ Failed') {
    this.button.innerHTML = message;
    this.button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    this.button.style.cursor = 'default';
  }

  reset(delay: number = 3000) {
    setTimeout(() => {
      this.button.innerHTML = this.originalContent;
      this.button.style.cssText = this.originalStyles;
      this.button.disabled = false;
    }, delay);
  }
}

/**
 * API call with retry logic - FIXED for documentId support
 */
async function makeApiCall(articleId: string, retries: number = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // FIXED: Don't parse articleId as integer - support both documentId and numeric ID
      const response = await fetch('/collection-article-relation/quick-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ articleId: articleId }) // CHANGED: Don't parseInt here
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'API returned success: false');
      }

      return data;

    } catch (error) {
      console.error(`[FloatingButton] API call attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        throw error; // Last attempt failed
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Create and add floating button to article pages
 */
export function addFloatingButton(articleId: string): void {
  console.log('[FloatingButton] Adding button for article:', articleId);

  // Remove existing button if any
  removeFloatingButton();

  const button = document.createElement('button');
  button.id = 'floating-collection-btn';
  button.innerHTML = '📚 Quick Collection';
  button.setAttribute('aria-label', 'Create collection from this article');
  button.setAttribute('title', 'Create a new collection from this article with auto-filled fields');

  button.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 80px;
    z-index: 9999;
    background: linear-gradient(135deg, #4945ff 0%, #7c3aed 100%);
    color: white;
    border: none;
    padding: 14px 18px;
    border-radius: 28px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 25px rgba(73, 69, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    letter-gap: 0.025em;
    border: 1px solid rgba(255,255,255,0.1);
  `;

  const stateManager = new ButtonStateManager(button);

  // Hover effects with accessibility (CSP compliant)
  button.addEventListener('mouseenter', () => {
    if (!button.disabled) {
      button.style.transform = 'translateY(-2px) scale(1.05)';
      button.style.boxShadow = '0 12px 35px rgba(73, 69, 255, 0.4)';
    }
  });

  button.addEventListener('mouseleave', () => {
    if (!button.disabled) {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 8px 25px rgba(73, 69, 255, 0.3)';
    }
  });

  // Keyboard accessibility
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      button.click();
    }
  });

  // Click handler with comprehensive error handling
  button.addEventListener('click', async () => {
    // Prevent multiple clicks
    if (button.disabled) return;

    stateManager.setLoading();

    try {
      console.log('[FloatingButton] Creating collection for article:', articleId);

      const data = await makeApiCall(articleId);
      const { isExisting, message, redirectUrl } = data.data;

      if (isExisting) {
        // Collection already exists
        stateManager.setWarning();
        showNotification({
          message: `Collection already exists: ${message}`,
          type: 'warning',
          redirectUrl,
          duration: 8000
        });
      } else {
        // New collection created successfully
        stateManager.setSuccess();
        showNotification({
          message: `Collection created successfully: ${message}`,
          type: 'success',
          redirectUrl,
          duration: 8000
        });
      }

      stateManager.reset();

    } catch (error) {
      console.error('[FloatingButton] Failed to create collection:', error);

      stateManager.setError();

      // Determine error type and show appropriate message
      let errorMessage = 'Failed to create collection';
      let errorType: 'error' | 'warning' = 'error';

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication required. Please log in and try again.';
          errorType = 'warning';
        } else if (error.message.includes('404')) {
          errorMessage = 'Article not found. Please refresh the page and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      showNotification({
        message: errorMessage,
        type: errorType,
        duration: 10000
      });

      stateManager.reset(5000); // Longer reset time for errors
    }
  });

  // Add button to DOM with fade-in animation
  button.style.opacity = '0';
  document.body.appendChild(button);

  // Trigger fade-in
  setTimeout(() => {
    button.style.opacity = '1';
  }, 100);

  console.log('[FloatingButton] button added successfully');
}

/**
 * Remove floating button with fade-out animation
 */
export function removeFloatingButton(): void {
  const existingButton = document.getElementById('floating-collection-btn');
  if (existingButton) {
    console.log('[FloatingButton] Removing button with animation');

    existingButton.style.opacity = '0';
    existingButton.style.transform = 'translateY(10px)';

    setTimeout(() => {
      if (existingButton.parentNode) {
        existingButton.remove();
      }
    }, 300);
  }
}