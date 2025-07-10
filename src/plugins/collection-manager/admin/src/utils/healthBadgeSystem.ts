// src/plugins/collection-manager/admin/src/utils/healthBadgeSystem.ts

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
 * Debug logging for health badge system (only when debug mode is enabled)
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
        isCollectionListPage: isCollectionList
    });

    return isCollectionList;
}

/**
 * Check if health badge exists
 */
function hasHealthBadge(): boolean {
    const exists = document.getElementById('floating-health-badge') !== null;
    return exists;
}

/**
 * Fetch health data from Collection Manager API
 */
async function fetchHealthData(bypassCache: boolean = false): Promise<any> {
    try {
        const endpoint = bypassCache
            ? '/collection-manager/health/overview/force'
            : '/collection-manager/health/overview';

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

        // Parse the health data
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

        // Only log in debug mode to reduce noise
        debugLog('Health data received:', healthData);
        return healthData;

    } catch (error) {
        console.error('[HealthBadge] Error fetching health data:', error);
        return { healthScore: 100, orphanCount: 0, duplicateCount: 0 };
    }
}

/**
 * Get health badge styling based on issue count
 */
function getHealthBadgeStyles(issueCount: number): {
    color: string;
    backgroundColor: string;
    borderColor: string;
} {
    if (issueCount === 0) {
        return {
            color: '#28a745',
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb'
        };
    } else {
        // Any issues = warning/danger styling
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
    // Remove existing badge if any
    removeHealthBadge();

    try {
        const healthData = await fetchHealthData();
        const healthScore = healthData.healthScore || 100;

        // Calculate total issues from health data
        const orphanCount = healthData.orphanCount || healthData.orphanedCollections || 0;
        const duplicateCount = healthData.duplicateCount || healthData.duplicateCollections || 0;
        const totalIssues = orphanCount + duplicateCount;

        // Get styling based on issue count
        const styles = getHealthBadgeStyles(totalIssues);

        const badge = document.createElement('div');
        badge.id = 'floating-health-badge';
        badge.className = 'floating-health-badge';

        badge.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 50px;
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

        // Dynamic badge content based on issues
        if (totalIssues === 0) {
            badge.innerHTML = `✅ All Good`;
        } else {
            badge.innerHTML = `⚠️ ${totalIssues} Issue${totalIssues > 1 ? 's' : ''} Found`;
        }

        // Click handler - refresh functionality
        let isRefreshing = false;
        badge.onclick = async (e) => {
            e.stopPropagation();

            if (isRefreshing) return;
            isRefreshing = true;

            // Visual feedback
            const originalContent = badge.innerHTML;
            badge.innerHTML = '🔄 Refreshing...';
            badge.style.opacity = '0.7';
            badge.style.cursor = 'wait';

            try {
                // Clear cache first - now with simplified approach since route is auth: false
                try {
                    await fetch('/collection-manager/health/cache', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    debugLog('Cache cleared successfully');
                } catch (cacheError) {
                    // Don't fail the entire refresh if cache clear fails
                    debugLog('Cache clear failed:', cacheError);
                }

                // Get fresh data
                const freshData = await fetchHealthData(true);

                // Calculate fresh issue counts
                const freshOrphanCount = freshData.orphanCount || freshData.orphanedCollections || 0;
                const freshDuplicateCount = freshData.duplicateCount || freshData.duplicateCollections || 0;
                const freshTotalIssues = freshOrphanCount + freshDuplicateCount;
                const freshHealthScore = freshData.healthScore || 100;

                // Only log meaningful changes
                if (freshTotalIssues !== totalIssues) {
                    console.log(`[HealthBadge] Issues updated: ${totalIssues} → ${freshTotalIssues}`);
                } else if (Math.round(freshHealthScore) !== Math.round(healthScore)) {
                    console.log(`[HealthBadge] Health updated: ${Math.round(healthScore)}% → ${Math.round(freshHealthScore)}%`);
                }

                // Add animation delay
                await new Promise(resolve => setTimeout(resolve, 300));

                // Update badge with fresh data
                const newStyles = getHealthBadgeStyles(freshTotalIssues);

                if (freshTotalIssues === 0) {
                    badge.innerHTML = `✅ All Good`;
                } else {
                    badge.innerHTML = `⚠️ ${freshTotalIssues} Issue${freshTotalIssues > 1 ? 's' : ''} Found`;
                }

                badge.style.background = newStyles.backgroundColor;
                badge.style.borderColor = newStyles.borderColor;
                badge.style.color = newStyles.color;
                badge.style.opacity = '0.95';
                badge.style.cursor = 'pointer';

                // Handle navigation option - show details button if there are issues
                if (freshTotalIssues > 0) {
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

        // Add detailed tooltip
        if (totalIssues > 0) {
            const details = [];
            if (orphanCount > 0) details.push(`${orphanCount} orphaned`);
            if (duplicateCount > 0) details.push(`${duplicateCount} duplicated`);

            badge.title = `Issues: ${details.join(', ')} collections\nHealth Score: ${Math.round(healthScore)}%\nClick to refresh`;
        } else {
            badge.title = `All collections healthy\nHealth Score: ${Math.round(healthScore)}%\nClick to refresh`;
        }

        document.body.appendChild(badge);
        healthBadgeState.hasHealthBadge = true;

        debugLog('Health badge added successfully with issue count:', totalIssues);

        // Show navigation option if there are issues
        if (totalIssues > 0) {
            setTimeout(() => showNavigationOption(), 300);
        }

    } catch (error) {
        console.error('[HealthBadge] Error adding health badge:', error);
    }
}

/**
 * Show navigation option when there are issues
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
        right: 50px;
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
        window.open('/admin/collection-manager', '_blank', 'noopener,noreferrer');
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
    const isOnCollectionList = isCollectionListPage();
    const badgeExists = hasHealthBadge();

    // Only log when state actually changes to reduce noise
    if (healthBadgeState.isOnCollectionListPage !== isOnCollectionList ||
        healthBadgeState.hasHealthBadge !== badgeExists) {

        debugLog('Health badge state change detected:', {
            wasOnCollectionList: healthBadgeState.isOnCollectionListPage,
            nowOnCollectionList: isOnCollectionList,
            hadBadge: healthBadgeState.hasHealthBadge,
            hasBadge: badgeExists
        });
    }

    // Update state
    healthBadgeState.isOnCollectionListPage = isOnCollectionList;
    healthBadgeState.hasHealthBadge = badgeExists;

    // Manage health badge - always show on collection list page
    if (isOnCollectionList && !badgeExists) {
        debugLog('Adding health badge for collection list page');
        await addHealthBadge();
    } else if (!isOnCollectionList && badgeExists) {
        debugLog('Removing health badge - not on collection list page');
        removeHealthBadge();
    }
}

/**
 * Initialize health badge monitoring
 */
export function initializeHealthBadgeSystem(): void {
    debugLog('Initializing health badge system');

    // Initial check after a delay to ensure Strapi is loaded
    setTimeout(async () => {
        await checkAndManageHealthBadge();
        debugLog('Health badge system initialized');
    }, 1500);
}

/**
 * Handle page navigation for health badge
 */
export async function handleHealthBadgeNavigation(): Promise<void> {
    await checkAndManageHealthBadge();
}

/**
 * Force refresh health badge
 */
export async function refreshHealthBadge(): Promise<void> {
    debugLog('Manual health badge refresh triggered');
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
    debugLog('Cleaning up health badge system');
    removeHealthBadge();

    // Reset state
    healthBadgeState = {
        isOnCollectionListPage: false,
        hasHealthBadge: false,
        debugMode: false,
        lastLoggedUrl: ''
    };
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

// Expose health badge functions to window for debugging (only in debug mode)
if (typeof window !== 'undefined') {
    (window as any).HealthBadgeDebug = {
        getState: getHealthBadgeState,
        refresh: refreshHealthBadge,
        toggleDebug: toggleHealthBadgeDebug,
        isCollectionListPage: isCollectionListPage,
        manualCheck: handleHealthBadgeNavigation
    };

    // Only log this in debug mode
    debugLog('Health badge debug functions exposed to window.HealthBadgeDebug');
}