// src/plugins/collection-manager/admin/src/utils/floatingButtonManager.ts
// High-level floating button management - handles WHEN and WHERE to show button

import { addFloatingButton, removeFloatingButton } from './floatingButtonSystem';

/**
 * URL patterns for article edit pages in Strapi v5
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
 * Floating button state management
 */
let buttonState = {
    isOnArticlePage: false,
    currentArticleId: null as string | null,
    hasButton: false,
    debugMode: false
};

/**
 * Debug logging for floating button system
 */
function debugLog(message: string, ...args: any[]) {
    if (buttonState.debugMode) {
        console.log(`[FloatingButton DEBUG] ${message}`, ...args);
    }
}

/**
 * Extract article ID from current URL using multiple patterns
 */
function extractArticleIdFromUrl(): string | null {
    const currentPath = window.location.pathname;

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
 * Check and manage floating button based on current page
 */
async function checkAndManageFloatingButton(): Promise<void> {
    debugLog('=== Floating Button Management Check Started ===');

    const isOnArticle = isArticlePage();
    const articleId = extractArticleIdFromUrl();
    const buttonExists = hasFloatingButton();

    const stateSnapshot = {
        wasOnArticle: buttonState.isOnArticlePage,
        nowOnArticle: isOnArticle,
        wasArticleId: buttonState.currentArticleId,
        nowArticleId: articleId,
        hadButton: buttonState.hasButton,
        hasButton: buttonExists,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
    };

    debugLog('Floating button state comparison:', stateSnapshot);

    // Check if state actually changed
    if (
        buttonState.isOnArticlePage === isOnArticle &&
        buttonState.currentArticleId === articleId &&
        buttonState.hasButton === buttonExists
    ) {
        debugLog('❌ No floating button state change detected, skipping action');
        return;
    }

    debugLog('✅ Floating button state change detected, taking action:', stateSnapshot);

    // Update state
    buttonState.isOnArticlePage = isOnArticle;
    buttonState.currentArticleId = articleId;
    buttonState.hasButton = buttonExists;

    // Manage button based on new state
    if (isOnArticle && articleId && !buttonExists) {
        debugLog('🎯 ACTION: Adding button for article:', articleId);
        addFloatingButton(articleId);
        buttonState.hasButton = true;
    } else if (!isOnArticle && buttonExists) {
        debugLog('🎯 ACTION: Removing button - not on article page');
        removeFloatingButton();
        buttonState.hasButton = false;
    } else if (isOnArticle && articleId && buttonExists && buttonState.currentArticleId !== articleId) {
        debugLog('🎯 ACTION: Article changed, updating button:', articleId);
        removeFloatingButton();
        setTimeout(() => {
            addFloatingButton(articleId);
            buttonState.hasButton = true;
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

    debugLog('=== Floating Button Management Check Completed ===');
}

/**
 * Initialize floating button management
 */
export function initializeFloatingButtonManager(): void {
    debugLog('🚀 Initializing floating button manager');

    // Initial check after a delay to ensure Strapi is loaded
    setTimeout(async () => {
        debugLog('🔧 Starting floating button initialization after delay');
        await checkAndManageFloatingButton();
        debugLog('✅ Floating button manager initialized');
    }, 1200); // Slightly earlier than health badge
}

/**
 * Handle page navigation for floating button
 */
export async function handleFloatingButtonNavigation(): Promise<void> {
    debugLog('🔄 Handling floating button navigation');
    await checkAndManageFloatingButton();
}

/**
 * Force refresh floating button
 */
export async function refreshFloatingButton(): Promise<void> {
    debugLog('🔄 Manual floating button refresh triggered');

    // Force re-evaluation regardless of state
    const isOnArticle = isArticlePage();
    const articleId = extractArticleIdFromUrl();

    if (isOnArticle && articleId) {
        debugLog('Refreshing button for article:', articleId);
        removeFloatingButton();
        setTimeout(() => {
            addFloatingButton(articleId);
            buttonState.hasButton = true;
            buttonState.currentArticleId = articleId;
        }, 100);
    } else {
        debugLog('Not on article page, removing button if exists');
        removeFloatingButton();
        buttonState.hasButton = false;
        buttonState.currentArticleId = null;
    }

    buttonState.isOnArticlePage = isOnArticle;
}

/**
 * Cleanup floating button manager
 */
export function cleanupFloatingButtonManager(): void {
    debugLog('🛑 Cleaning up floating button manager');
    removeFloatingButton();

    // Reset state
    buttonState = {
        isOnArticlePage: false,
        currentArticleId: null,
        hasButton: false,
        debugMode: false
    };

    debugLog('✅ Floating button cleanup completed');
}

/**
 * Get floating button state (for debugging)
 */
export function getFloatingButtonState() {
    const state = {
        ...buttonState,
        currentUrl: window.location.pathname,
        isArticlePage: isArticlePage(),
        extractedId: extractArticleIdFromUrl(),
        buttonExists: hasFloatingButton(),
        timestamp: new Date().toISOString()
    };

    debugLog('Floating button state requested:', state);
    return state;
}

/**
 * Toggle debug mode for floating button
 */
export function toggleFloatingButtonDebug(): void {
    buttonState.debugMode = !buttonState.debugMode;
    console.log(`[FloatingButton] Debug mode ${buttonState.debugMode ? 'enabled' : 'disabled'}`);
}

// Expose floating button functions to window for debugging
if (typeof window !== 'undefined') {
    (window as any).FloatingButtonDebug = {
        getState: getFloatingButtonState,
        refresh: refreshFloatingButton,
        toggleDebug: toggleFloatingButtonDebug,
        isArticlePage: isArticlePage,
        extractId: extractArticleIdFromUrl,
        manualCheck: handleFloatingButtonNavigation
    };

    debugLog('Floating button debug functions exposed to window.FloatingButtonDebug');
}