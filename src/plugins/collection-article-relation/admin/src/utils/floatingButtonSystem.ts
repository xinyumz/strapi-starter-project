// src/plugins/collection-article-relation/admin/src/utils/floatingButtonSystem.ts
// Floating button management system

/**
 * Notification system with clickable link (no auto-redirect)
 */
function showNotification(message: string, type: 'success' | 'warning' | 'error', redirectUrl?: string) {
    const notification = document.createElement('div');

    const bgColors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    };

    const content = redirectUrl ? `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <span>${message}</span>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button 
          id="notification-link"
          style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.3)'"
          onmouseout="this.style.background='rgba(255,255,255,0.2)'"
        >
          📂 Open Collection
        </button>
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
          onmouseover="this.style.color='white'"
          onmouseout="this.style.color='rgba(255,255,255,0.7)'"
        >
          ✕
        </button>
      </div>
    </div>
  ` : `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <span>${message}</span>
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
        onmouseover="this.style.color='white'"
        onmouseout="this.style.color='rgba(255,255,255,0.7)'"
      >
        ✕
      </button>
    </div>
  `;

    notification.innerHTML = content;

    notification.style.cssText = `
    position: fixed;
    top: 50px;
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
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 380px;
  `;

    document.body.appendChild(notification);

    // Add click handlers after notification is in DOM
    if (redirectUrl) {
        const linkButton = notification.querySelector('#notification-link') as HTMLButtonElement;
        if (linkButton) {
            linkButton.onclick = () => {
                window.open(redirectUrl, '_blank');
                // Optionally close notification after clicking
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            };
        }
    }

    const closeButton = notification.querySelector('#notification-close') as HTMLButtonElement;
    if (closeButton) {
        closeButton.onclick = () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        };
    }

    // Slide in animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-hide after longer duration (no auto-redirect)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, redirectUrl ? 8000 : 4000); // Longer duration for notifications with links
}

/**
 * Create and add floating button to article pages
 */
export function addFloatingButton(articleId: string): void {
    console.log('[FloatingButton] Adding button for article:', articleId);

    const button = document.createElement('button');
    button.id = 'floating-collection-btn';
    button.innerHTML = '📚 Quick Collection';
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
  `;

    // Enhanced hover effects
    button.onmouseover = () => {
        button.style.transform = 'translateY(-2px) scale(1.05)';
        button.style.boxShadow = '0 12px 35px rgba(73, 69, 255, 0.4)';
    };

    button.onmouseout = () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 8px 25px rgba(73, 69, 255, 0.3)';
    };

    button.onclick = async () => {
        // Prevent multiple clicks
        button.disabled = true;
        button.style.opacity = '0.8';
        button.innerHTML = '⏳ Creating...';

        try {
            const response = await fetch('/collection-article-relation/quick-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ articleId: parseInt(articleId) })
            });

            const data = await response.json();

            if (data.success) {
                const { isExisting, message, redirectUrl } = data.data;

                if (isExisting) {
                    // Collection already exists
                    button.innerHTML = '📂 Exists';
                    button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

                    showNotification(`⚠️ ${message}`, 'warning', redirectUrl);
                } else {
                    // New collection created
                    button.innerHTML = '✅ Created!';
                    button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                    showNotification(`🎉 ${message}`, 'success', redirectUrl);
                }

                // Reset button after 3 seconds (no auto-redirect)
                setTimeout(() => {
                    button.innerHTML = '📚 Quick Collection';
                    button.style.background = 'linear-gradient(135deg, #4945ff 0%, #7c3aed 100%)';
                    button.disabled = false;
                    button.style.opacity = '1';
                }, 3000);

            } else {
                throw new Error('Creation failed');
            }
        } catch (error) {
            console.error('[FloatingButton] Failed to create collection:', error);
            button.innerHTML = '❌ Failed';
            button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

            showNotification('❌ Failed to create collection', 'error');

            // Reset button after 3 seconds
            setTimeout(() => {
                button.innerHTML = '📚 Quick Collection';
                button.style.background = 'linear-gradient(135deg, #4945ff 0%, #7c3aed 100%)';
                button.disabled = false;
                button.style.opacity = '1';
            }, 3000);
        }
    };

    document.body.appendChild(button);
}

/**
 * Remove floating button from page
 */
export function removeFloatingButton(): void {
    const existingButton = document.getElementById('floating-collection-btn');
    if (existingButton) {
        existingButton.remove();
    }
}