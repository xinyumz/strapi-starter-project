// src/plugins/collection-manager/admin/src/utils/pageMonitorSystem.ts
// DEBUG VERSION - Enhanced logging for Strapi v5

import { addFloatingButton, removeFloatingButton } from './floatingButtonSystem';

/**
 * URL patterns for article edit pages in Strapi v5
 * Extended patterns based on actual Strapi v5 URL structures
 */
const ARTICLE_PAGE_PATTERNS = [
    // Strapi v5 primary patterns
    /\/admin\/content-manager\/collection-types\/api::article\.article\/([a-zA-Z0-9]{20,})/,
    /\/admin\/content-manager\/collectionType\/api::article\.article\/([a-zA-Z0-9]{20,})/,
    // Alternative v5 patterns with shorter IDs
    /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/,
    /\/admin\/content-manager\/collectionType\/api::article\.article\/(\d+)/,
    // Legacy v4 pattern (fallback)
    /\/admin\/content-manager\/collectionType\/application::article\.article\/(\d+)/,
    // Additional possible patterns
    /\/content-manager\/collection-types\/api::article\.article\/([^\/\?]+)/,
    /\/content-manager\/collectionType\/api::article\.article\/([^\/\?]+)/
];

/**
 * Cache for current state to avoid unnecessary operations
 */
let currentState = {
    isOnArticlePage: false,
    currentArticleId: null as string | null,
    hasButton: false,
    observers: [] as MutationObserver[],
    lastLoggedUrl: '',
    debugMode: false
};

/**
 * Enhanced logging function
 */
function debugLog(message: string, ...args: any[]) {
    if (currentState.debugMode) {
        console.log(`[PageMonitor DEBUG] ${message}`, ...args);
    }
}

/**
 * Log URL change detection
 */
function logUrlChange() {
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== currentState.lastLoggedUrl) {
        debugLog('URL changed:', {
            from: currentState.lastLoggedUrl,
            to: currentUrl,
            timestamp: new Date().toISOString()
        });
        currentState.lastLoggedUrl = currentUrl;
    }
}

/**
 * Extract article ID from current URL using multiple patterns
 */
function extractArticleIdFromUrl(): string | null {
    const currentPath = window.location.pathname;
    logUrlChange();

    debugLog('Testing URL patterns against:', currentPath);

    for (let i = 0; i < ARTICLE_PAGE_PATTERNS.length; i++) {
        const pattern = ARTICLE_PAGE_PATTERNS[i];
        const match = currentPath.match(pattern);
        if (match) {
            debugLog(`✅ Pattern ${i + 1} matched:`, {
                pattern: pattern.toString(),
                extractedId: match[1],
                fullMatch: match[0]
            });
            return match[1];
        } else {
            debugLog(`❌ Pattern ${i + 1} failed:`, pattern.toString());
        }
    }

    debugLog('❌ No patterns matched for URL:', currentPath);
    return null;
}

/**
 * Check if current page is an article edit page
 */
function isArticlePage(): boolean {
    const currentPath = window.location.pathname;
    const isArticle = ARTICLE_PAGE_PATTERNS.some(pattern => pattern.test(currentPath));
    debugLog('Article page check:', {
        path: currentPath,
        isArticlePage: isArticle,
        patternsChecked: ARTICLE_PAGE_PATTERNS.length
    });
    return isArticle;
}

/**
 * Check if floating button already exists
 */
function hasFloatingButton(): boolean {
    const exists = document.getElementById('floating-collection-btn') !== null;
    debugLog('Button existence check:', exists);
    return exists;
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
        debugLog('Debounced state update triggered');
        checkAndManageButtonOptimized();
    }, 100);
}

/**
 * Wait for DOM elements to be ready
 */
function waitForDomReady(): Promise<void> {
    return new Promise((resolve) => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            debugLog('DOM already ready');
            resolve();
        } else {
            debugLog('Waiting for DOM ready event');
            document.addEventListener('DOMContentLoaded', () => {
                debugLog('DOM ready event fired');
                resolve();
            });
        }
    });
}

/**
 * Wait for specific Strapi content to load
 */
