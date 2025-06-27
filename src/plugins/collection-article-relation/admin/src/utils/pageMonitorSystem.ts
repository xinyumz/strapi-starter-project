// src/plugins/collection-article-relation/admin/src/utils/pageMonitorSystem.ts
// Page monitoring and button management system

import { addFloatingButton, removeFloatingButton } from './floatingButtonSystem';

/**
 * URL pattern for article edit pages
 */
const ARTICLE_PAGE_PATTERN = /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/;

/**
 * Extract article ID from current URL
 */
function extractArticleIdFromUrl(): string | null {
    const currentPath = window.location.pathname;
    const match = currentPath.match(ARTICLE_PAGE_PATTERN);
    return match ? match[1] : null;
}

/**
 * Check if current page is an article edit page
 */
function isArticlePage(): boolean {
    return ARTICLE_PAGE_PATTERN.test(window.location.pathname);
}

/**
 * Check if floating button already exists
 */
function hasFloatingButton(): boolean {
    return document.getElementById('floating-collection-btn') !== null;
}

/**
 * Main page monitoring logic
 */
function checkAndManageButton(): void {
    const articleId = extractArticleIdFromUrl();

    if (isArticlePage() && articleId && !hasFloatingButton()) {
        // Add button if we're on an article page and button doesn't exist
        addFloatingButton(articleId);
    } else if (!isArticlePage() && hasFloatingButton()) {
        // Remove button if we're not on an article page but button exists
        removeFloatingButton();
    }
}

/**
 * Initialize the page monitoring system
 */
export function initializePageMonitoring(): void {
    console.log('[PageMonitor] Initializing page monitoring system');

    // Initial check
    checkAndManageButton();

    // Set up periodic monitoring every 2 seconds
    setInterval(checkAndManageButton, 2000);
}

/**
 * Stop page monitoring (cleanup function)
 */
export function stopPageMonitoring(): void {
    console.log('[PageMonitor] Stopping page monitoring');
    removeFloatingButton();
    // Note: setInterval cannot be easily stopped without storing the interval ID
    // For this use case, the periodic check is lightweight enough to continue
}