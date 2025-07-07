// src/plugins/collection-manager/admin/src/utils/pageMonitorSystem.ts
// Pure page monitoring and orchestration system - no specific component logic

import {
    initializeFloatingButtonManager,
    handleFloatingButtonNavigation,
    cleanupFloatingButtonManager
} from './floatingButtonManager';
import {
    initializeHealthBadgeSystem,
    handleHealthBadgeNavigation,
    cleanupHealthBadgeSystem
} from './healthBadgeSystem';

/**
 * Main page monitoring state
 */
let monitoringState = {
    isInitialized: false,
    observers: [] as MutationObserver[],
    debugMode: false,
    lastLoggedUrl: ''
};

/**
 * Debug logging for main system
 */
function debugLog(message: string, ...args: any[]) {
    if (monitoringState.debugMode) {
        console.log(`[PageMonitor MAIN] ${message}`, ...args);
    }
}

/**
 * Log URL change detection
 */
function logUrlChange() {
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== monitoringState.lastLoggedUrl) {
        debugLog('URL changed:', {
            from: monitoringState.lastLoggedUrl,
            to: currentUrl,
            timestamp: new Date().toISOString()
        });
        monitoringState.lastLoggedUrl = currentUrl;

        // Notify all subsystems of navigation
        handleNavigation();
    }
}

/**
 * Handle navigation events by notifying all subsystems
 */
async function handleNavigation(): Promise<void> {
    debugLog('🔄 Handling navigation - notifying subsystems');

    try {
        // Run subsystem navigation handlers in parallel
        await Promise.all([
            handleFloatingButtonNavigation(),
            handleHealthBadgeNavigation()
        ]);

        debugLog('✅ All subsystems notified of navigation');
    } catch (error) {
        console.error('[PageMonitor] Error during navigation handling:', error);
    }
}

/**
 * Debounced function to handle state changes efficiently
 */
let debounceTimeout: NodeJS.Timeout | null = null;
function debouncedNavigationUpdate() {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
        debugLog('Debounced navigation update triggered');
        logUrlChange(); // This will call handleNavigation if URL changed
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
 * Set up URL change monitoring using modern browser APIs
 */
function setupUrlMonitoring(): void {
    debugLog('Setting up URL monitoring');

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
        debugLog('popstate event detected:', event);
        debouncedNavigationUpdate();
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
        debouncedNavigationUpdate();
    };

    history.replaceState = function (...args) {
        debugLog('replaceState detected:', {
            state: args[0],
            title: args[1],
            url: args[2]
        });
        originalReplaceState.apply(history, args);
        debouncedNavigationUpdate();
    };

    // Listen for hash changes
    window.addEventListener('hashchange', (event) => {
        debugLog('hashchange event detected:', {
            oldURL: event.oldURL,
            newURL: event.newURL
        });
        debouncedNavigationUpdate();
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
            debouncedNavigationUpdate();
        }
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false,
        characterData: false
    });

    monitoringState.observers.push(observer);
    debugLog('DOM observer started on:', targetNode.tagName);
}

/**
 * Initialize all subsystems
 */
async function initializeSubsystems(): Promise<void> {
    debugLog('🔧 Initializing all subsystems');

    try {
        // Wait for DOM and Strapi to be ready
        await waitForDomReady();
        await waitForStrapiContent();

        // Initialize subsystems
        initializeFloatingButtonManager();
        initializeHealthBadgeSystem();

        // Initial navigation handling
        await handleNavigation();

        debugLog('✅ All subsystems initialized successfully');
    } catch (error) {
        console.error('[PageMonitor] Error during subsystem initialization:', error);
    }
}

/**
 * Initialize the main page monitoring system
 */
export function initializePageMonitoring(): void {
    if (monitoringState.isInitialized) {
        debugLog('⚠️ Page monitoring already initialized, skipping');
        return;
    }

    debugLog('🚀 Initializing main page monitoring system for Strapi v5');
    debugLog('Environment check:', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        documentTitle: document.title,
        readyState: document.readyState
    });

    // Mark as initialized
    monitoringState.isInitialized = true;

    // Add a delay to ensure Strapi admin is fully loaded
    setTimeout(async () => {
        debugLog('🔧 Starting main system initialization after delay');

        // Initialize subsystems
        await initializeSubsystems();

        // Set up monitoring infrastructure
        setupUrlMonitoring();
        setupDomMonitoring();

        debugLog('✅ Main page monitoring system fully initialized');

        // Log current state for debugging
        debugLog('Current monitoring state after initialization:', {
            ...monitoringState,
            observerCount: monitoringState.observers.length
        });
    }, 1000);
}

/**
 * Stop page monitoring and cleanup all resources
 */
export function stopPageMonitoring(): void {
    debugLog('🛑 Stopping main page monitoring and cleaning up all subsystems');

    // Cleanup all subsystems
    cleanupFloatingButtonManager();
    cleanupHealthBadgeSystem();

    // Clear debounce timeout
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
    }

    // Disconnect all observers
    monitoringState.observers.forEach(observer => observer.disconnect());
    monitoringState.observers = [];

    // Remove event listeners
    window.removeEventListener('popstate', debouncedNavigationUpdate);
    window.removeEventListener('hashchange', debouncedNavigationUpdate);

    // Reset state
    monitoringState = {
        isInitialized: false,
        observers: [],
        debugMode: false,
        lastLoggedUrl: ''
    };

    debugLog('✅ Main system cleanup completed');
}

/**
 * Get current monitoring state (for debugging)
 */
export function getMonitoringState() {
    const state = {
        ...monitoringState,
        observerCount: monitoringState.observers.length,
        currentUrl: window.location.pathname,
        timestamp: new Date().toISOString()
    };

    debugLog('Main monitoring state requested:', state);
    return state;
}

/**
 * Manual trigger for debugging - forces all subsystems to re-evaluate
 */
export function manualCheck(): void {
    debugLog('🔍 Manual check triggered by user - forcing subsystem re-evaluation');
    debugLog('Current state before manual check:', getMonitoringState());
    handleNavigation();
}

/**
 * Toggle debug mode for main system
 */
export function toggleDebugMode(): void {
    monitoringState.debugMode = !monitoringState.debugMode;
    console.log(`[PageMonitor MAIN] Debug mode ${monitoringState.debugMode ? 'enabled' : 'disabled'}`);
}

/**
 * Force complete system refresh
 */
export function forceSystemRefresh(): void {
    debugLog('🔄 Force system refresh triggered');

    if (!monitoringState.isInitialized) {
        debugLog('System not initialized, starting initialization');
        initializePageMonitoring();
    } else {
        debugLog('Forcing navigation handling for all subsystems');
        handleNavigation();
    }
}

// Expose main system functions to window for debugging
if (typeof window !== 'undefined') {
    (window as any).PageMonitorDebug = {
        getState: getMonitoringState,
        manualCheck,
        forceRefresh: forceSystemRefresh,
        toggleDebug: toggleDebugMode,
        // Easy access to subsystem debug tools
        get floating() { return (window as any).FloatingButtonDebug; },
        get health() { return (window as any).HealthBadgeDebug; }
    };

    debugLog('Main system debug functions exposed to window.PageMonitorDebug');
}