function waitForStrapiContent(): Promise<void> {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkContent = () => {
            attempts++;

            // Look for Strapi-specific content indicators
            const contentIndicators = [
                '.content-manager',
                '[data-strapi-header]',
                'main[role="main"]',
                '#main-content',
                '[data-testid="content-manager"]',
                '.strapi-header',
                '.content-manager-edit-view'
            ];

            const foundIndicators = contentIndicators.filter(selector =>
                document.querySelector(selector) !== null
            );

            if (attempts % 5 === 0 || foundIndicators.length > 0 || attempts >= maxAttempts) {
                debugLog(`Content check attempt ${attempts}:`, {
                    foundIndicators: foundIndicators.length,
                    totalIndicators: contentIndicators.length
                });
            }

            if (foundIndicators.length > 0) {
                debugLog('✅ Strapi content detected:', foundIndicators);
                resolve();
            } else if (attempts >= maxAttempts) {
                debugLog('⚠️ Max attempts reached, proceeding anyway');
                resolve();
            } else {
                setTimeout(checkContent, 100);
            }
        };

        checkContent();
    });
}

/**
 * Optimized button management with state caching
 */
async function checkAndManageButtonOptimized(): Promise<void> {
    debugLog('=== Button Management Check Started ===');

    // Wait for DOM and Strapi content to be ready
    await waitForDomReady();
    await waitForStrapiContent();

    const isOnArticle = isArticlePage();
    const articleId = extractArticleIdFromUrl();
    const buttonExists = hasFloatingButton();

    const stateSnapshot = {
        wasOnArticle: currentState.isOnArticlePage,
        nowOnArticle: isOnArticle,
        wasArticleId: currentState.currentArticleId,
        nowArticleId: articleId,
        hadButton: currentState.hasButton,
        hasButton: buttonExists,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
    };

    debugLog('State comparison:', stateSnapshot);

    // Check if state actually changed
    if (
        currentState.isOnArticlePage === isOnArticle &&
        currentState.currentArticleId === articleId &&
        currentState.hasButton === buttonExists
    ) {
        debugLog('❌ No state change detected, skipping action');
        return;
    }

    debugLog('✅ State change detected, taking action:', stateSnapshot);

    // Update state
    currentState.isOnArticlePage = isOnArticle;
    currentState.currentArticleId = articleId;
    currentState.hasButton = buttonExists;

    // Manage button based on new state
    if (isOnArticle && articleId && !buttonExists) {
        debugLog('🎯 ACTION: Adding button for article:', articleId);
        addFloatingButton(articleId);
        currentState.hasButton = true;
    } else if (!isOnArticle && buttonExists) {
        debugLog('🎯 ACTION: Removing button - not on article page');
        removeFloatingButton();
        currentState.hasButton = false;
    } else if (isOnArticle && articleId && buttonExists && currentState.currentArticleId !== articleId) {
        debugLog('🎯 ACTION: Article changed, updating button:', articleId);
        removeFloatingButton();
        setTimeout(() => {
            addFloatingButton(articleId);
        }, 100);
    } else {
        debugLog('❓ No action taken. State:', {
            isOnArticle,
            articleId: articleId || 'null',
            buttonExists,
            reason: !isOnArticle ? 'Not on article page' :
                !articleId ? 'No article ID' :
                    buttonExists ? 'Button already exists' : 'Unknown'
        });
    }

    debugLog('=== Button Management Check Completed ===');
}

/**
 * Set up URL change monitoring using modern browser APIs
 */
function setupUrlMonitoring(): void {
    debugLog('Setting up URL monitoring');

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
        debugLog('popstate event detected:', event);
        debouncedStateUpdate();
    });

    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
        debugLog('pushState detected:', {
            state: args[0],
            title: args[1],
            url: args[2]
        });
        originalPushState.apply(history, args);
        debouncedStateUpdate();
    };

    history.replaceState = function (...args) {
        debugLog('replaceState detected:', {
            state: args[0],
            title: args[1],
            url: args[2]
        });
        originalReplaceState.apply(history, args);
        debouncedStateUpdate();
    };

    // Listen for hash changes
    window.addEventListener('hashchange', (event) => {
        debugLog('hashchange event detected:', {
            oldURL: event.oldURL,
            newURL: event.newURL
        });
        debouncedStateUpdate();
    });

    debugLog('URL monitoring setup complete');
}

