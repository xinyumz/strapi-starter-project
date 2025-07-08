// src/plugins/collection-manager/admin/src/utils/floatingButtonManager.ts

import { addFloatingButton, removeFloatingButton } from './floatingButtonSystem';

/**
 * URL patterns for article edit pages in Strapi v5
 * EXCLUDES create pages to prevent invalid ID extraction
 */
const ARTICLE_EDIT_PAGE_PATTERNS = [
    // Strapi v5 primary patterns - ONLY for existing articles (not create)
    /\/admin\/content-manager\/collection-types\/api::article\.article\/([a-zA-Z0-9]{20,})$/,
    /\/admin\/content-manager\/collectionType\/api::article\.article\/([a-zA-Z0-9]{20,})$/,
    // Alternative v5 patterns with shorter IDs
    /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)$/,
    /\/admin\/content-manager\/collectionType\/api::article\.article\/(\d+)$/,
    // Legacy v4 pattern (fallback)
    /\/admin\/content-manager\/collectionType\/application::article\.article\/(\d+)$/,
    // Additional possible patterns
    /\/content-manager\/collection-types\/api::article\.article\/([^\/\?]+)$/,
    /\/content-manager\/collectionType\/api::article\.article\/([^\/\?]+)$/
];

/**
 * URL patterns for CREATE pages (where button should NOT appear)
 */
const ARTICLE_CREATE_PAGE_PATTERNS = [
    /\/admin\/content-manager\/collection-types\/api::article\.article\/create/,
    /\/admin\/content-manager\/collectionType\/api::article\.article\/create/,
    /\/content-manager\/collection-types\/api::article\.article\/create/,
    /\/content-manager\/collectionType\/api::article\.article\/create/
];

/**
 * Invalid article IDs that should never be processed
 */
