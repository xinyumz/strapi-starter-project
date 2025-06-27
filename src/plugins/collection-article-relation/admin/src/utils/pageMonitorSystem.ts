// src/plugins/collection-article-relation/admin/src/utils/pageMonitorSystem.ts
// Optimized page monitoring with event-driven approach

import { addFloatingButton, removeFloatingButton } from './floatingButtonSystem';

/**
 * URL pattern for article edit pages
 */
const ARTICLE_PAGE_PATTERN = /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/;

/**
 * Cache for current state to avoid unnecessary operations
 */
let currentState = {
    isOnArticlePage: false,
    currentArticleId: null as string | null,
    hasButton: false,
    observers: [] as MutationObserver[]
};

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
 * Debounced function to handle state changes efficiently
 */
let debounceTimeout: NodeJS.Timeout | null = null;
function debouncedStateUpdate() {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
        checkAndManageButtonOptimized();
    }, 100); // Short debounce to batch rapid changes
}

/**
 * Optimized button management with state caching
 */
function checkAndManageButtonOptimized(): void {
    const isOnArticle = isArticlePage();
    const articleId = extractArticleIdFromUrl();
    const buttonExists = hasFloatingButton();

    // Check if state actually changed
    if (
        currentState.isOnArticlePage === isOnArticle &&
        currentState.currentArticleId === articleId &&
        currentState.hasButton === buttonExists
    ) {
        return; // No change, skip processing
    }

    console.log('[PageMonitor] State change detected:', {
        wasOnArticle: currentState.isOnArticlePage,
        nowOnArticle: isOnArticle,
        wasArticleId: currentState.currentArticleId,
        nowArticleId: articleId,
        hadButton: currentState.hasButton,
        hasButton: buttonExists
    });

    // Update state
    currentState.isOnArticlePage = isOnArticle;
    currentState.currentArticleId = articleId;
    currentState.hasButton = buttonExists;

    // Manage button based on new state
    if (isOnArticle && articleId && !buttonExists) {
        // Add button if we're on an article page and button doesn't exist
        console.log('[PageMonitor] Adding button for article:', articleId);
        addFloatingButton(articleId);
        currentState.hasButton = true;
    } else if (!isOnArticle && buttonExists) {
        // Remove button if we're not on an article page but button exists
        console.log('[PageMonitor] Removing button - not on article page');
        removeFloatingButton();
        currentState.hasButton = false;
    } else if (isOnArticle && articleId && buttonExists && currentState.currentArticleId !== articleId) {
        // Article changed - update button with new ID
        console.log('[PageMonitor] Article changed, updating button:', articleId);
        removeFloatingButton();
        addFloatingButton(articleId);
    }
}

/**
 * Set up URL change monitoring using modern browser APIs
 */
function setupUrlMonitoring(): void {
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', debouncedStateUpdate);

    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
        originalPushState.apply(history, args);
        debouncedStateUpdate();
    };

    history.replaceState = function (...args) {
        originalReplaceState.apply(history, args);
        debouncedStateUpdate();
    };

    // Listen for hash changes
    window.addEventListener('hashchange', debouncedStateUpdate);
}

/**
 * Set up DOM monitoring for dynamic content changes
 */
function setupDomMonitoring(): void {
    // Monitor main content area for changes (Strapi loads content dynamically)
    const targetNode = document.querySelector('main') || document.body;

    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        for (const mutation of mutations) {
            // Check if any added nodes could affect our page detection
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasRelevantChanges = addedNodes.some(node =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node as Element).classList?.contains('content-manager') ||
                    (node as Element).querySelector?.('.content-manager')
                );

                if (hasRelevantChanges) {
                    shouldUpdate = true;
                    break;
                }
            }
        }

        if (shouldUpdate) {
            debouncedStateUpdate();
        }
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false,
        characterData: false
    });

    currentState.observers.push(observer);
}

/**
 * Initialize the optimized page monitoring system
 */
export function initializePageMonitoring(): void {
    console.log('[PageMonitor] Initializing optimized page monitoring system');

    // Initial state check
    checkAndManageButtonOptimized();

    // Set up event-driven monitoring
    setupUrlMonitoring();
    setupDomMonitoring();

    console.log('[PageMonitor] Optimized monitoring system initialized');
}

/**
 * Stop page monitoring and cleanup resources
 */
export function stopPageMonitoring(): void {
    console.log('[PageMonitor] Stopping page monitoring and cleaning up');

    // Remove floating button
    removeFloatingButton();

    // Clear debounce timeout
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
    }

    // Disconnect all observers
    currentState.observers.forEach(observer => observer.disconnect());
    currentState.observers = [];

    // Remove event listeners
    window.removeEventListener('popstate', debouncedStateUpdate);
    window.removeEventListener('hashchange', debouncedStateUpdate);

    // Reset state
    currentState = {
        isOnArticlePage: false,
        currentArticleId: null,
        hasButton: false,
        observers: []
    };

    console.log('[PageMonitor] Cleanup completed');
}

/**
 * Get current monitoring state (for debugging)
 */
export function getMonitoringState() {
    return {
        ...currentState,
        observerCount: currentState.observers.length
    };
}