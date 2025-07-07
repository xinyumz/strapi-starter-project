// src/plugins/collection-manager/admin/src/utils/healthBadgeSystem.ts
// Dedicated health badge system for collection list pages

/**
 * URL patterns for collection list pages in Strapi v5
 */
const COLLECTION_LIST_PAGE_PATTERNS = [
    // Strapi v5 collection list patterns
    /\/admin\/content-manager\/collection-types\/api::collection\.collection$/,
    /\/admin\/content-manager\/collectionType\/api::collection\.collection$/,
    /\/content-manager\/collection-types\/api::collection\.collection$/,
    /\/content-manager\/collectionType\/api::collection\.collection$/
];

/**
 * Health badge state management
 */
let healthBadgeState = {
    isOnCollectionListPage: false,
    hasHealthBadge: false,
    debugMode: false,
    lastLoggedUrl: ''
};

/**
 * Debug logging for health badge system
 */
function debugLog(message: string, ...args: any[]) {
    if (healthBadgeState.debugMode) {
        console.log(`[HealthBadge DEBUG] ${message}`, ...args);
    }
}

/**
 * Check if current page is the collection list page
 */
function isCollectionListPage(): boolean {
    const currentPath = window.location.pathname;
    const isCollectionList = COLLECTION_LIST_PAGE_PATTERNS.some(pattern => pattern.test(currentPath));

    debugLog('Collection list page check:', {
        path: currentPath,
        isCollectionListPage: isCollectionList,
        patternsChecked: COLLECTION_LIST_PAGE_PATTERNS.length
    });

    return isCollectionList;
}

/**
 * Check if health badge exists
 */
function hasHealthBadge(): boolean {
    const exists = document.getElementById('floating-health-badge') !== null;
    debugLog('Health badge existence check:', exists);
    return exists;
}

/**
 * Fetch health data from Collection Manager API with authentication
 */
async function fetchHealthData(bypassCache: boolean = false): Promise<any> {
    try {
        debugLog('Fetching health data, bypass cache:', bypassCache);

        // Use the same endpoint as Collection Manager
        const endpoint = bypassCache
            ? '/collection-manager/health/overview/force'
            : '/collection-manager/health/overview';

        // No auth needed since endpoints are now public
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debugLog('Health data received:', data);

        // Parse the same way as Collection Manager
        let healthData;
        if (data.data?.healthOverview?.overallHealth) {
            healthData = data.data.healthOverview.overallHealth;
        } else if (data.data?.overallHealth) {
            healthData = data.data.overallHealth;
        } else if (data.data) {
            healthData = data.data;
        } else {
            healthData = data;
        }

        console.log('DEBUG: Parsed health data:', healthData);
        return healthData;

    } catch (error) {
        console.error('[HealthBadge] Error fetching health data:', error);
        return { healthScore: 100 };
    }
}

/**
 * Get health badge styling based on health score
 */
function getHealthBadgeStyles(healthScore: number): {
    color: string;
    backgroundColor: string;
    borderColor: string;
} {
    if (healthScore >= 90) {
        return {
            color: '#28a745',
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb'
        };
    } else if (healthScore >= 70) {
        return {
            color: '#856404',
            backgroundColor: '#fff3cd',
            borderColor: '#ffeaa7'
        };
    } else {
        return {
            color: '#721c24',
            backgroundColor: '#f8d7da',
            borderColor: '#f5c6cb'
        };
    }
}

/**
 * Create and add floating health badge
 */