/**
 * Set up DOM monitoring for dynamic content changes
 */
function setupDomMonitoring(): void {
    debugLog('Setting up DOM monitoring');

    // Monitor main content area for changes (Strapi loads content dynamically)
    const targetSelectors = [
        'main',
        '[data-strapi-header]',
        '.content-manager',
        '#main-content',
        'body'
    ];

    let targetNode = null;
    for (const selector of targetSelectors) {
        targetNode = document.querySelector(selector);
        if (targetNode) {
            debugLog('Monitoring target found:', selector);
            break;
        }
    }

    if (!targetNode) {
        targetNode = document.body;
        debugLog('Fallback to body element');
    }

    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        let relevantChanges = [];

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasRelevantChanges = addedNodes.some(node =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (
                        (node as Element).classList?.contains('content-manager') ||
                        (node as Element).querySelector?.('.content-manager') ||
                        (node as Element).getAttribute?.('data-strapi-header') ||
                        (node as Element).querySelector?.('[data-strapi-header]') ||
                        (node as Element).tagName?.toLowerCase() === 'main'
                    )
                );

                if (hasRelevantChanges) {
                    relevantChanges.push({
                        type: mutation.type,
                        addedNodes: addedNodes.length,
                        target: (mutation.target as Element)?.tagName || 'unknown'
                    });
                    shouldUpdate = true;
                }
            }
        }

        if (shouldUpdate) {
            debugLog('Relevant DOM changes detected:', relevantChanges);
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
    debugLog('DOM observer started on:', targetNode.tagName);
}

/**
 * Initialize the optimized page monitoring system
 */
export function initializePageMonitoring(): void {
    debugLog('🚀 Initializing page monitoring system for Strapi v5');
    debugLog('Environment check:', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        documentTitle: document.title,
        readyState: document.readyState
    });

    // Add a delay to ensure Strapi admin is fully loaded
    setTimeout(async () => {
        debugLog('🔧 Starting initialization after delay');

        // Initial state check
        await checkAndManageButtonOptimized();

        // Set up event-driven monitoring
        setupUrlMonitoring();
        setupDomMonitoring();

        debugLog('✅ Page monitoring system fully initialized');

        // Log current state for debugging
        debugLog('Current state after initialization:', {
            ...currentState,
            observerCount: currentState.observers.length
        });
    }, 1000);
}

/**
 * Stop page monitoring and cleanup resources
 */
export function stopPageMonitoring(): void {
    debugLog('🛑 Stopping page monitoring and cleaning up');

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
        observers: [],
        lastLoggedUrl: '',
        debugMode: true
    };

    debugLog('✅ Cleanup completed');
}

/**
 * Get current monitoring state (for debugging)
 */
export function getMonitoringState() {
    const state = {
        ...currentState,
        observerCount: currentState.observers.length,
        currentUrl: window.location.pathname,
        isArticlePage: isArticlePage(),
        extractedId: extractArticleIdFromUrl(),
        buttonExists: hasFloatingButton(),
        timestamp: new Date().toISOString()
    };

    debugLog('Current state requested:', state);
    return state;
}

/**
 * Manual trigger for debugging
 */
export function manualCheck(): void {
    debugLog('🔍 Manual check triggered by user');
    debugLog('Current state before manual check:', getMonitoringState());
    checkAndManageButtonOptimized();
}

/**
 * Toggle debug mode
 */
export function toggleDebugMode(): void {
    currentState.debugMode = !currentState.debugMode;
    console.log(`[PageMonitor] Debug mode ${currentState.debugMode ? 'enabled' : 'disabled'}`);
}

// Expose functions to window for debugging in browser console
if (typeof window !== 'undefined') {
    (window as any).PageMonitorDebug = {
        getState: getMonitoringState,
        manualCheck,
        toggleDebug: toggleDebugMode,
        extractId: extractArticleIdFromUrl,
        isArticlePage: isArticlePage
    };

    debugLog('Debug functions exposed to window.PageMonitorDebug');
}