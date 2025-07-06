// src/plugins/collection-article-relation/server/routes/orphan-management-routes.ts

export default [
    // ====================================
    // ORPHAN DETECTION ROUTES
    // ====================================

    /**
     * System-wide orphan detection
     */
    {
        method: 'GET',
        path: '/orphans/detect',
        handler: 'orphanManagement.detectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Detect all orphaned collections in the system',
            tags: ['orphan-management', 'detection']
        },
    },

    /**
     * Individual collection orphan status
     */
    {
        method: 'GET',
        path: '/orphans/status/:id',
        handler: 'orphanManagement.getOrphanStatus',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Get detailed orphan status for a specific collection',
            tags: ['orphan-management', 'status']
        },
    },

    /**
     * System-wide orphan statistics
     */
    {
        method: 'GET',
        path: '/orphans/stats',
        handler: 'orphanManagement.getOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Get system-wide orphan detection statistics',
            tags: ['orphan-management', 'statistics']
        },
    },

    // ====================================
    // ORPHAN CLEANUP ROUTES
    // ====================================

    /**
     * Safe cleanup of single orphaned collection
     */
    {
        method: 'POST',
        path: '/orphans/cleanup/:id',
        handler: 'orphanManagement.cleanupOrphan',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Safely cleanup a single orphaned collection',
            tags: ['orphan-management', 'cleanup']
        },
    },

    /**
     * Bulk cleanup of multiple orphaned collections
     */
    {
        method: 'POST',
        path: '/orphans/bulk-cleanup',
        handler: 'orphanManagement.bulkCleanupOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Bulk cleanup multiple orphaned collections',
            tags: ['orphan-management', 'bulk-operations']
        },
    },

    // ====================================
    // ORPHAN REPAIR ROUTES
    // ====================================

    /**
     * Repair broken references in a collection
     */
    {
        method: 'POST',
        path: '/orphans/repair/:id',
        handler: 'orphanManagement.repairCollectionReferences',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Repair broken article references in a collection',
            tags: ['orphan-management', 'repair']
        },
    },

    // ====================================
    // MAINTENANCE ROUTES
    // ====================================

    /**
     * Automated cleanup based on configurable rules
     */
    {
        method: 'POST',
        path: '/maintenance/auto-cleanup',
        handler: 'orphanManagement.automatedCleanup',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Automated cleanup of orphaned collections based on rules',
            tags: ['maintenance', 'automation']
        },
    },

    /**
     * Preview cleanup operations without executing
     */
    {
        method: 'GET',
        path: '/maintenance/cleanup-preview',
        handler: 'orphanManagement.previewCleanup',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Preview what would be cleaned up in automated cleanup',
            tags: ['maintenance', 'preview']
        },
    },

    // ====================================
    // BATCH OPERATION ROUTES
    // ====================================

    /**
     * Batch analyze multiple collections for orphan status
     */
    {
        method: 'POST',
        path: '/batch/analyze-collections',
        handler: 'orphanManagement.batchAnalyzeCollections',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Batch analyze multiple collections for orphan status',
            tags: ['batch-operations', 'analysis']
        },
    },

    /**
     * Batch repair broken references across multiple collections
     */
    {
        method: 'POST',
        path: '/batch/repair-references',
        handler: 'orphanManagement.batchRepairReferences',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Batch repair broken references across multiple collections',
            tags: ['batch-operations', 'repair']
        },
    },

    // ====================================
    // ALTERNATIVE ROUTE PATTERNS
    // ====================================

    /**
     * Alternative REST-style paths
     */
    {
        method: 'GET',
        path: '/collections/orphaned',
        handler: 'orphanManagement.detectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Alternative path: Detect orphaned collections',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    {
        method: 'GET',
        path: '/collections/:id/orphan-status',
        handler: 'orphanManagement.getOrphanStatus',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Alternative path: Get collection orphan status',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    {
        method: 'DELETE',
        path: '/collections/:id/cleanup-orphan',
        handler: 'orphanManagement.cleanupOrphan',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Alternative path: Cleanup orphaned collection using DELETE method',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    // ====================================
    // DASHBOARD INTEGRATION ROUTES
    // ====================================

    /**
     * Dashboard widget data endpoints
     */
    {
        method: 'GET',
        path: '/dashboard/orphan-summary',
        handler: 'orphanManagement.getOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Dashboard widget data for orphan management overview',
            tags: ['dashboard', 'orphan-management']
        },
    },

    // ====================================
    // CACHE MANAGEMENT ROUTES
    // ====================================

    /**
     * Clear all orphan detection cache
     */
    {
        method: 'DELETE',
        path: '/orphans/cache',
        handler: 'orphanManagement.clearOrphanCache',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Clear all orphan detection cache for immediate refresh',
            tags: ['cache-management', 'orphan-detection']
        },
    },

    /**
     * Clear cache for specific collection
     */
    {
        method: 'DELETE',
        path: '/orphans/cache/:id',
        handler: 'orphanManagement.clearCollectionCache',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Clear orphan detection cache for a specific collection',
            tags: ['cache-management', 'collection-specific']
        },
    },

    /**
     * Get cache statistics and performance metrics
     */
    {
        method: 'GET',
        path: '/orphans/cache-stats',
        handler: 'orphanManagement.getCacheStats',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Get detailed cache statistics and performance metrics',
            tags: ['cache-management', 'statistics', 'performance']
        },
    },

    /**
     * Force orphan statistics bypassing cache
     */
    {
        method: 'GET',
        path: '/orphans/stats/force',
        handler: 'orphanManagement.forceGetOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Force orphan statistics generation bypassing cache',
            tags: ['orphan-statistics', 'cache-bypass', 'force-refresh']
        },
    },

    /**
     * Force orphan detection bypassing cache
     */
    {
        method: 'GET',
        path: '/orphans/detect/force',
        handler: 'orphanManagement.forceDetectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: {
                scope: ['admin']
            },
            description: 'Force orphan detection bypassing all cache layers',
            tags: ['orphan-detection', 'cache-bypass', 'force-refresh']
        },
    },


    // ====================================
    // REPORTING ROUTES (for future extension)
    // ====================================

    // NOTE: Commented out until handler is implemented
    // {
    //     method: 'GET',
    //     path: '/reports/orphan-export',
    //     handler: 'orphanManagement.exportOrphanData',
    //     config: {
    //         policies: [],
    //         middlewares: [],
    //         auth: {
    //             scope: ['admin']
    //         },
    //         description: 'Export orphaned collections data for analysis',
    //         tags: ['reporting', 'export']
    //     },
    // }
];