async function addHealthBadge(): Promise<void> {
    debugLog('Adding health badge');

    // Remove existing badge if any
    removeHealthBadge();

    try {
        const healthData = await fetchHealthData();
        const healthScore = healthData.healthScore || 100;

        debugLog('Creating health badge with score:', healthScore);

        const badge = document.createElement('div');
        badge.id = 'floating-health-badge';
        badge.className = 'floating-health-badge';

        // Get styling based on health score
        const styles = getHealthBadgeStyles(healthScore);

        badge.style.cssText = `
              position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 999;
    background: ${styles.backgroundColor};
    border: 2px solid ${styles.borderColor};
    color: ${styles.color};
    border-radius: 20px;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    transition: all 0.2s ease;
    opacity: 0.95;
    user-select: none;
    white-space: nowrap;
        `;

        // Badge content - always show the health score
        if (healthScore >= 100) {
            badge.innerHTML = `✅ ${Math.round(healthScore)}% Healthy`;
        } else {
            badge.innerHTML = `${Math.round(healthScore)}% System Health`;
        }

        // Click handler - only refresh, show navigation option if needed
        let isRefreshing = false;
        badge.onclick = async (e) => {
            e.stopPropagation();

            if (isRefreshing) return;

            debugLog('Health badge clicked - immediate refresh');
            isRefreshing = true;

            // IMMEDIATE visual feedback (like Collection Manager)
            const originalContent = badge.innerHTML;
            badge.innerHTML = '🔄 Refreshing...';
            badge.style.opacity = '0.7';
            badge.style.cursor = 'wait';

            try {
                // Clear cache first with authentication (like Collection Manager does)
                const authToken = localStorage.getItem('jwtToken') ||
                    localStorage.getItem('strapi-jwt-token') ||
                    sessionStorage.getItem('jwtToken');

                if (authToken) {
                    await fetch('/collection-manager/health/cache', {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    debugLog('Cache cleared successfully');
                } else {
                    debugLog('No auth token found, skipping cache clear');
                }

                // Force refresh data
                const freshData = await fetchHealthData(true);
                debugLog('Fresh health data:', freshData);
                console.log('DEBUG: Fresh data received:', freshData);
                console.log('DEBUG: Current badge content before update:', badge.innerHTML);
                console.log('DEBUG: New health score:', freshData.healthScore);


                // Add back the animation effect (controlled delay)
                await new Promise(resolve => setTimeout(resolve, 300));

                // Update immediately when data arrives
                const newStyles = getHealthBadgeStyles(freshData.healthScore);

                if (freshData.healthScore >= 100) {
                    badge.innerHTML = `✅ ${Math.round(freshData.healthScore)}% Healthy`;
                } else {
                    badge.innerHTML = `${Math.round(freshData.healthScore)}% System Health`;
                }

                badge.style.background = newStyles.backgroundColor;
                badge.style.borderColor = newStyles.borderColor;
                badge.style.color = newStyles.color;
                badge.style.opacity = '0.95';
                badge.style.cursor = 'pointer';

                // Handle navigation option
                if (freshData.healthScore < 100) {
                    showNavigationOption();
                } else {
                    hideNavigationOption();
                }

            } catch (error) {
                console.error('[HealthBadge] Error refreshing health data:', error);
                badge.innerHTML = originalContent;
                badge.style.opacity = '0.95';
                badge.style.cursor = 'pointer';
            }

            isRefreshing = false;
        };

        // Hover effects
        badge.onmouseenter = () => {
            if (!isRefreshing) {
                badge.style.opacity = '1';
                badge.style.transform = 'scale(1.05)';
                badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }
        };

        badge.onmouseleave = () => {
            if (!isRefreshing) {
                badge.style.opacity = '0.95';
                badge.style.transform = 'scale(1)';
                badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }
        };

        // Add tooltip
        badge.title = `System health: ${Math.round(healthScore)}%\nClick to refresh data`;

        document.body.appendChild(badge);
        healthBadgeState.hasHealthBadge = true;

        debugLog('Health badge added successfully:', {
            healthScore,
            ...styles
        });

        if (healthScore < 100) {
            setTimeout(() => showNavigationOption(), 300);
        }

    } catch (error) {
        console.error('[HealthBadge] Error adding health badge:', error);
    }
}

/**
 * Show navigation option when health < 100%
 */
function showNavigationOption() {
    // Remove existing navigation button if any
    hideNavigationOption();

    const navButton = document.createElement('button');
    navButton.id = 'health-nav-button';
    navButton.innerHTML = 'Details';
    navButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 30px;
        z-index: 998;
        background: linear-gradient(135deg, #4945ff 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 8px 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.2s ease;
        opacity: 0;
        user-select: none;
        white-space: nowrap;
        transform: translateY(10px);
    `;

    navButton.onclick = () => {
        debugLog('Navigation button clicked - going to collection manager');
        window.location.href = '/admin/collection-manager';
    };

    // Hover effects
    navButton.onmouseenter = () => {
        navButton.style.transform = 'translateY(10px) scale(1.05)';
        navButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    };

    navButton.onmouseleave = () => {
        navButton.style.transform = 'translateY(10px) scale(1)';
        navButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    };

    document.body.appendChild(navButton);

    // Slide up and fade in animation
    setTimeout(() => {
        navButton.style.opacity = '0.95';
        navButton.style.transform = 'translateY(0)';
    }, 100);
}

/**
 * Hide navigation option
 */
function hideNavigationOption() {
    const existingButton = document.getElementById('health-nav-button');
    if (existingButton) {
        existingButton.style.opacity = '0';
        setTimeout(() => {
            if (existingButton.parentNode) {
                existingButton.remove();
            }
        }, 200);
    }
}

/**
 * Remove floating health badge
 */
function removeHealthBadge(): void {
    const badge = document.getElementById('floating-health-badge');
    if (badge) {
        debugLog('Removing health badge');
        badge.remove();
        healthBadgeState.hasHealthBadge = false;
    }

    // Also remove navigation button
    hideNavigationOption();
}

/**
 * Check and manage health badge based on current page
 */
async function checkAndManageHealthBadge(): Promise<void> {
    debugLog('=== Health Badge Management Check Started ===');

    const isOnCollectionList = isCollectionListPage();
    const badgeExists = hasHealthBadge();

    const stateSnapshot = {
        wasOnCollectionList: healthBadgeState.isOnCollectionListPage,
        nowOnCollectionList: isOnCollectionList,
        hadBadge: healthBadgeState.hasHealthBadge,
        hasBadge: badgeExists,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
    };

    debugLog('Health badge state comparison:', stateSnapshot);

    // Check if state actually changed
    if (
        healthBadgeState.isOnCollectionListPage === isOnCollectionList &&
        healthBadgeState.hasHealthBadge === badgeExists
    ) {
        debugLog('❌ No health badge state change detected, skipping action');
        return;
    }

    debugLog('✅ Health badge state change detected, taking action:', stateSnapshot);

    // Update state
    healthBadgeState.isOnCollectionListPage = isOnCollectionList;
    healthBadgeState.hasHealthBadge = badgeExists;

    // Manage health badge - always show on collection list page
    if (isOnCollectionList && !badgeExists) {
        debugLog('🎯 ACTION: Adding health badge for collection list page');
        await addHealthBadge();
    } else if (!isOnCollectionList && badgeExists) {
        debugLog('🎯 ACTION: Removing health badge - not on collection list page');
        removeHealthBadge();
    }

    debugLog('=== Health Badge Management Check Completed ===');
}

/**
 * Initialize health badge monitoring
 */
export function initializeHealthBadgeSystem(): void {
    debugLog('🚀 Initializing health badge system');

    // Initial check after a delay to ensure Strapi is loaded
    setTimeout(async () => {
        debugLog('🔧 Starting health badge initialization after delay');
        await checkAndManageHealthBadge();
        debugLog('✅ Health badge system initialized');
    }, 1500); // Slightly longer delay than main system
}

/**
 * Handle page navigation for health badge
 */
export async function handleHealthBadgeNavigation(): Promise<void> {
    debugLog('🔄 Handling health badge navigation');
    await checkAndManageHealthBadge();
}

/**
 * Force refresh health badge
 */
export async function refreshHealthBadge(): Promise<void> {
    debugLog('🔄 Manual health badge refresh triggered');
    if (isCollectionListPage()) {
        removeHealthBadge();
        await addHealthBadge();
    } else {
        debugLog('Not on collection list page, cannot refresh badge');
    }
}

/**
 * Cleanup health badge system
 */
export function cleanupHealthBadgeSystem(): void {
    debugLog('🛑 Cleaning up health badge system');
    removeHealthBadge();

    // Reset state
    healthBadgeState = {
        isOnCollectionListPage: false,
        hasHealthBadge: false,
        debugMode: false,
        lastLoggedUrl: ''
    };

    debugLog('✅ Health badge cleanup completed');
}

/**
 * Get health badge state (for debugging)
 */
export function getHealthBadgeState() {
    const state = {
        ...healthBadgeState,
        currentUrl: window.location.pathname,
        isCollectionListPage: isCollectionListPage(),
        badgeExists: hasHealthBadge(),
        timestamp: new Date().toISOString()
    };

    debugLog('Health badge state requested:', state);
    return state;
}

/**
 * Toggle debug mode for health badge
 */
export function toggleHealthBadgeDebug(): void {
    healthBadgeState.debugMode = !healthBadgeState.debugMode;
    console.log(`[HealthBadge] Debug mode ${healthBadgeState.debugMode ? 'enabled' : 'disabled'}`);
}

// Expose health badge functions to window for debugging
if (typeof window !== 'undefined') {
    (window as any).HealthBadgeDebug = {
        getState: getHealthBadgeState,
        refresh: refreshHealthBadge,
        toggleDebug: toggleHealthBadgeDebug,
        isCollectionListPage: isCollectionListPage,
        manualCheck: handleHealthBadgeNavigation
    };

    debugLog('Health badge debug functions exposed to window.HealthBadgeDebug');
}