const INVALID_ARTICLE_IDS = [
    'create',
    'new',
    'add',
    'edit',
    'undefined',
    'null',
    '',
    'api',
    'article'
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
 * Check if current URL is an article create page
 */
function isArticleCreatePage(): boolean {
    const currentPath = window.location.pathname;
    const isCreatePage = ARTICLE_CREATE_PAGE_PATTERNS.some(pattern => pattern.test(currentPath));

    if (isCreatePage) {
        debugLog('Detected article create page:', currentPath);
    }

    return isCreatePage;
}

/**
 * Validate extracted article ID
 */
function isValidArticleId(articleId: string | null): boolean {
    if (!articleId) return false;

    // Check against invalid IDs
    if (INVALID_ARTICLE_IDS.includes(articleId.toLowerCase())) {
        debugLog('❌ Invalid article ID detected:', articleId);
        return false;
    }

    // Check minimum length (Strapi v5 documentIds are typically 20+ chars)
    if (articleId.length < 3) {
        debugLog('❌ Article ID too short:', articleId);
        return false;
    }

    // Check for URL-like patterns that shouldn't be IDs
    if (articleId.includes('/') || articleId.includes('?') || articleId.includes('#')) {
        debugLog('❌ Article ID contains URL characters:', articleId);
        return false;
    }

    debugLog('✅ Valid article ID:', articleId);
    return true;
}

/**
 * Extract article ID from current URL using multiple patterns
 * Enhanced with create page detection and ID validation
 */
function extractArticleIdFromUrl(): string | null {
    const currentPath = window.location.pathname;

    debugLog('Testing URL patterns against:', currentPath);

    // FIRST: Check if this is a create page - if so, return null immediately
    if (isArticleCreatePage()) {
        debugLog('🚫 Create page detected - no button should be shown');
        return null;
    }

    // SECOND: Try to extract ID from edit page patterns
    for (let i = 0; i < ARTICLE_EDIT_PAGE_PATTERNS.length; i++) {
        const pattern = ARTICLE_EDIT_PAGE_PATTERNS[i];
        const match = currentPath.match(pattern);
        if (match && match[1]) {
            const extractedId = match[1];

            debugLog(`Pattern ${i + 1} matched:`, {
                pattern: pattern.toString(),
                extractedId,
                fullMatch: match[0]
            });

            // THIRD: Validate the extracted ID
            if (isValidArticleId(extractedId)) {
                debugLog('✅ Valid article ID extracted:', extractedId);
                return extractedId;
            } else {
                debugLog('❌ Invalid article ID extracted, continuing search...');
                continue;
            }
        }
    }

    debugLog('❌ No valid article ID found for URL:', currentPath);
    return null;
}

/**
 * Check if current page is an article edit page (not create page)
 */
function isArticleEditPage(): boolean {
    const currentPath = window.location.pathname;

    // Quick check: if it's a create page, return false
    if (isArticleCreatePage()) {
        return false;
    }

    // Check if it matches edit page patterns
    const isEditPage = ARTICLE_EDIT_PAGE_PATTERNS.some(pattern => pattern.test(currentPath));

    debugLog('Article edit page check:', {
        path: currentPath,
        isEditPage,
        patternsChecked: ARTICLE_EDIT_PAGE_PATTERNS.length
    });

    return isEditPage;
}

/**
 * Check if floating button already exists
 */
function hasFloatingButton(): boolean {
    const exists = document.getElementById('floating-collection-btn') !== null;
    return exists;
}

/**
 * Check and manage floating button based on current page
 */
async function checkAndManageFloatingButton(): Promise<void> {
    debugLog('=== Floating Button Management Check Started ===');

    const isOnArticleEdit = isArticleEditPage();
    const articleId = extractArticleIdFromUrl();
    const buttonExists = hasFloatingButton();
    const isCreatePage = isArticleCreatePage();

    const stateSnapshot = {
        wasOnArticle: buttonState.isOnArticlePage,
        nowOnArticleEdit: isOnArticleEdit,
        isCreatePage,
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
        buttonState.isOnArticlePage === isOnArticleEdit &&
        buttonState.currentArticleId === articleId &&
        buttonState.hasButton === buttonExists
    ) {
        debugLog('❌ No floating button state change detected, skipping action');
        return;
    }

    debugLog('✅ Floating button state change detected, taking action:', stateSnapshot);

    // Update state
    buttonState.isOnArticlePage = isOnArticleEdit;
    buttonState.currentArticleId = articleId;
    buttonState.hasButton = buttonExists;

    // Manage button based on new state
    if (isOnArticleEdit && articleId && !buttonExists) {
        debugLog('🎯 ACTION: Adding button for article:', articleId);
        addFloatingButton(articleId);
        buttonState.hasButton = true;
    } else if ((!isOnArticleEdit || !articleId) && buttonExists) {
        debugLog('🎯 ACTION: Removing button - not on valid article edit page');
        removeFloatingButton();
        buttonState.hasButton = false;
    } else if (isOnArticleEdit && articleId && buttonExists && buttonState.currentArticleId !== articleId) {
        debugLog('🎯 ACTION: Article changed, updating button:', articleId);
        removeFloatingButton();
        setTimeout(() => {
            addFloatingButton(articleId);
            buttonState.hasButton = true;
        }, 100);
    } else {
        debugLog('❓ No action taken. State:', {
            isOnArticleEdit,
            isCreatePage,
            articleId: articleId || 'null',
            buttonExists,
            reason: isCreatePage ? 'On create page (button disabled)' :
                !isOnArticleEdit ? 'Not on article edit page' :
                    !articleId ? 'No valid article ID' :
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
    const isOnArticleEdit = isArticleEditPage();
    const articleId = extractArticleIdFromUrl();

    if (isOnArticleEdit && articleId) {
        debugLog('Refreshing button for article:', articleId);
        removeFloatingButton();
        setTimeout(() => {
            addFloatingButton(articleId);
            buttonState.hasButton = true;
            buttonState.currentArticleId = articleId;
        }, 100);
    } else {
        debugLog('Not on valid article edit page, removing button if exists');
        removeFloatingButton();
        buttonState.hasButton = false;
        buttonState.currentArticleId = null;
    }

    buttonState.isOnArticlePage = isOnArticleEdit;
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
        isArticleEditPage: isArticleEditPage(),
        isCreatePage: isArticleCreatePage(),
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
        isArticleEditPage: isArticleEditPage,
        isCreatePage: isArticleCreatePage,
        extractId: extractArticleIdFromUrl,
        manualCheck: handleFloatingButtonNavigation
    };

    debugLog('Floating button debug functions exposed to window.FloatingButtonDebug');
}